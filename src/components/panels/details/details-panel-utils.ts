import type { FileMetadata } from '@/types/file-item';

/**
 * Función mejorada para extraer metadatos
 * Puede manejar varios formatos de entrada: string, objetos y nulos
 */
export const getMetadata = (metadata: string | null | Record<string, unknown>): FileMetadata | null => {
	if (!metadata) {
		return null;
	}

	try {
		// Si ya es un objeto, verificamos que sea válido y lo retornamos
		if (typeof metadata === 'object' && metadata !== null) {
			// Validar que tenga al menos una propiedad básica de FileMetadata
			if (
				typeof metadata === 'object' &&
				('format' in metadata ||
					'dimensions' in metadata ||
					'exif' in metadata ||
					'iptc' in metadata ||
					'xmp' in metadata ||
					'ai' in metadata)
			) {
				return metadata as FileMetadata;
			}

			console.warn('Objeto de metadata inválido o sin propiedades esperadas');
			return null;
		}

		// Si es un string, intentamos parsearlo
		const parsedData = JSON.parse(typeof metadata === 'string' ? metadata : '{}');

		// Verificar si el objeto parseado es válido
		if (!parsedData || typeof parsedData !== 'object') {
			console.warn('Metadata inválida (formato no reconocido)');
			return null;
		}

		// Validar que tenga al menos una propiedad básica de FileMetadata
		if (
			'format' in parsedData ||
			'dimensions' in parsedData ||
			'exif' in parsedData ||
			'iptc' in parsedData ||
			'xmp' in parsedData ||
			'ai' in parsedData
		) {
			return parsedData as FileMetadata;
		}

		console.warn('Objeto de metadata parseado sin propiedades esperadas');
		return null;
	} catch (error) {
		console.error('Error parseando metadata:', error);
		return null;
	}
};

/**
 * Trunca un texto a una longitud máxima
 */
export const truncateText = (text: string, maxLength = 150): string => {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}...`;
};

// Configuración de carga de imágenes
export const LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};
