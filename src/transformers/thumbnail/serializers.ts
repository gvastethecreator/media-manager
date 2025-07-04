/**
 * 🖼️ THUMBNAIL SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import { ThumbnailBase, ThumbnailWithStats } from '@/types/entities/thumbnail';

/**
 * Serializa ThumbnailBase para respuestas de API
 */
export function serializeThumbnail(thumbnail: ThumbnailBase): Record<string, any> {
	return {
		id: thumbnail.id,
		sourceId: thumbnail.sourceId,
		sourceType: thumbnail.sourceType,
		path: thumbnail.path,
		size: thumbnail.size,
		width: thumbnail.width,
		height: thumbnail.height,
		format: thumbnail.format,
		quality: thumbnail.quality,
		createdAt: thumbnail.createdAt.toISOString(),
		updatedAt: thumbnail.updatedAt.toISOString(),
	};
}

/**
 * Serializa ThumbnailWithStats para respuestas de API
 */
export function serializeThumbnailWithStats(thumbnail: ThumbnailWithStats): Record<string, any> {
	return {
		...serializeThumbnail(thumbnail),
		stats: {
			aspectRatio: Number(thumbnail.stats.aspectRatio.toFixed(2)),
			compressionRatio: Number(thumbnail.stats.compressionRatio.toFixed(2)),
			qualityScore: thumbnail.stats.qualityScore,
			usageCount: thumbnail.stats.usageCount,
			storageEfficiency: Number(thumbnail.stats.storageEfficiency.toFixed(1)),
		},
	};
}

/**
 * Serializa un array de thumbnails
 */
export function serializeThumbnails(thumbnails: ThumbnailBase[]): Record<string, any>[] {
	return thumbnails.map(serializeThumbnail);
}

/**
 * Serializa un array de thumbnails con estadísticas
 */
export function serializeThumbnailsWithStats(thumbnails: ThumbnailWithStats[]): Record<string, any>[] {
	return thumbnails.map(serializeThumbnailWithStats);
}
