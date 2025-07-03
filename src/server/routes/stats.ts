import express from 'express';
import { getGeneralStats, getSystemStatsExtended } from '@/app/actions/stats/stats.actions';

const router = express.Router();

// GET /stats/general - Obtener estadísticas generales
router.get('/general', async (req, res) => {
	try {
		const stats = await getGeneralStats();
		res.json(stats);
	} catch (error) {
		console.error('Error getting general stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/extended - Obtener estadísticas extendidas del sistema
router.get('/extended', async (req, res) => {
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
		const { period = 'week', entityType, limit = '50' } = req.query;

		// TODO: Implementar función específica de actividad
		const activity = []; // await getRecentActivity({ period, entityType, limit: Number.parseInt(limit) });

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

		// TODO: Implementar función específica de top tags
		const topTags = []; // await getTopTags(Number.parseInt(limit));

		res.json(topTags);
	} catch (error) {
		console.error('Error getting top tags:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /stats/storage - Obtener desglose de almacenamiento
router.get('/storage', async (req, res) => {
	try {
		// TODO: Implementar función específica de storage breakdown
		const storage = {
			images: { count: 0, size: 0, percentage: 0 },
			videos: { count: 0, size: 0, percentage: 0 },
			audio: { count: 0, size: 0, percentage: 0 },
			documents: { count: 0, size: 0, percentage: 0 },
			thumbnails: { count: 0, size: 0, percentage: 0 },
			other: { count: 0, size: 0, percentage: 0 },
		};

		res.json(storage);
	} catch (error) {
		console.error('Error getting storage breakdown:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
