/**
 * @file Mappers canónicos para la entidad Image (sin Prisma ni legacy)
 * @module transformers/image/mappers
 */

import type { ImageComplete } from '@/types/entities/image/types';

/**
 * Convierte cualquier objeto plano a ImageComplete (rellena campos obligatorios)
 */
export function mapImageToComplete(image: Partial<ImageComplete>): ImageComplete {
	return {
		id: image.id ?? '',
		name: image.name ?? '',
		description: image.description ?? null,
		path: image.path ?? '',
		hash: image.hash ?? '',
		size: image.size ?? 0,
		width: image.width ?? 0,
		height: image.height ?? 0,
		metadata: image.metadata ?? null,
		isFavorite: image.isFavorite ?? false,
		addedAt: image.addedAt ?? new Date(),
		createdAt: image.createdAt ?? new Date(),
		updatedAt: image.updatedAt ?? new Date(),
		// Relaciones mínimas (pueden ser null/undefined)
		folder: image.folder ?? { id: '' },
		stats: image.stats,
		activities: image.activities,
		uploadedImages: image.uploadedImages,
		profiles: image.profiles,
		albums: image.albums,
		collections: image.collections,
		tags: image.tags,
		characters: image.characters,
		places: image.places,
		worldItems: image.worldItems,
		concepts: image.concepts,
		prompts: image.prompts,
		notes: image.notes,
		wildcards: image.wildcards,
		properties: image.properties,
		groups: image.groups,
		// Thumbnail
		thumbnail: image.thumbnail ?? null,
		thumbnailSize: image.thumbnailSize ?? null,
		thumbnailWidth: image.thumbnailWidth ?? null,
		thumbnailHeight: image.thumbnailHeight ?? null,
		thumbnailError: image.thumbnailError ?? null,
		thumbnailErrorAt: image.thumbnailErrorAt ?? null,
		thumbnailOptimizedAt: image.thumbnailOptimizedAt ?? null,
		// Conteos
		_count: image._count,
	};
}

/**
 * Mapea una imagen a un resumen para listados
 */
export function mapToImageSummary(image: ImageComplete): {
	id: string;
	name: string;
	path: string;
	folderId: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	createdAt: Date;
	updatedAt: Date;
} {
	return {
		id: image.id,
		name: image.name,
		path: image.path,
		folderId: image.folder?.id ?? '',
		hash: image.hash,
		size: image.size,
		width: image.width,
		height: image.height,
		thumbnailWidth: image.thumbnailWidth ?? null,
		thumbnailHeight: image.thumbnailHeight ?? null,
		createdAt: image.createdAt ?? new Date(),
		updatedAt: image.updatedAt ?? new Date(),
	};
}

/**
 * Mapea un array de imágenes a resúmenes
 */
export function mapToImageSummaries(images: ImageComplete[]): ReturnType<typeof mapToImageSummary>[] {
	return images.map(mapToImageSummary);
}
