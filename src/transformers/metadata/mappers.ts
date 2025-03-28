/**
 * @file Funciones de utilidad para formatear datos
 * @module utils/format
 */

// Función para formatear bytes a formato legible
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

import type { MetadataBase } from '@/types/entities/metadata/base';
import type { MetadataCard, MetadataExtended, MetadataListItem } from '@/types/entities/metadata/extended';

// Mapear datos de Prisma a tipo extendido
export function extendMetadata(metadata: MetadataBase): MetadataExtended {
	const aspectRatio = metadata.width / metadata.height;
	const formattedSize = formatBytes(metadata.size);
	const dimensions = `${metadata.width}x${metadata.height}`;

	return {
		...metadata,
		aspectRatio,
		formattedSize,
		dimensions,
	};
}

// Mapear a formato de tarjeta
export function toMetadataCard(metadata: MetadataBase): MetadataCard {
	return {
		id: metadata.id,
		dimensions: `${metadata.width}x${metadata.height}`,
		formattedSize: formatBytes(metadata.size),
		format: metadata.format,
		hasExif: false, // Se actualiza cuando se implementen los metadatos EXIF
	};
}

// Mapear a formato de lista
export function toMetadataListItem(metadata: MetadataBase): MetadataListItem {
	return {
		id: metadata.id,
		imageId: metadata.imageId,
		dimensions: `${metadata.width}x${metadata.height}`,
		format: metadata.format,
		size: metadata.size,
		formattedSize: formatBytes(metadata.size),
		updatedAt: metadata.updatedAt,
	};
}

// Mapear datos de creación a formato Prisma
export function mapCreateMetadataDataToPrisma(data: Partial<MetadataBase>) {
	return {
		imageId: data.imageId,
		format: data.format,
		width: data.width,
		height: data.height,
		size: data.size,
		colorSpace: data.colorSpace,
		hasAlpha: data.hasAlpha,
		orientation: data.orientation,
	};
}

// Mapear datos de actualización a formato Prisma
export function mapUpdateMetadataDataToPrisma(data: Partial<MetadataBase>) {
	return {
		format: data.format,
		width: data.width,
		height: data.height,
		size: data.size,
		colorSpace: data.colorSpace,
		hasAlpha: data.hasAlpha,
		orientation: data.orientation,
	};
}
