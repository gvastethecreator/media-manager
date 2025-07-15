/**
 * @file Mapeadores para la entidad Metadata, convirtiendo datos de Drizzle a tipos de la aplicación.
 * @module transformers/metadata/mappers
 
 */

import { formatBytes } from '@/lib/utils/format.utils';
import type {
	MetadataBase,
	MetadataCreateInput,
	MetadataExtended,
	MetadataUpdateInput,
} from '@/types/entities/metadata';

// Tipos de datos para Drizzle
type DrizzleCreateMetadataData = Omit<MetadataBase, 'id' | 'createdAt' | 'updatedAt'>;
type DrizzleUpdateMetadataData = Partial<DrizzleCreateMetadataData>;

/**
 * Mapear datos de Drizzle a nuestro tipo extendido
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleMetadata(metadata: MetadataBase): MetadataExtended {
	return {
		...metadata,
	};
}

/**
 * Mapear datos de creación a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateInputToDrizzle(data: MetadataCreateInput): DrizzleCreateMetadataData {
	return {
		...data,
	};
}

/**
 * Mapear datos de actualización a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateInputToDrizzle(data: Partial<MetadataUpdateInput>): DrizzleUpdateMetadataData {
	return {
		...data,
	};
}
