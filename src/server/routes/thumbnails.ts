import { and, desc, isNotNull } from 'drizzle-orm';
import express from 'express';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { thumbnailEventService as baseThumbnailService } from '@/services/thumbnail/thumbnail-events.service';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail/types';
import {
	bulkGenerateThumbnails,
	cleanThumbnails,
	deleteThumbnail,
	getThumbnail,
	getThumbnailStats,
	optimizeThumbnails,
	reprocessThumbnails,
} from '../services/thumbnail.service';

const router = express.Router();

// GET /thumbnails/image/:imageId - Obtener thumbnails de imagen
router.get('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const { quality } = req.query;
		const thumbnail = await getThumbnail(imageId, quality as any);
		res.json(thumbnail);
	} catch (error) {
		serverLogger.error('Error obteniendo thumbnail de imagen:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/stats - Obtener estadísticas de thumbnails
router.get('/stats', async (_req, res) => {
	try {
		const stats = await getThumbnailStats();
		res.json(stats);
	} catch (error) {
		serverLogger.error('Error obteniendo estadísticas de thumbnails:', error);
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
		serverLogger.error('Error generando thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/bulk-generate - Generar thumbnails en lote (OPTIMIZED)
router.post('/bulk-generate', async (req, res) => {
	try {
		const { imageIds, ...options } = req.body;

		if (!(imageIds && Array.isArray(imageIds))) {
			res.status(400).json({
				error: 'imageIds (array) es requerido',
			});
			return;
		}

		// Validar límite razonable para evitar sobrecargar el servidor
		if (imageIds.length > 50) {
			res.status(400).json({
				error: 'Máximo 50 imágenes por batch para optimizar performance',
			});
			return;
		}

		const result = await bulkGenerateThumbnails(imageIds, options);
		res.json(result);
		return;
	} catch (error) {
		serverLogger.error('Error in bulk thumbnail generation:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
	}
});

// POST /thumbnails/batch - Nuevo endpoint optimizado para batch requests
router.post('/batch', async (req, res) => {
	try {
		const { requests } = req.body;

		if (!(requests && Array.isArray(requests))) {
			res.status(400).json({
				error: 'requests (array) es requerido. Formato: [{imageId, quality}, ...]',
			});
			return;
		}

		// Validar límite razonable
		if (requests.length > 20) {
			res.status(400).json({
				error: 'Máximo 20 requests por batch',
			});
			return;
		}

		// Procesar en paralelo con concurrencia limitada
		const batchResults = await Promise.allSettled(
			requests.map(async (req: any) => {
				try {
					const thumbnail = await getThumbnail(req.imageId, req.quality || 'medium');
					return {
						imageId: req.imageId,
						success: true,
						data: thumbnail,
					};
				} catch (error) {
					return {
						imageId: req.imageId,
						success: false,
						error: error instanceof Error ? error.message : 'Error desconocido',
					};
				}
			})
		);

		const results = batchResults.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value;
			}
			return {
				imageId: requests[index].imageId,
				success: false,
				error: result.reason?.message || 'Error desconocido',
			};
		});

		res.json({
			results,
			summary: {
				total: requests.length,
				successful: results.filter((r) => r.success).length,
				failed: results.filter((r) => !r.success).length,
			},
		});
	} catch (error) {
		serverLogger.error('Error in batch thumbnail processing:', error);
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
		serverLogger.error('Error eliminando thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /thumbnails/cleanup - Limpiar thumbnails huérfanos
router.post('/cleanup', async (req, res) => {
	try {
		const result = await cleanThumbnails(req.body);
		res.json(result);
	} catch (error) {
		serverLogger.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/cleanup - Limpiar thumbnails
router.get('/cleanup', async (req, res) => {
	try {
		const result = await cleanThumbnails(req.query);
		res.json(result);
	} catch (error) {
		serverLogger.error('Error cleaning up thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/optimize - Optimizar thumbnails
router.get('/optimize', async (req, res) => {
	try {
		const result = await optimizeThumbnails(req.query);
		res.json(result);
	} catch (error) {
		serverLogger.error('Error optimizing thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/reprocess - Reprocesar thumbnails
router.get('/reprocess', async (req, res) => {
	try {
		const result = await reprocessThumbnails(req.query);
		res.json(result);
	} catch (error) {
		serverLogger.error('Error reprocessing thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/last-processed - Obtener thumbnails procesados recientemente
router.get('/last-processed', async (req, res) => {
	try {
		const { limit = '9' } = req.query;
		const limitNum = Number.parseInt(limit as string, 10);

		// Consulta a la base de datos para obtener thumbnails recientes
		// Usando la tabla images como referencia para thumbnails procesados
		const recentThumbnails = await db.query.images.findMany({
			columns: {
				id: true,
				path: true,
				updatedAt: true,
			},
			where: and(
				// Solo imágenes que tengan thumbnails generados
				isNotNull(images.thumbnailWidth),
				isNotNull(images.thumbnailHeight)
			),
			orderBy: desc(images.updatedAt),
			limit: limitNum,
		});

		const formattedThumbnails = recentThumbnails.map((img: { id: string; path: string; updatedAt: Date }) => ({
			id: img.id,
			path: img.path,
			processedAt: img.updatedAt.toISOString(),
		}));

		res.json(formattedThumbnails);
	} catch (error) {
		serverLogger.error('Error obteniendo thumbnails procesados recientes:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /thumbnails/events - Eventos SSE de procesamiento
router.get('/events', async (req, res) => {
	try {
		const HEARTBEAT_INTERVAL = 15_000;
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

		baseThumbnailService.onProgress(progressHandler);
		baseThumbnailService.onError(errorHandler as (error: ThumbnailError) => void);
		baseThumbnailService.onComplete(completeHandler);
		baseThumbnailService.onStats(statsHandler);

		req.on('close', () => {
			clearInterval(heartbeat);
			baseThumbnailService.offProgress(progressHandler);
			baseThumbnailService.offError(errorHandler as (error: ThumbnailError) => void);
			baseThumbnailService.offComplete(completeHandler);
			baseThumbnailService.offStats(statsHandler);
		});

		send('connected', { timestamp: Date.now() });
	} catch (error) {
		serverLogger.error('Error en conexión SSE:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
