/**
 * @file Mapeadores para la entidad Metadata, convirtiendo datos de Prisma a tipos de la aplicación.
 * @module transformers/metadata/mappers
 */

import type { MetadataCreateInput, MetadataUpdateInput } from '@/types/entities/metadata';
import type { Metadata, Prisma } from '@prisma/client';

// Función para formatear bytes a formato legible
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

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
