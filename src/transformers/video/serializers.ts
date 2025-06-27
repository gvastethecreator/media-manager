/**
 * @file Funciones de serialización/deserialización para la entidad Video.
 * @module transformers/video/serializers
 * @description Contiene funciones para manejar la serialización de campos complejos (JSON) de la entidad Video.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoMetadata } from '@/types/entities/video';
import { TransformerError } from '@/lib/utils/transformers/errors';

const logger = serverLogger.withContext('VideoSerializers');

/**
 * 🔄 Serializa los metadatos de un video a un string JSON.
 * @param metadata - El objeto de metadatos a serializar.
 * @returns Un string JSON.
 * @throws {TransformerError} Si la serialización falla.
 */
export function serializeVideoMetadata(metadata: VideoMetadata | null | undefined): string {
	if (!metadata) {
		return '{}';
	}
	try {
		return JSON.stringify(metadata);
	} catch (error) {
		logger.error('Error serializando metadatos de video', { error, metadata });
		throw new TransformerError('No se pudieron serializar los metadatos del video.');
	}
}

/**
 * 🔄 Deserializa los metadatos de un video desde un string JSON.
 * @param jsonString - El string JSON a deserializar.
 * @returns Un objeto de metadatos.
 * @throws {TransformerError} si el JSON es inválido.
 */
export function deserializeVideoMetadata(jsonString: string | null | undefined): VideoMetadata {
	if (!jsonString || jsonString === '{}') {
		return {} as VideoMetadata; // Devuelve un objeto vacío si no hay metadatos.
	}
	try {
		const parsed = JSON.parse(jsonString);
		return parsed as VideoMetadata;
	} catch (error) {
		logger.error('Error deserializando metadatos de video', { error, jsonString });
		throw new TransformerError('El formato de los metadatos del video es inválido.');
	}
}
