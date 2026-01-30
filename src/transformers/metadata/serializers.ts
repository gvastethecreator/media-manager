/**
 * @file Serializadores para la entidad Metadata
 * @module transformers/metadata/serializers
 
 */

import type { MetadataExtended } from '../../types/entities/metadata';

/**
 * Serializa un objeto Metadata para respuesta de API
 */
export function serializeMetadata(metadata: MetadataExtended) {
	return {
		id: metadata.id,
		type: metadata.type,
		key: metadata.key,
		value: metadata.value,
		entityId: metadata.entityId,
		entityType: metadata.entityType,
		category: metadata.category,
		description: metadata.description,
		createdAt: metadata.createdAt.toISOString(),
		updatedAt: metadata.updatedAt.toISOString(),
	};
}

/**
 * Serializa un array de Metadata para respuesta de API
 */
export function serializeMetadatas(metadatas: MetadataExtended[]) {
	return metadatas.map(serializeMetadata);
}
