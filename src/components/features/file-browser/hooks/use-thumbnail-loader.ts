'use client';

import { clientLogger } from '@/lib/logger/client-logger';
import { useImageResources } from '@/store/image-resources.store';
import type * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

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
				thumbnailLogger.error(`Intento de cargar thumbnail con ID inválido: "${itemId}"`);
				return null;
			}

			// Verificar si ya está en proceso de carga
			if (loadQueueRef.current.has(itemId)) {
				return null;
			}

			// Verificar reintentos
			const retryCount = retryCountRef.current.get(itemId) || 0;
			if (retryCount >= MAX_RETRIES) {
				// Si hemos superado el máximo de reintentos, logeamos pero no intentamos de nuevo
				if (retryCount === MAX_RETRIES) {
					thumbnailLogger.warn(`Máximo de reintentos alcanzado (${MAX_RETRIES}) para thumbnail ${itemId}`);
					// Incrementamos una vez más para evitar logs repetidos
					retryCountRef.current.set(itemId, retryCount + 1);
				}
				return null;
			}

			try {
				loadQueueRef.current.add(itemId);

				// Minimizamos logs innecesarios que pueden afectar el rendimiento
				if (process.env.NODE_ENV === 'development') {
					thumbnailLogger.debug(`Cargando thumbnail: ${itemId}`);
				}

				let thumbnail: string | undefined;
				try {
					thumbnail = await imageResources.getThumbnail(itemId);
				} catch (fetchError) {
					thumbnailLogger.error(`Error al obtener thumbnail desde el store para ${itemId}:`, fetchError);
					thumbnail = undefined;
				}

				// Asegurarnos de que la referencia siga siendo válida
				if (!loadQueueRef.current) {
					return null; // El componente se ha desmontado
				}

				loadQueueRef.current.delete(itemId);

				if (thumbnail) {
					// Minimizamos logs innecesarios
					if (process.env.NODE_ENV === 'development') {
						thumbnailLogger.debug(`Thumbnail cargado: ${itemId}`);
					}
					retryCountRef.current.delete(itemId);
					return thumbnail;
				}

				// Si no hay thumbnail, incrementar contador de reintentos
				const newRetryCount = retryCount + 1;
				retryCountRef.current.set(itemId, newRetryCount);
				thumbnailLogger.warn(
					`No se pudo cargar thumbnail para ${itemId}, reintentando (${newRetryCount}/${MAX_RETRIES})`
				);
				return null;
			} catch (err) {
				const error = err instanceof Error ? err.message : 'Error desconocido';
				thumbnailLogger.error(`Error cargando thumbnail para ${itemId}:`, error);

				// Asegurarnos de que la referencia siga siendo válida
				if (loadQueueRef.current) {
					loadQueueRef.current.delete(itemId);
				}

				const newRetryCount = retryCount + 1;
				retryCountRef.current.set(itemId, newRetryCount);
				thumbnailLogger.warn(`Error en thumbnail para ${itemId}, reintentando (${newRetryCount}/${MAX_RETRIES})`);
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
