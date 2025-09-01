/**
 * @file Video Result to WithStats Adapter
 * @module transformers/video/adapter
 */

import type { EntityStats } from '@/types/base';
import type { Video } from '@/types/database/video';
import type { VideoWithStats } from '@/types/entities/video';

/**
 * Estadísticas por defecto para Video
 */
function defaultVideoStats(): EntityStats {
	return {
		totalRelations: 0,
		completenessScore: 0.5,
		lastModified: new Date(),
		createdAt: new Date(),
	};
}

/**
 * Adapta un objeto Video de la base de datos al formato VideoWithStats
 */
export function adaptVideoToWithStats(video: Video): VideoWithStats {
	// Calcular isFavorite basado en algún criterio simple
	const isFavorite = video.metadata ? JSON.stringify(video.metadata).includes('favorite') : false;

	return {
		...video,
		stats: defaultVideoStats(),
		isFavorite,
		entityType: 'video' as const,
	};
}

/**
 * Adapta una lista de Video al formato VideoWithStats[]
 */
export function adaptVideoListToWithStats(videos: Video[]): VideoWithStats[] {
	return videos.map(adaptVideoToWithStats);
}
