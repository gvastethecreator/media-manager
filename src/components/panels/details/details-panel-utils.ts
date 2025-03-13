'use client';

import type { FileMetadata } from '@/types/file-item';

// Logger dedicado para metadata
const metadataLogger = {
	info: (message: string, data?: unknown) => console.info(`[MetadataParser] ${message}`, data),
	warn: (message: string, data?: unknown) => console.warn(`[MetadataParser] ${message}`, data),
	error: (message: string, data?: unknown) => console.error(`[MetadataParser] ${message}`, data),
	debug: (message: string, data?: unknown) => console.debug(`[MetadataParser] ${message}`, data),
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
			// Imprimir las claves principales para diagnóstico
			const keys = Object.keys(metadata);
			metadataLogger.debug('Claves en el objeto de metadata:', keys);

			// Chequear específicamente por la propiedad generation
			if ('generation' in metadata) {
				metadataLogger.debug('Propiedad "generation" encontrada en el objeto', metadata.generation);
			}

			if ('ai' in metadata) {
				metadataLogger.debug('Propiedad "ai" encontrada en el objeto', metadata.ai);
			}

			// Validar que tenga al menos una propiedad básica de FileMetadata
			if (
				typeof metadata === 'object' &&
				('format' in metadata ||
					'dimensions' in metadata ||
					'exif' in metadata ||
					'iptc' in metadata ||
					'xmp' in metadata ||
					'generation' in metadata ||
					'ai' in metadata)
			) {
				// Normalizar los datos
				const result = { ...metadata } as FileMetadata;

				// Normalizar datos de generación AI
				// Algunos sistemas pueden usar 'ai' en lugar de 'generation'
				if ('ai' in metadata && !('generation' in metadata)) {
					metadataLogger.info('Normalizando "ai" a "generation"', metadata.ai);
					result.generation = metadata.ai as FileMetadata['generation'];
				}

				// Si hay datos de generación, asegurarse de que tengan la estructura correcta
				if (result.generation) {
					metadataLogger.debug('Datos de generation encontrados:', result.generation);

					// Asegurar que type sea una string válida
					if (!result.generation.type || typeof result.generation.type !== 'string') {
						metadataLogger.warn('Tipo de generación inválido o no especificado, usando "unknown"');
						result.generation.type = 'unknown';
					}

					// Convertir parámetros numéricos si vienen como string
					if (result.generation.steps && typeof result.generation.steps === 'string') {
						metadataLogger.debug('Convirtiendo steps de string a número', result.generation.steps);
						result.generation.steps = Number.parseInt(result.generation.steps, 10);
					}

					if (result.generation.cfg_scale && typeof result.generation.cfg_scale === 'string') {
						metadataLogger.debug('Convirtiendo cfg_scale de string a número', result.generation.cfg_scale);
						result.generation.cfg_scale = Number.parseFloat(result.generation.cfg_scale);
					}

					if (result.generation.cfg && typeof result.generation.cfg === 'string') {
						metadataLogger.debug('Convirtiendo cfg de string a número', result.generation.cfg);
						result.generation.cfg = Number.parseFloat(result.generation.cfg);
					}

					if (result.generation.clip_skip && typeof result.generation.clip_skip === 'string') {
						metadataLogger.debug('Convirtiendo clip_skip de string a número', result.generation.clip_skip);
						result.generation.clip_skip = Number.parseInt(result.generation.clip_skip, 10);
					}
				} else {
					metadataLogger.warn('No se encontraron datos de generación en el objeto');
				}

				metadataLogger.info('Metadata procesada correctamente', {
					hasGeneration: !!result.generation,
					generationType: result.generation?.type,
					hasExif: !!result.exif,
					hasXmp: !!result.xmp,
					hasIptc: !!result.iptc,
				});

				return result;
			}

			metadataLogger.warn('Objeto de metadata inválido o sin propiedades esperadas');
			return null;
		}

		// Si es un string, intentamos parsearlo
		metadataLogger.debug(
			'Intentando parsear string JSON',
			typeof metadata === 'string' ? (metadata.length > 100 ? `${metadata.substring(0, 100)}...` : metadata) : '{}'
		);

		const parsedData = JSON.parse(typeof metadata === 'string' ? metadata : '{}');

		// Verificar si el objeto parseado es válido
		if (!parsedData || typeof parsedData !== 'object') {
			metadataLogger.warn('Metadata inválida (formato no reconocido)', parsedData);
			return null;
		}

		// Imprimir las claves principales para diagnóstico
		const parsedKeys = Object.keys(parsedData);
		metadataLogger.debug('Claves en el objeto parseado:', parsedKeys);

		// Chequear específicamente por la propiedad generation
		if ('generation' in parsedData) {
			metadataLogger.debug('Propiedad "generation" encontrada en objeto parseado', parsedData.generation);
		}

		if ('ai' in parsedData) {
			metadataLogger.debug('Propiedad "ai" encontrada en objeto parseado', parsedData.ai);
		}

		// Validar que tenga al menos una propiedad básica de FileMetadata
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
			// Algunos sistemas pueden usar 'ai' en lugar de 'generation'
			if ('ai' in parsedData && !('generation' in parsedData)) {
				metadataLogger.info('Normalizando "ai" a "generation" en objeto parseado', parsedData.ai);
				result.generation = parsedData.ai as FileMetadata['generation'];
			}

			// Si hay datos de generación, asegurarse de que tengan la estructura correcta
			if (result.generation) {
				metadataLogger.debug('Datos de generation encontrados en objeto parseado:', result.generation);

				// Asegurar que type sea una string válida
				if (!result.generation.type || typeof result.generation.type !== 'string') {
					metadataLogger.warn('Tipo de generación inválido o no especificado, usando "unknown"');
					result.generation.type = 'unknown';
				}

				// Convertir parámetros numéricos si vienen como string
				if (result.generation.steps && typeof result.generation.steps === 'string') {
					metadataLogger.debug('Convirtiendo steps de string a número', result.generation.steps);
					result.generation.steps = Number.parseInt(result.generation.steps, 10);
				}

				if (result.generation.cfg_scale && typeof result.generation.cfg_scale === 'string') {
					metadataLogger.debug('Convirtiendo cfg_scale de string a número', result.generation.cfg_scale);
					result.generation.cfg_scale = Number.parseFloat(result.generation.cfg_scale);
				}

				if (result.generation.cfg && typeof result.generation.cfg === 'string') {
					metadataLogger.debug('Convirtiendo cfg de string a número', result.generation.cfg);
					result.generation.cfg = Number.parseFloat(result.generation.cfg);
				}

				if (result.generation.clip_skip && typeof result.generation.clip_skip === 'string') {
					metadataLogger.debug('Convirtiendo clip_skip de string a número', result.generation.clip_skip);
					result.generation.clip_skip = Number.parseInt(result.generation.clip_skip, 10);
				}
			} else {
				metadataLogger.warn('No se encontraron datos de generación en objeto parseado');
			}

			metadataLogger.info('Metadata parseada correctamente', {
				hasGeneration: !!result.generation,
				generationType: result.generation?.type,
				hasExif: !!result.exif,
				hasXmp: !!result.xmp,
				hasIptc: !!result.iptc,
			});

			return result;
		}

		metadataLogger.warn('Objeto de metadata parseado sin propiedades esperadas');
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
	if (!text) return '';
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}

// Configuración de carga de imágenes
export const LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};
