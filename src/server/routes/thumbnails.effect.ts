/**
 * @file Express Routes para Thumbnails usando Effect
 * @module server/routes/thumbnails.effect
 * @description Rutas REST para thumbnails implementadas con Effect-TS
 * @created 2026-02-02 - Migración desde thumbnails.ts
 */

import { and, desc, isNotNull } from 'drizzle-orm';
import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
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
import { sanitizeLimit } from '../utils/pagination';

// ==========================================
// 1. Definir errores tipados
// ==========================================

export class ThumbnailNotFound extends Data.TaggedError('ThumbnailNotFound')<{
	readonly imageId: string;
}> {}

export class ThumbnailGenerationFailed extends Data.TaggedError('ThumbnailGenerationFailed')<{
	readonly imageId: string;
	readonly message: string;
}> {}

export class BatchSizeExceeded extends Data.TaggedError('BatchSizeExceeded')<{
	readonly max: number;
	readonly actual: number;
}> {}

// ==========================================
// 2. Crear servicio Effect
// ==========================================

export interface ThumbnailServiceInterface {
	readonly batchGetThumbnails: (
		requests: { imageId: string; quality?: string }[]
	) => Effect.Effect<unknown, BatchSizeExceeded | ThumbnailGenerationFailed>;
	readonly bulkGenerateThumbnails: (
		imageIds: string[],
		options: Record<string, unknown>
	) => Effect.Effect<unknown, BatchSizeExceeded | ThumbnailGenerationFailed>;
	readonly cleanThumbnails: (options: Record<string, unknown>) => Effect.Effect<unknown, ThumbnailGenerationFailed>;
	readonly deleteThumbnail: (imageId: string) => Effect.Effect<unknown, ThumbnailNotFound | ThumbnailGenerationFailed>;
	readonly getLastProcessed: (limit: number) => Effect.Effect<unknown, ThumbnailGenerationFailed>;
	readonly getThumbnail: (
		imageId: string,
		quality: string
	) => Effect.Effect<unknown, ThumbnailNotFound | ThumbnailGenerationFailed>;
	readonly getThumbnailStats: () => Effect.Effect<unknown, ThumbnailGenerationFailed>;
	readonly optimizeThumbnails: (options: Record<string, unknown>) => Effect.Effect<unknown, ThumbnailGenerationFailed>;
	readonly reprocessThumbnails: (options: Record<string, unknown>) => Effect.Effect<unknown, ThumbnailGenerationFailed>;
}

