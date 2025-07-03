/**
 * @file Mapeadores para la entidad Metadata, convirtiendo datos de Prisma a tipos de la aplicación.
 * @module transformers/metadata/mappers
 */

import type { Metadata, Prisma } from '@prisma/client';
import { formatBytes } from '@/lib/utils/format.utils';
import type { MetadataCreateInput, MetadataUpdateInput } from '@/types/entities/metadata';

// formatBytes se ha movido a @/lib/utils/format.utils.ts para evitar duplicación

// Mapear datos de Prisma a nuestro tipo extendido (ejemplo, se necesitará un tipo MetadataExtended)
export function fromPrismaMetadata(metadata: Metadata): MetadataExtended {
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

// Mapear datos de creación a formato Prisma
export function mapCreateInputToPrisma(data: MetadataCreateInput): Prisma.MetadataCreateInput {
	// Aquí debería ir la lógica para mapear MetadataCreateInput a Prisma.MetadataCreateInput
	return {
		...data,
	};
}

// Mapear datos de actualización a formato Prisma
export function mapUpdateInputToPrisma(data: Partial<MetadataUpdateInput>): Prisma.MetadataUpdateInput {
	// Aquí debería ir la lógica para mapear MetadataUpdateInput a Prisma.MetadataUpdateInput
	return {
		...data,
	};
}
