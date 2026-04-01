import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { getFolderStats, getStats, getSystemStats, getSystemStatsExtended } from '../services/stats.service';
import { sanitizeLimit } from '../utils/pagination';

const router = express.Router();

/**
 * Helper para crear errores tipados en catch de Effect.tryPromise
 */
function toError(context: string, error: unknown): Error {
	serverLogger.error(`${context}:`, error);
	return new Error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
}

// GET /stats/general - Obtener estadísticas generales
router.get(
	'/general',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getStats(),
			catch: (error) => toError('Error getting general stats', error),
		})
	)
);

// GET /stats/system - Obtener estadísticas del sistema (compatibilidad con frontend)
router.get(
	'/system',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemStats(),
			catch: (error) => toError('Error getting system stats', error),
		})
	)
);

// GET /stats/extended - Obtener estadísticas extendidas del sistema
router.get(
	'/extended',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: () => getSystemStatsExtended(),
			catch: (error) => toError('Error getting extended stats', error),
		})
	)
);

// GET /stats/activity - Obtener actividad reciente
router.get(
	'/activity',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: async () => {
				const { limit = '50' } = req.query;
				const stats = await getSystemStats();
				return stats?.recentActivity?.slice(0, sanitizeLimit(limit, 50, 200)) || [];
			},
			catch: (error) => toError('Error getting recent activity', error),
		})
	)
);

// GET /stats/top-tags - Obtener tags más populares
router.get(
	'/top-tags',
	effectHandler((req, _res) =>
		Effect.tryPromise({
			try: async () => {
				const { limit = '10' } = req.query;
				const stats = await getSystemStats();
				return stats?.topTags?.slice(0, sanitizeLimit(limit, 10, 100)) || [];
			},
			catch: (error) => toError('Error getting top tags', error),
		})
	)
);

// GET /stats/folders - Obtener estadísticas detalladas de carpetas
router.get(
	'/folders',
	effectHandler((_req, res) =>
		Effect.tryPromise({
			try: async () => {
				const stats = await getFolderStats();
				if (!stats) {
					res.status(500);
					return { error: 'No se pudieron obtener las estadísticas de carpetas' };
				}
				return stats;
			},
			catch: (error) => toError('Error getting folder stats', error),
		})
	)
);

// GET /stats/storage - Obtener desglose de almacenamiento
router.get(
	'/storage',
	effectHandler((_req, _res) =>
		Effect.tryPromise({
			try: async () => {
				const stats = await getSystemStatsExtended();

				const totalSize = stats?.totalSize || 0;
				const totalDocuments = stats?.totalDocuments || 0;
				const totalAudio = stats?.totalAudio || 0;
				const totalJsonFiles = stats?.totalJsonFiles || 0;
				const totalWorkflows = 0;
				const totalFile3D = stats?.totalFile3D || 0;

				const storage = {
					images: { count: stats?.totalImages || 0, size: totalSize, percentage: 0 },
					videos: { count: stats?.totalVideos || 0, size: stats?.videoSize || 0, percentage: 0 },
					audio: { count: stats?.totalAudio || 0, size: totalAudio, percentage: 0 },
					documents: { count: stats?.totalDocuments || 0, size: totalDocuments, percentage: 0 },
					thumbnails: { count: stats?.totalThumbnails || 0, size: stats?.thumbnailSize || 0, percentage: 0 },
					other: {
						count: (stats?.totalJsonFiles || 0) + (stats?.totalFile3D || 0) + totalWorkflows,
						size: totalJsonFiles + totalFile3D,
						percentage: 0,
					},
				};

				// Calcular porcentajes
				const grandTotalSize =
					storage.images.size +
					storage.videos.size +
					storage.audio.size +
					storage.documents.size +
					storage.thumbnails.size +
					storage.other.size;

				if (grandTotalSize > 0) {
					storage.images.percentage = (storage.images.size / grandTotalSize) * 100;
					storage.videos.percentage = (storage.videos.size / grandTotalSize) * 100;
					storage.audio.percentage = (storage.audio.size / grandTotalSize) * 100;
					storage.documents.percentage = (storage.documents.size / grandTotalSize) * 100;
					storage.thumbnails.percentage = (storage.thumbnails.size / grandTotalSize) * 100;
					storage.other.percentage = (storage.other.size / grandTotalSize) * 100;
				}

				return storage;
			},
			catch: (error) => toError('Error getting storage breakdown', error),
		})
	)
);

export default router;
