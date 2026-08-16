/**
 * @file Express Routes para Thumbnails usando Effect
 * @module server/routes/thumbnails.effect
 * @description Rutas REST para thumbnails implementadas con Effect-TS
 * @created 2026-02-02 - Migración desde thumbnails.ts
 */

import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { authorizeMediaAssetParam, getAuthorizedRootRegistry } from '@/server/security/authorized-root-request';
import { parseMediaAssetReference, resolveMediaAssetReference } from '@/server/security/media-asset-reference';
import { sanitizePublicPayload } from '@/server/security/sanitize-public-payload';
import { thumbnailEventService as baseThumbnailService } from '@/services/thumbnail/thumbnail-events.service';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail/types';
import { bulkGenerateThumbnails, deleteThumbnail, getThumbnail } from '../services/thumbnail.service';

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
	readonly deleteThumbnail: (imageId: string) => Effect.Effect<unknown, ThumbnailNotFound | ThumbnailGenerationFailed>;
	readonly getThumbnail: (
		imageId: string,
		quality: string
	) => Effect.Effect<unknown, ThumbnailNotFound | ThumbnailGenerationFailed>;
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
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();

async function authorizeImageIds(request: express.Request, imageIds: unknown[]): Promise<void> {
	const registry = getAuthorizedRootRegistry(request);
	await Promise.all(
		imageIds.map(async (imageId) => {
			const reference = parseMediaAssetReference({ assetId: imageId, assetType: 'image' });
			await resolveMediaAssetReference(registry, reference, 'read');
			await resolveMediaAssetReference(registry, reference, 'index');
		})
	);
}

/**
 * GET /thumbnails/image/:imageId - Obtener thumbnails de imagen
 */
router.get(
	'/image/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const { imageId } = req.params;
			const { quality } = req.query;

			const service = yield* ThumbnailService;
			return yield* service.getThumbnail(imageId, (quality as string) || 'medium');
		}).pipe(Effect.provide(ThumbnailServiceLive))
	)
);

/**
 * GET /thumbnails/stats - Obtener estadísticas de thumbnails
 */
router.get('/stats', (_req, res) =>
	sendRootScopedOperationRequired(
		res,
		'Las estadísticas globales no están disponibles hasta que pueda limitarse a un media root autorizado.'
	)
);

/**
 * POST /thumbnails/generate/:imageId - Generar thumbnails para imagen
 */
router.post(
	'/generate/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const { imageId } = req.params;
			const options = req.body || {};

			const service = yield* ThumbnailService;
			return yield* service.getThumbnail(imageId, options.quality || 'medium');
		}).pipe(Effect.provide(ThumbnailServiceLive))
	)
);

/**
 * POST /thumbnails/bulk-generate - Generar thumbnails en lote (OPTIMIZED)
 */
router.post(
	'/bulk-generate',
	effectHandler((req, res) => {
		const { imageIds, ...options } = req.body;

		if (!(imageIds && Array.isArray(imageIds))) {
			res.status(400).json({ error: 'imageIds (array) es requerido' });
			return Effect.succeed(undefined);
		}

		return Effect.gen(function* () {
			yield* Effect.promise(() => authorizeImageIds(req, imageIds));
			const service = yield* ThumbnailService;
			return yield* service.bulkGenerateThumbnails(imageIds, options);
		}).pipe(Effect.provide(ThumbnailServiceLive));
	})
);

/**
 * POST /thumbnails/batch - Nuevo endpoint optimizado para batch requests
 */
router.post(
	'/batch',
	effectHandler((req, res) => {
		const { requests } = req.body;

		if (!(requests && Array.isArray(requests))) {
			res.status(400).json({
				error: 'requests (array) es requerido. Formato: [{imageId, quality}, ...]',
			});
			return Effect.succeed(undefined);
		}

		return Effect.gen(function* () {
			yield* Effect.promise(() =>
				authorizeImageIds(
					req,
					requests.map((request: { imageId: unknown }) => request.imageId)
				)
			);
			const service = yield* ThumbnailService;
			return yield* service.batchGetThumbnails(requests);
		}).pipe(Effect.provide(ThumbnailServiceLive));
	})
);

/**
 * DELETE /thumbnails/image/:imageId - Eliminar thumbnails de imagen
 */
router.delete(
	'/image/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const { imageId } = req.params;

			const service = yield* ThumbnailService;
			return yield* service.deleteThumbnail(imageId);
		}).pipe(Effect.provide(ThumbnailServiceLive))
	)
);

/**
 * POST /thumbnails/clean - Limpiar thumbnails huérfanos
 */
router.post('/clean', (_req, res) => {
	sendRootScopedOperationRequired(
		res,
		'La limpieza global no está disponible hasta que pueda limitarse a un media root autorizado.'
	);
});

/**
 * POST /thumbnails/optimize - Optimizar thumbnails
 */
router.post('/optimize', (_req, res) => {
	sendRootScopedOperationRequired(
		res,
		'La optimización global no está disponible hasta que pueda limitarse a un media root autorizado.'
	);
});

/**
 * POST /thumbnails/reprocess - Reprocesar thumbnails
 */
router.post('/reprocess', (_req, res) => {
	sendRootScopedOperationRequired(
		res,
		'El reprocesado global no está disponible hasta que pueda limitarse a un media root autorizado.'
	);
});

/**
 * GET /thumbnails/last-processed - Obtener thumbnails procesados recientemente
 */
router.get('/last-processed', (_req, res) =>
	sendRootScopedOperationRequired(
		res,
		'El historial global no está disponible hasta que pueda limitarse a un media root autorizado.'
	)
);

function sendRootScopedOperationRequired(res: express.Response, message: string): void {
	res.status(410).json({
		code: 'ROOT_SCOPED_OPERATION_REQUIRED',
		message,
		retryable: false,
	});
}

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
		});

		const send = (event: string, data: Record<string, unknown> | string) => {
			const formatted = JSON.stringify(sanitizePublicPayload(typeof data === 'string' ? { message: data } : data));
			res.write(`event: ${event}\ndata: ${formatted}\n\n`);
		};

		const heartbeat = setInterval(() => {
			send('heartbeat', { timestamp: Date.now() });
		}, HEARTBEAT_INTERVAL);

		const progressHandler = (status: ProcessStatus) => send('progress', status as unknown as Record<string, unknown>);
		const errorHandler = (error: ThumbnailError | Error | string | unknown) => {
			if (error instanceof Error) {
				send('error', { message: error.message });
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
