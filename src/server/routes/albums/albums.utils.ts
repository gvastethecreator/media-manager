/**
 * @file albums.utils.ts
 * @module server/routes/albums/utils
 * @description Funciones auxiliares para rutas de albums
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';
import type { AlbumStats } from './albums.types';

const albumLogger = serverLogger.withContext('AlbumsAPI');

/**
 * Obtiene estadísticas de un álbum desde OptimizedStatsService
 */
export async function getAlbumStats(albumId: string): Promise<AlbumStats> {
	try {
		const stats = await OptimizedStatsService.getInstance().getAlbumStatsOptimized(albumId);
		return {
			imageCount: stats.imageCount || 0,
			videoCount: stats.videoCount || 0,
			totalSize: stats.totalSize || 0,
			entitiesCount: stats.entitiesCount || 0,
		};
	} catch (error) {
		albumLogger.error('Error getting album stats from OptimizedStatsService', { error, albumId });
		return {
			imageCount: 0,
			videoCount: 0,
			totalSize: 0,
			entitiesCount: 0,
		};
	}
}
