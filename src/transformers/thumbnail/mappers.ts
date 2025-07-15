/**
 * 🖼️ THUMBNAIL MAPPERS
 *
 * Funciones para mapear y convertir tipos de Thumbnail.
 *
 * @updated 2025-01-27
 */

import { ThumbnailBase, ThumbnailStatistics, ThumbnailWithStats } from '@/types/entities/thumbnail';

/**
 * Convierte ThumbnailBase a ThumbnailWithStats calculando estadísticas
 */
export function toThumbnailWithStats(thumbnail: ThumbnailBase): ThumbnailWithStats {
	const stats: ThumbnailStatistics = {
		aspectRatio: thumbnail.width > 0 ? thumbnail.width / thumbnail.height : 0,
		// Add other relevant stats based on the new ThumbnailBase
	};

	return {
		...thumbnail,
		stats,
	};
}
