import express from 'express';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail';
import { thumbnailService } from '@/services/thumbnail';
import { cleanThumbnails, optimizeThumbnails, reprocessThumbnails } from '@/app/actions/thumbnails/thumbnails.actions';

const router = express.Router();

// GET /thumbnails/image/:imageId - Obtener thumbnails de imagen
router.get('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;

		// TODO: Implementar función para obtener thumbnails existentes
		const thumbnails = []; // await ThumbnailActions.getImageThumbnails(imageId);

		res.json(thumbnails);
	} catch (error) {
		console.error('Error getting image thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/stats - Obtener estadísticas de thumbnails
router.get('/stats', async (req, res) => {
	try {
		// TODO: Implementar función de stats
		const stats = {
			totalThumbnails: 0,
			totalSize: 0,
			averageSize: 0,
			bySize: {
				small: { count: 0, totalSize: 0 },
				medium: { count: 0, totalSize: 0 },
				large: { count: 0, totalSize: 0 },
			},
		};

		res.json(stats);
	} catch (error) {
		console.error('Error getting thumbnail stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/generate/:imageId - Generar thumbnails para imagen
router.post('/generate/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const options = req.body || {};

		// TODO: Implementar generación usando ThumbnailActions
		const thumbnails = []; // await ThumbnailActions.generateThumbnails(imageId, options);

		res.json(thumbnails);
	} catch (error) {
		console.error('Error generating thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/bulk-generate - Generar thumbnails en lote
router.post('/bulk-generate', async (req, res) => {
	try {
		const { imageIds, ...options } = req.body;

		if (!imageIds || !Array.isArray(imageIds)) {
			return res.status(400).json({ error: 'imageIds (array) es requerido' });
		}

		// TODO: Implementar generación en lote
		const result = {
			generated: imageIds.length,
			errors: [],
		};

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

		// TODO: Implementar eliminación
		const result = { deleted: 0 };

		res.json(result);
	} catch (error) {
		console.error('Error deleting thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/cleanup - Limpiar thumbnails huérfanos
router.post('/cleanup', async (req, res) => {
	try {
		const result = await cleanThumbnails();
		res.json(result);
	} catch (error) {
		console.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/cleanup - Limpiar thumbnails (compatibilidad Next.js)
router.get('/cleanup', async (_req, res) => {
	try {
		const result = await cleanThumbnails();
		res.json(result);
	} catch (error) {
		console.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/optimize - Optimizar thumbnails
router.get('/optimize', async (_req, res) => {
	try {
		const result = await optimizeThumbnails();
		res.json(result);
	} catch (error) {
		console.error('Error optimizing thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/reprocess - Reprocesar thumbnails
router.get('/reprocess', async (_req, res) => {
	try {
		const result = await reprocessThumbnails();
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
