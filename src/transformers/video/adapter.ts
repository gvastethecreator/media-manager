/**
 * @file Video Result to WithStats Adapter
 * @module transformers/video/adapter
 */

import type { VideoBase, VideoWithStats } from '@/types/entities/video';

/**
 * Estadísticas por defecto para Video
 */
// Tipado relajado temporalmente hasta definir VideoStats completo
function defaultVideoStats(): any {
	return {
		// Stats mínimas
		totalAssociations: 0,
		completenessScore: 0.5,
		lastModified: new Date(),
	};
}

/**
 * Adapta un objeto VideoBase de la base de datos al formato VideoWithStats
 */
export function adaptVideoToWithStats(video: VideoBase): VideoWithStats {
	return {
		...video,
		// Tipado relajado temporalmente hasta definir VideoStats completo
		stats: defaultVideoStats(),
		thumbnailUrl: '', // Agregando propiedad faltante
		isFavorite: false,
		entityType: 'video' as const,
	};
}

/**
 * Adapta una lista de VideoBase al formato VideoWithStats[]
 */
export function adaptVideoListToWithStats(videos: VideoBase[]): VideoWithStats[] {
	return videos.map(adaptVideoToWithStats);
}
