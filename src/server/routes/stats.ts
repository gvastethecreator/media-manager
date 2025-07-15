import express from 'express';
import { getStats, getSystemStats, getSystemStatsExtended, getFolderStats } from '../services/stats.service';

const router = express.Router();

// GET /stats/general - Obtener estadísticas generales
router.get('/general', async (_req, res) => {
	try {
		const stats = await getStats();
		res.json(stats);
	} catch (error) {
		console.error('Error getting general stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/system - Obtener estadísticas del sistema (compatibilidad con frontend)
router.get('/system', async (_req, res) => {
	console.log('🎯 [ROUTER] /stats/system endpoint llamado');
	try {
		console.log('🎯 [ROUTER] Llamando a getSystemStats()...');
		const stats = await getSystemStats();
		console.log('🎯 [ROUTER] Resultado de getSystemStats:', stats);
		res.json(stats);
	} catch (error) {
		console.error('🚨 [ROUTER] Error getting system stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/extended - Obtener estadísticas extendidas del sistema
router.get('/extended', async (_req, res) => {
	try {
		const stats = await getSystemStatsExtended();
		res.json(stats);
	} catch (error) {
		console.error('Error getting extended stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/activity - Obtener actividad reciente
router.get('/activity', async (req, res) => {
	try {
		const { limit = '50' } = req.query;
		const stats = await getSystemStats();
		const activity = stats?.recentActivity?.slice(0, Number.parseInt(limit as string)) || [];
		res.json(activity);
	} catch (error) {
		console.error('Error getting recent activity:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/top-tags - Obtener tags más populares
router.get('/top-tags', async (req, res) => {
	try {
		const { limit = '10' } = req.query;
		const stats = await getSystemStats();
		const topTags = stats?.topTags?.slice(0, Number.parseInt(limit as string)) || [];
		res.json(topTags);
	} catch (error) {
		console.error('Error getting top tags:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/folders - Obtener estadísticas detalladas de carpetas
router.get('/folders', async (_req, res) => {
	try {
		const stats = await getFolderStats();
		if (!stats) {
			return res.status(500).json({ error: 'No se pudieron obtener las estadísticas de carpetas' });
		}
		res.json(stats);
	} catch (error) {
		console.error('Error getting folder stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/storage - Obtener desglose de almacenamiento
router.get('/storage', async (_req, res) => {
	try {
		const stats = await getSystemStatsExtended();

		const totalSize = stats?.totalSize || 0;
		const totalDocuments = stats?.totalDocuments || 0;
		const totalAudio = stats?.totalAudio || 0;
		const totalJsonFiles = stats?.totalJsonFiles || 0;
		const totalWorkflows = stats?.totalWorkflows || 0;
		const totalFile3D = stats?.totalFile3D || 0;

		const storage = {
			images: { count: stats?.totalImages || 0, size: totalSize, percentage: 0 },
			videos: { count: 0, size: 0, percentage: 0 }, // No hay datos directos
			audio: { count: 0, size: totalAudio, percentage: 0 },
			documents: { count: 0, size: totalDocuments, percentage: 0 },
			thumbnails: { count: 0, size: totalSize, percentage: 0 }, // totalSize es de thumbnails
			other: { count: 0, size: totalJsonFiles + totalWorkflows + totalFile3D, percentage: 0 },
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

		res.json(storage);
	} catch (error) {
		console.error('Error getting storage breakdown:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
