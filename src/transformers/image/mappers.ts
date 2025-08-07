/**
 
 * @module transformers/image/mappers
 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { ImageBase, ImageWithStats } from '@/types/entities/image/base';

/**
 * Convierte cualquier objeto plano a ImageWithStats (rellena campos obligatorios)
 */
export function mapImageToComplete(image: Partial<ImageBase>): ImageWithStats {
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
		thumbnail: image.thumbnail ?? null,
		thumbnailSize: image.thumbnailSize ?? null,
		thumbnailWidth: image.thumbnailWidth ?? null,
		thumbnailHeight: image.thumbnailHeight ?? null,
		thumbnailMimeType: image.thumbnailMimeType ?? null,
		thumbnailError: image.thumbnailError ?? null,
		thumbnailErrorAt: image.thumbnailErrorAt ?? null,
		thumbnailOptimizedAt: image.thumbnailOptimizedAt ?? null,
		isFavorite: image.isFavorite ?? false,
		folderId: image.folderId ?? '',
		noteId: image.noteId ?? null,
		addedAt: image.addedAt ?? new Date(),
		createdAt: image.createdAt ?? new Date(),
		updatedAt: image.updatedAt ?? new Date(),
		entityType: 'image' as const,
		stats: createDefaultEntityStats({
			size: image.size ?? 0,
			mtime: image.updatedAt ?? new Date(),
			birthtime: image.createdAt ?? new Date(),
			type: 'image',
			aspectRatio: image.width && image.height ? Number((image.width / image.height).toFixed(2)) : 0,
		}),
		thumbnailUrl: image.thumbnail ?? '',
		fullUrl: image.path ?? '',
	};
}

/**
 * Mapea una imagen a un resumen para listados
 */
export function mapToImageSummary(image: ImageWithStats): {
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
		folderId: image.folderId ?? '',
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
export function mapToImageSummaries(images: ImageWithStats[]): ReturnType<typeof mapToImageSummary>[] {
	return images.map(mapToImageSummary);
}
