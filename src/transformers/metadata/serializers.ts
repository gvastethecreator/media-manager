/**
 * @file Serializadores para la entidad Metadata
 * @module transformers/metadata/serializers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type { MetadataExtended } from '@/types/entities/metadata';

/**
 * Serializa un objeto Metadata para respuesta de API
 */
export function serializeMetadata(metadata: MetadataExtended) {
	return {
		id: metadata.id,
		type: metadata.type,
		data: metadata.data,
		entityId: metadata.entityId,
		entityType: metadata.entityType,
		source: metadata.source,
		createdAt: metadata.createdAt.toISOString(),
		updatedAt: metadata.updatedAt.toISOString(),
		// Propiedades extendidas si existen
		formattedSize: metadata.formattedSize,
		keyCount: metadata.keyCount,
	};
}

/**
 * Serializa un array de Metadata para respuesta de API
 */
export function serializeMetadatas(metadatas: MetadataExtended[]) {
	return metadatas.map(serializeMetadata);
}
