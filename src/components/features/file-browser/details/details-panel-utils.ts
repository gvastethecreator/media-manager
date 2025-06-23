'use client';

import type { FileMetadata } from '@/types/metadata.types';

// Logger dedicado para metadata
const metadataLogger = {
	info: (message: string, data?: unknown) => console.info(`[MetadataParser] ${message}`, data),
	warn: (message: string, data?: unknown) => console.warn(`[MetadataParser] ${message}`, data),
	error: (message: string, data?: unknown) => console.error(`[MetadataParser] ${message}`, data),
	debug: (message: string, data?: unknown) => console.debug(`[MetadataParser] ${message}`, data),
};

// Cache de metadatos para evitar reprocesamiento
const metadataCache = new Map<string, { data: FileMetadata; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para generar una clave única para el caché
const getCacheKey = (metadata: string | Record<string, unknown>): string => {
	if (typeof metadata === 'string') {
		return metadata;
	}
	return JSON.stringify(metadata);
};

// Función para limpiar entradas antiguas del caché
const cleanCache = () => {
	const now = Date.now();
	for (const [key, value] of metadataCache.entries()) {
		if (now - value.timestamp > CACHE_DURATION) {
			metadataCache.delete(key);
		}
	}
};

/**
 * Función mejorada para extraer metadatos
 * Puede manejar varios formatos de entrada: string, objetos y nulos
 */
export const getMetadata = (metadata: string | null | Record<string, unknown>): FileMetadata | null => {
	if (!metadata) {
		metadataLogger.warn('Metadata recibida es nula o indefinida');
		return null;
	}

	// Limpiar caché periódicamente
	cleanCache();

	// Generar clave de caché
	const cacheKey = getCacheKey(metadata);

	// Verificar si existe en caché
	const cached = metadataCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		metadataLogger.debug('Usando metadata desde caché');
		return cached.data;
	}

	metadataLogger.info('Procesando metadata', {
		type: typeof metadata,
		isString: typeof metadata === 'string',
		isObject: typeof metadata === 'object',
		previewValue:
			typeof metadata === 'string'
				? metadata.length > 100
					? `${metadata.substring(0, 100)}...`
					: metadata
				: 'Es un objeto',
	});

	try {
		// Si ya es un objeto, verificamos que sea válido y lo retornamos
		if (typeof metadata === 'object' && metadata !== null) {
			// Validar que tenga al menos una propiedad básica de FileMetadata
			if (
				'format' in metadata ||
				'dimensions' in metadata ||
				'exif' in metadata ||
				'iptc' in metadata ||
				'xmp' in metadata ||
				'generation' in metadata ||
				'ai' in metadata
			) {
				// Normalizar los datos
				const result = { ...metadata } as FileMetadata;

				// Normalizar datos de generación AI
				if ('ai' in metadata && !('generation' in metadata)) {
					result.generation = metadata.ai as FileMetadata['generation'];
				}

				// Normalizar datos de generación
				if (result.generation) {
					// Asegurar que type sea una string válida
					if (!result.generation.type || typeof result.generation.type !== 'string') {
						result.generation.type = 'unknown';
					}

					// Convertir parámetros numéricos
					for (const key of ['steps', 'clip_skip']) {
						const value = result.generation[key];
						if (value && typeof value === 'string') {
							result.generation[key] = Number.parseInt(value, 10);
						}
					}

					for (const key of ['cfg_scale', 'cfg']) {
						const value = result.generation[key];
						if (value && typeof value === 'string') {
							result.generation[key] = Number.parseFloat(value);
						}
					}
				}

				// Guardar en caché
				metadataCache.set(cacheKey, {
					data: result,
					timestamp: Date.now(),
				});

				return result;
			}

			metadataLogger.warn('Objeto de metadata inválido o sin propiedades esperadas');
			return null;
		}

		// Si es un string, intentamos parsearlo
		if (typeof metadata === 'string') {
			const parsedData = JSON.parse(metadata);

			if (!parsedData || typeof parsedData !== 'object') {
				metadataLogger.warn('Metadata inválida (formato no reconocido)');
				return null;
			}

			// Validar que tenga al menos una propiedad básica
			if (
				'format' in parsedData ||
				'dimensions' in parsedData ||
				'exif' in parsedData ||
				'iptc' in parsedData ||
				'xmp' in parsedData ||
				'generation' in parsedData ||
				'ai' in parsedData
			) {
				// Normalizar los datos
				const result = { ...parsedData } as FileMetadata;

				// Normalizar datos de generación AI
				if ('ai' in parsedData && !('generation' in parsedData)) {
					result.generation = parsedData.ai as FileMetadata['generation'];
				}

				// Normalizar datos de generación
				if (result.generation) {
					// Asegurar que type sea una string válida
					if (!result.generation.type || typeof result.generation.type !== 'string') {
						result.generation.type = 'unknown';
					}

					// Convertir parámetros numéricos
					for (const key of ['steps', 'clip_skip']) {
						const value = result.generation[key];
						if (value && typeof value === 'string') {
							result.generation[key] = Number.parseInt(value, 10);
						}
					}

					for (const key of ['cfg_scale', 'cfg']) {
						const value = result.generation[key];
						if (value && typeof value === 'string') {
							result.generation[key] = Number.parseFloat(value);
						}
					}
				}

				// Guardar en caché
				metadataCache.set(cacheKey, {
					data: result,
					timestamp: Date.now(),
				});

				return result;
			}
		}

		metadataLogger.warn('Metadata no válida o sin propiedades esperadas');
		return null;
	} catch (error) {
		metadataLogger.error('Error parseando metadata:', error);
		return null;
	}
};

/**
 * Trunca un texto a una longitud determinada
 */
export function truncateText(text: string, maxLength = 150): string {
	if (!text) {
		return '';
	}
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength)}...`;
}

// Configuración de carga de imágenes
export const LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};
