/**
 * @file Mapeadores para la entidad Metadata, convirtiendo datos de Drizzle a tipos de la aplicación.
 * @module transformers/metadata/mappers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { formatBytes } from '@/lib/utils/format.utils';
import type { MetadataCreateInput, MetadataUpdateInput } from '@/types/entities/metadata';

// Tipo local equivalente a Prisma (migración a Drizzle)
type DrizzleMetadata = {
	id: string;
	width?: number | null;
	height?: number | null;
	size?: number | null;
	format?: string | null;
	colorDepth?: number | null;
	hasTransparency?: boolean | null;
	compression?: string | null;
	quality?: number | null;
	dpi?: number | null;
	orientation?: string | null;
	createdAt: Date;
	updatedAt: Date;
};

type DrizzleCreateMetadataData = Omit<DrizzleMetadata, 'id' | 'createdAt' | 'updatedAt'>;
type DrizzleUpdateMetadataData = Partial<DrizzleCreateMetadataData>;

// Tipo extendido para la UI
type MetadataExtended = DrizzleMetadata & {
	aspectRatio: number;
	formattedSize: string;
	dimensions: string;
};

// formatBytes se ha movido a @/lib/utils/format.utils.ts para evitar duplicación

/**
 * Mapear datos de Drizzle a nuestro tipo extendido
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleMetadata(metadata: DrizzleMetadata): MetadataExtended {
	const aspectRatio = metadata.width && metadata.height ? metadata.width / metadata.height : 0;
	const formattedSize = formatBytes(metadata.size || 0);
	const dimensions = `${metadata.width || 0}x${metadata.height || 0}`;

	return {
		...metadata,
		aspectRatio,
		formattedSize,
		dimensions,
	};
}

/**
 * Mapear datos de creación a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateInputToDrizzle(data: MetadataCreateInput): DrizzleCreateMetadataData {
	// Aquí debería ir la lógica para mapear MetadataCreateInput a datos de Drizzle
	return {
		...data,
	};
}

/**
 * Mapear datos de actualización a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateInputToDrizzle(data: Partial<MetadataUpdateInput>): DrizzleUpdateMetadataData {
	// Aquí debería ir la lógica para mapear MetadataUpdateInput a datos de Drizzle
	return {
		...data,
	};
}

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar fromDrizzleMetadata
 */
export const fromPrismaMetadata = fromDrizzleMetadata;

/**
 * @deprecated Usar mapCreateInputToDrizzle
 */
export const mapCreateInputToPrisma = mapCreateInputToDrizzle;

/**
 * @deprecated Usar mapUpdateInputToDrizzle
 */
export const mapUpdateInputToPrisma = mapUpdateInputToDrizzle;
