import express from 'express';
import { getThumbnail, optimizeThumbnails, reprocessThumbnails, cleanThumbnails, getLastProcessedThumbnails, getThumbnailStats, verifySignedToken } from '../services/thumbnail.service';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail';
import { thumbnailService } from '@/services/thumbnail';

const router = express.Router();

// GET /thumbnails/image/:imageId - Obtener thumbnails de imagen
router.get('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const { quality } = req.query;
		const thumbnail = await getThumbnail(imageId, quality as any);
		res.json(thumbnail);
	} catch (error) {
		console.error('Error obteniendo thumbnail de imagen:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/stats - Obtener estadísticas de thumbnails
router.get('/stats', async (req, res) => {
	try {
		const stats = await getThumbnailStats();
		res.json(stats);
	} catch (error) {
		console.error('Error obteniendo estadísticas de thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/generate/:imageId - Generar thumbnails para imagen
router.post('/generate/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const options = req.body || {};

		const thumbnail = await getThumbnail(imageId, options.quality);

		res.json(thumbnail);
	} catch (error) {
		console.error('Error generando thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/bulk-generate - Generar thumbnails en lote
router.post('/bulk-generate', async (req, res) => {
	try {
		const { imageIds, ...options } = req.body;

		if (!imageIds || !Array.isArray(imageIds)) {
			return res.status(400).json({
				error: 'imageIds (array) es requerido',
			});
		}

		const result = await bulkGenerateThumbnails(imageIds, options);
		res.json(result);
	} catch (error) {
		console.error('Error in bulk thumbnail generation:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /thumbnails/image/:imageId - Eliminar thumbnails de imagen
router.delete('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const result = await deleteThumbnail(imageId);
		res.json(result);
	} catch (error) {
		console.error('Error eliminando thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/cleanup - Limpiar thumbnails huérfanos
router.post('/cleanup', async (req, res) => {
	try {
		const result = await cleanThumbnails(req.body);
		res.json(result);
	} catch (error) {
		console.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/cleanup - Limpiar thumbnails (compatibilidad Next.js)
router.get('/cleanup', async (req, res) => {
	try {
		const result = await cleanThumbnails(req.query);
		res.json(result);
	} catch (error) {
		console.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/optimize - Optimizar thumbnails
router.get('/optimize', async (req, res) => {
	try {
		const result = await optimizeThumbnails(req.query);
		res.json(result);
	} catch (error) {
		console.error('Error optimizing thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/reprocess - Reprocesar thumbnails
router.get('/reprocess', async (req, res) => {
	try {
		const result = await reprocessThumbnails(req.query);
		res.json(result);
	} catch (error) {
		console.error('Error reprocessing thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/events - Eventos SSE de procesamiento
router.get('/events', async (req, res) => {
	try {
		const HEARTBEAT_INTERVAL = 15000;
		res.set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
			'Access-Control-Allow-Origin': '*',
		});

		const send = (event: string, data: Record<string, unknown> | string) => {
			const formatted = typeof data === 'string' ? data : JSON.stringify(data);
			res.write(`event: ${event}\ndata: ${formatted}\n\n`);
		};

		const heartbeat = setInterval(() => {
			send('heartbeat', { timestamp: Date.now() });
		}, HEARTBEAT_INTERVAL);

		const progressHandler = (status: ProcessStatus) => send('progress', status as unknown as Record<string, unknown>);
		const errorHandler = (error: ThumbnailError | Error | string | unknown) => {
			if (error instanceof Error) {
				send('error', { message: error.message, stack: error.stack });
			} else if (typeof error === 'string') {
				send('error', { message: error });
			} else {
				send('error', error as Record<string, unknown>);
			}
		};
		const completeHandler = (data: Record<string, unknown>) => send('complete', data);
		const statsHandler = (stats: Record<string, unknown>) => send('stats', stats);

		thumbnailService.onProgress(progressHandler);
		thumbnailService.onError(errorHandler as (error: ThumbnailError) => void);
		thumbnailService.onComplete(completeHandler);
		thumbnailService.onStats(statsHandler);

		req.on('close', () => {
			clearInterval(heartbeat);
			thumbnailService.offProgress(progressHandler);
			thumbnailService.offError(errorHandler as (error: ThumbnailError) => void);
			thumbnailService.offComplete(completeHandler);
			thumbnailService.offStats(statsHandler);
		});

		send('connected', { timestamp: Date.now() });
	} catch (error) {
		console.error('Error en conexión SSE:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
