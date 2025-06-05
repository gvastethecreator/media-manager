/**
 * @file Transformadores para entidades Metadata
 * @module transformers/metadata
 */

import {
	extendMetadata,
	formatBytes,
	mapCreateMetadataDataToPrisma,
	mapUpdateMetadataDataToPrisma,
	toMetadataCard,
	toMetadataListItem,
} from './mappers';

import type { MetadataBase } from '@/types/entities/metadata/base';
import type { MetadataExtended } from '@/types/entities/metadata/extended';

/**
 * Transforma un objeto Metadata a su versión extendida con propiedades calculadas
 * @param metadata - Objeto metadata base
 * @returns Metadata con propiedades adicionales
 */
export const transformMetadata = (metadata: MetadataBase | null): MetadataExtended | null => {
	if (!metadata) return null;

	try {
		return extendMetadata(metadata);
	} catch (error) {
		console.error('Error transformando metadata:', error);
		return null;
	}
};

/**
 * Transforma un array de Metadata a sus versiones extendidas
 * @param metadataArray - Array de objetos metadata base
 * @returns Array de metadata con propiedades adicionales
 */
export const transformMetadatas = (metadataArray: MetadataBase[] | null): MetadataExtended[] => {
	if (!metadataArray || !Array.isArray(metadataArray)) return [];

	return metadataArray
		.map((metadata) => transformMetadata(metadata))
		.filter((item): item is MetadataExtended => item !== null);
};

// Exportar todas las funciones útiles
export {
	extendMetadata,
	formatBytes,
	mapCreateMetadataDataToPrisma,
	mapUpdateMetadataDataToPrisma,
	toMetadataCard,
	toMetadataListItem,
};