export class ThumbnailService extends Context.Tag('ThumbnailService')<ThumbnailService, ThumbnailServiceInterface>() {}

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const ThumbnailServiceLive = Layer.succeed(
	ThumbnailService,
	ThumbnailService.of({
		getThumbnail: (imageId: string, quality: string) =>
			Effect.tryPromise({
				try: async () => {
					const thumbnail = await getThumbnail(imageId, quality as any);
					return thumbnail;
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId,
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		getThumbnailStats: () =>
			Effect.tryPromise({
				try: async () => {
					return await getThumbnailStats();
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId: 'stats',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		bulkGenerateThumbnails: (imageIds: string[], options: Record<string, unknown>) =>
			Effect.tryPromise({
				try: async () => {
					if (imageIds.length > 50) {
						throw new BatchSizeExceeded({ max: 50, actual: imageIds.length });
					}
					return await bulkGenerateThumbnails(imageIds, options);
				},
				catch: (error) => {
					if (error instanceof BatchSizeExceeded) {
						return error;
					}
					return new ThumbnailGenerationFailed({
						imageId: 'batch',
						message: error instanceof Error ? error.message : 'Error desconocido',
					});
				},
			}),

		batchGetThumbnails: (requests: { imageId: string; quality?: string }[]) =>
			Effect.tryPromise({
				try: async () => {
					if (requests.length > 20) {
						throw new BatchSizeExceeded({ max: 20, actual: requests.length });
					}

					const batchResults = await Promise.allSettled(
						requests.map(async (req) => {
							try {
								const thumbnail = await getThumbnail(req.imageId, (req.quality || 'medium') as any);
								return { imageId: req.imageId, success: true, data: thumbnail };
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
							error: 'Error desconocido',
						};
					});

					return {
						results,
						summary: {
							total: requests.length,
							successful: results.filter((r) => r.success).length,
							failed: results.filter((r) => !r.success).length,
						},
					};
				},
				catch: (error) => {
					if (error instanceof BatchSizeExceeded) {
						return error;
					}
					return new ThumbnailGenerationFailed({
						imageId: 'batch',
						message: error instanceof Error ? error.message : 'Error desconocido',
					});
				},
			}),

		deleteThumbnail: (imageId: string) =>
			Effect.tryPromise({
				try: async () => {
					return await deleteThumbnail(imageId);
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId,
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		cleanThumbnails: (options: Record<string, unknown>) =>
			Effect.tryPromise({
				try: async () => {
					return await cleanThumbnails(options);
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId: 'cleanup',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		optimizeThumbnails: (options: Record<string, unknown>) =>
			Effect.tryPromise({
				try: async () => {
					return await optimizeThumbnails(options);
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId: 'optimize',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		reprocessThumbnails: (options: Record<string, unknown>) =>
			Effect.tryPromise({
				try: async () => {
					return await reprocessThumbnails(options);
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId: 'reprocess',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		getLastProcessed: (limit: number) =>
			Effect.tryPromise({
				try: async () => {
					const recentThumbnails = await db.query.images.findMany({
						columns: { id: true, path: true, updatedAt: true },
						where: and(isNotNull(images.thumbnailWidth), isNotNull(images.thumbnailHeight)),
						orderBy: desc(images.updatedAt),
						limit,
					});

					return recentThumbnails.map((img: { id: string; path: string; updatedAt: Date }) => ({
						id: img.id,
						path: img.path,
						processedAt: img.updatedAt.toISOString(),
					}));
				},
				catch: (error) =>
					new ThumbnailGenerationFailed({
						imageId: 'last-processed',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();

/**
 * GET /thumbnails/image/:imageId - Obtener thumbnails de imagen
 */
router.get('/image/:imageId', effectHandler((req) =>
	Effect.gen(function* () {
		const { imageId } = req.params;
		const { quality } = req.query;

		const service = yield* ThumbnailService;
		return yield* service.getThumbnail(imageId, (quality as string) || 'medium');
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/stats - Obtener estadísticas de thumbnails
 */
router.get('/stats', effectHandler((_req) =>
	Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.getThumbnailStats();
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * POST /thumbnails/generate/:imageId - Generar thumbnails para imagen
 */
router.post('/generate/:imageId', effectHandler((req) =>
	Effect.gen(function* () {
		const { imageId } = req.params;
		const options = req.body || {};

		const service = yield* ThumbnailService;
		return yield* service.getThumbnail(imageId, options.quality || 'medium');
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * POST /thumbnails/bulk-generate - Generar thumbnails en lote (OPTIMIZED)
 */
router.post('/bulk-generate', effectHandler((req, res) => {
	const { imageIds, ...options } = req.body;

	if (!(imageIds && Array.isArray(imageIds))) {
		res.status(400).json({ error: 'imageIds (array) es requerido' });
		return Effect.succeed(undefined);
	}

	return Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.bulkGenerateThumbnails(imageIds, options);
	}).pipe(Effect.provide(ThumbnailServiceLive));
}));

/**
 * POST /thumbnails/batch - Nuevo endpoint optimizado para batch requests
 */
router.post('/batch', effectHandler((req, res) => {
	const { requests } = req.body;

	if (!(requests && Array.isArray(requests))) {
		res.status(400).json({
			error: 'requests (array) es requerido. Formato: [{imageId, quality}, ...]',
		});
		return Effect.succeed(undefined);
	}

	return Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.batchGetThumbnails(requests);
	}).pipe(Effect.provide(ThumbnailServiceLive));
}));

/**
 * DELETE /thumbnails/image/:imageId - Eliminar thumbnails de imagen
 */
router.delete('/image/:imageId', effectHandler((req) =>
	Effect.gen(function* () {
		const { imageId } = req.params;

		const service = yield* ThumbnailService;
		return yield* service.deleteThumbnail(imageId);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * POST /thumbnails/cleanup - Limpiar thumbnails huérfanos
 */
router.post('/cleanup', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.cleanThumbnails(req.body);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/cleanup - Limpiar thumbnails (alias)
 */
router.get('/cleanup', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.cleanThumbnails(req.query as Record<string, unknown>);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/optimize - Optimizar thumbnails
 */
router.get('/optimize', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.optimizeThumbnails(req.query as Record<string, unknown>);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/reprocess - Reprocesar thumbnails
 */
router.get('/reprocess', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* ThumbnailService;
		return yield* service.reprocessThumbnails(req.query as Record<string, unknown>);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/last-processed - Obtener thumbnails procesados recientemente
 */
router.get('/last-processed', effectHandler((req) =>
	Effect.gen(function* () {
		const { limit = '9' } = req.query;
		const limitNum = sanitizeLimit(limit, 9, 100);

		const service = yield* ThumbnailService;
		return yield* service.getLastProcessed(limitNum);
	}).pipe(Effect.provide(ThumbnailServiceLive))
));

/**
 * GET /thumbnails/events - Eventos SSE de procesamiento
 */
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
export { router as thumbnailsEffectRouter };
