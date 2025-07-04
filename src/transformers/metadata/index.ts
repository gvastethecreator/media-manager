/**
 * @file Transformadores para entidades Metadata
 * @module transformers/metadata
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { formatBytes } from '@/lib/utils/format.utils';
import type { MetadataBase, MetadataExtended } from '@/types/entities/metadata';
import {
	fromDrizzleMetadata,
	mapCreateInputToDrizzle,
	mapUpdateInputToDrizzle,
} from './mappers';

/**
 * Transforma un objeto Metadata a su versión extendida con propiedades calculadas
 * @param metadata - Objeto metadata base
 * @returns Metadata con propiedades adicionales
 */
export const transformMetadata = (metadata: MetadataBase | null): MetadataExtended | null => {
	if (!metadata) return null;

	try {
		return fromDrizzleMetadata(metadata as any);
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
	fromDrizzleMetadata,
	mapCreateInputToDrizzle,
	mapUpdateInputToDrizzle,
	// Re-exportar desde @/lib/utils/format.utils
	formatBytes,
};
