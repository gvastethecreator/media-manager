/**
 * @file Acciones del servidor para estadísticas de videos
 * @module app/actions/videos/stats
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { videoService } from '@/services/video-service-export';
import type { VideoStats } from '@/types/entities/video/types';

// Logger específico para las acciones
const log = serverLogger.withContext('VideoActions:stats');

/**
 * Obtiene estadísticas generales de los videos
 * @returns Estadísticas completas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	try {
		log.info('📊 Obteniendo estadísticas generales de videos');
		const stats = await videoService.getVideoStats();
		log.info('✅ Estadísticas de videos obtenidas', { total: stats.total });
		return stats;
	} catch (error) {
		log.error('❌ Error al obtener estadísticas de videos', { error });
		throw error;
	}
}
