'use client';

import { logger } from '@/lib/logger';
import { useImageResources } from '@/store/image-resources.store';
import type * as React from 'react';
import { useCallback, useRef } from 'react';

const thumbnailLogger = logger.withContext('ThumbnailLoader');

interface UseThumbnailLoaderResult {
	loadThumbnail: (itemId: string) => Promise<string | null>;
	loadQueueRef: React.MutableRefObject<Set<string>>;
	retryCountRef: React.MutableRefObject<Map<string, number>>;
}

export function useThumbnailLoader(): UseThumbnailLoaderResult {
	const imageResources = useImageResources();

	// Referencia para la cola de carga
	const loadQueueRef = useRef<Set<string>>(new Set());
	const retryCountRef = useRef<Map<string, number>>(new Map());
	const MAX_RETRIES = 3;

	// Función mejorada para cargar thumbnails con reintentos
	const loadThumbnail = useCallback(
		async (itemId: string) => {
			// Validar que el ID sea válido
			if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
				console.error(`Intento de cargar thumbnail con ID inválido: "${itemId}"`);
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

				const thumbnail = await imageResources.getThumbnail(itemId);
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
				loadQueueRef.current.delete(itemId);

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
