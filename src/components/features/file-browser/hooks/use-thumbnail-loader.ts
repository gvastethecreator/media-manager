import type * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageResources } from '@/store/image-resources.store';

const thumbnailLogger = clientLogger.withContext('ThumbnailLoader');

/**
 * Resultado del hook useThumbnailLoader
 */
interface UseThumbnailLoaderResult {
	loadThumbnail: (itemId: string) => Promise<string | null>;
	loadQueueRef: React.MutableRefObject<Set<string>>;
	retryCountRef: React.MutableRefObject<Map<string, number>>;
}

/**
 * Hook para gestionar la carga optimizada de miniaturas
 *
 * Este hook proporciona:
 * - Carga eficiente de miniaturas con gestión de cola
 * - Sistema de reintentos para miniaturas que fallan
 * - Seguimiento de miniaturas en proceso de carga
 * - Integración con el store de recursos de imágenes
 *
 * @returns Objeto con función de carga y referencias a colas de carga
 */
export function useThumbnailLoader(): UseThumbnailLoaderResult {
	const imageResources = useImageResources();

	// Referencia para la cola de carga
	const loadQueueRef = useRef<Set<string>>(new Set());
	const retryCountRef = useRef<Map<string, number>>(new Map());
	const MAX_RETRIES = 3;

	// Resetea errores anteriores al montar el componente
	useEffect(() => {
		// Limpiar colas al montar para evitar estados obsoletos
		loadQueueRef.current.clear();
		return () => {
			// Limpiar al desmontar para evitar memory leaks
			loadQueueRef.current.clear();
		};
	}, []);

	// Función mejorada para cargar thumbnails con reintentos
	const loadThumbnail = useCallback(
		async (itemId: string) => {
			// Validar que el ID sea válido
			if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
				thumbnailLogger.error(`❌ Intento de cargar thumbnail con ID inválido: "${itemId}"`);
				return null;
			}

			// Verificar si ya está en proceso de carga
			if (loadQueueRef.current.has(itemId)) {
				thumbnailLogger.debug(`⏳ Thumbnail ${itemId} ya está en cola de carga, omitiendo`);
				return null;
			}

			// Verificar reintentos
			const retryCount = retryCountRef.current.get(itemId) || 0;
			if (retryCount >= MAX_RETRIES) {
				// Si hemos superado el máximo de reintentos, logeamos pero no intentamos de nuevo
				if (retryCount === MAX_RETRIES) {
					thumbnailLogger.warn(`⚠️ Máximo de reintentos alcanzado (${MAX_RETRIES}) para thumbnail ${itemId}`);
					// Incrementamos una vez más para evitar logs repetidos
					retryCountRef.current.set(itemId, retryCount + 1);
				}
				return null;
			}

			try {
				loadQueueRef.current.add(itemId);
				thumbnailLogger.debug(`🔄 Iniciando carga de thumbnail: ${itemId}`);

				// Obtener el recurso actual si existe
				const currentResource = imageResources.resources.get(itemId);
				if (currentResource?.thumbnail) {
					thumbnailLogger.debug(`✅ Thumbnail ${itemId} ya existe en caché, reutilizando`);
					loadQueueRef.current.delete(itemId);
					return currentResource.thumbnail;
				}

				// Obtenemos el thumbnail desde el store
				let thumbnail: string | undefined;
				try {
					thumbnailLogger.debug(`📡 Solicitando thumbnail al store: ${itemId}`);
					thumbnail = await imageResources.getThumbnail(itemId);

					// Verificar explícitamente si thumbnail es undefined o vacío
					if (!thumbnail) {
						thumbnailLogger.warn(`⚠️ getThumbnail devolvió valor vacío para ID ${itemId}`);
					} else {
						thumbnailLogger.debug(
							`✅ getThumbnail devolvió URL para ${itemId}: ${thumbnail.substring(0, 30)}${thumbnail.length > 30 ? '...' : ''}`
						);
					}
				} catch (fetchError) {
					thumbnailLogger.error(`❌ Error al obtener thumbnail desde el store para ${itemId}:`, fetchError);
					thumbnail = undefined;
				}

				// Asegurarnos de que la referencia siga siendo válida
				if (!loadQueueRef.current) {
					thumbnailLogger.warn(`⚠️ Componente desmontado durante carga de ${itemId}`);
					return null; // El componente se ha desmontado
				}

				loadQueueRef.current.delete(itemId);

				if (thumbnail) {
					// Minimizamos logs innecesarios
					thumbnailLogger.debug(`✅ Thumbnail cargado exitosamente: ${itemId}`);
					retryCountRef.current.delete(itemId);

					// Comprobar que la URL es realmente válida
					if (thumbnail.startsWith('/api/images/') || thumbnail.startsWith('data:')) {
						return thumbnail;
					}
					thumbnailLogger.warn(`⚠️ URL de thumbnail inválida para ${itemId}: ${thumbnail}`);
					return null;
				}

				// Si no hay thumbnail, incrementar contador de reintentos
				const newRetryCount = retryCount + 1;
				retryCountRef.current.set(itemId, newRetryCount);
				thumbnailLogger.warn(
					`⚠️ No se pudo cargar thumbnail para ${itemId}, reintentando (${newRetryCount}/${MAX_RETRIES})`
				);
				return null;
			} catch (err) {
				const error = err instanceof Error ? err.message : 'Error desconocido';
				thumbnailLogger.error(`❌ Error cargando thumbnail para ${itemId}:`, error);

				// Asegurarnos de que la referencia siga siendo válida
				if (loadQueueRef.current) {
					loadQueueRef.current.delete(itemId);
				}

				const newRetryCount = retryCount + 1;
				retryCountRef.current.set(itemId, newRetryCount);
				thumbnailLogger.warn(`⚠️ Error en thumbnail para ${itemId}, reintentando (${newRetryCount}/${MAX_RETRIES})`);
				return null;
			}
		},
		[imageResources]
	);

	return {
		loadThumbnail,
		loadQueueRef,
		retryCountRef,
	};
}
