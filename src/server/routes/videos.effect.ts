/**
 * @file Express Routes para Videos usando Effect
 * @module server/routes/videos.effect
 * @description Rutas REST para Videos implementadas con Effect-TS
 * @created 2025-01-10 - Phase 6.2 VideoService Effect Implementation
 */

import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle';
import { videos } from '@/lib/drizzle/schema';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { favoriteService } from '@/services/favorite/favorite.service';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { VideoService, VideoServiceLive } from '@/services/video/video.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset, validateBatchSize } from '../utils/pagination';
import { sortEntitiesByField } from '../utils/sort';

const router = express.Router();

/**
 * GET /videos - Listar videos con filtros y paginación
 */
router.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const videoService = yield* VideoService;

		const {
			search,
			limit = '50',
			offset = '0',
			sortBy = 'createdAt',
			sortOrder = 'desc',
			folderId,
			isFavorite,
			isHidden,
			minDuration,
			maxDuration,
			minWidth,
			maxWidth,
			minHeight,
			maxHeight,
			minSize,
			maxSize,
		} = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
			folderId: folderId as string | undefined,
			isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
			isHidden: isHidden === 'true' ? true : isHidden === 'false' ? false : undefined,
			minDuration: minDuration ? Number.parseInt(minDuration as string, 10) : undefined,
			maxDuration: maxDuration ? Number.parseInt(maxDuration as string, 10) : undefined,
			minWidth: minWidth ? Number.parseInt(minWidth as string, 10) : undefined,
			maxWidth: maxWidth ? Number.parseInt(maxWidth as string, 10) : undefined,
			minHeight: minHeight ? Number.parseInt(minHeight as string, 10) : undefined,
			maxHeight: maxHeight ? Number.parseInt(maxHeight as string, 10) : undefined,
			minSize: minSize ? Number.parseInt(minSize as string, 10) : undefined,
			maxSize: maxSize ? Number.parseInt(maxSize as string, 10) : undefined,
		};

		const result = yield* videoService.getAll(filters);

		const data = result.map((video) => ({
			...video,
			entityType: 'video' as const,
			thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
		}));

		return {
			data,
			pagination: {
				total: data.length,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: data.length >= filters.limit,
				hasPrev: filters.offset > 0,
			},
		};
	}).pipe(Effect.provide(VideoServiceLive))
));

/**
 * GET /videos/favorites - Listar solo videos favoritos
 */
router.get('/favorites', effectHandler((req) =>
	Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const favoriteCounts = yield* Effect.tryPromise({
			try: () => favoriteService.getCountsByType(),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const totalFavorites = favoriteCounts[FavoriteEntityType.VIDEO] ?? 0;

		if (totalFavorites === 0) {
			return [];
		}

		const favoriteResult = yield* Effect.tryPromise({
			try: () =>
				favoriteService.list({
					entityType: FavoriteEntityType.VIDEO,
					search: filters.search,
					limit: totalFavorites,
					offset: 0,
					sortBy: 'addedAt',
					sortOrder: 'desc',
				}),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const favoriteVideos = yield* Effect.all(
			favoriteResult.items.map((favorite) =>
				videoService.getByIdWithStats(favorite.entityId).pipe(
					Effect.map((video) => ({
						...video,
						entityType: 'video' as const,
						thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
					})),
					Effect.catchAll(() => Effect.succeed(null))
				)
			)
		);

		const data = sortEntitiesByField(
			favoriteVideos.flatMap((video) => (video ? [video] : [])),
			filters.sortBy,
			filters.sortOrder
		).slice(filters.offset, filters.offset + filters.limit);

		return data;
	}).pipe(Effect.provide(VideoServiceLive))
));

/**
 * GET /videos/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', effectHandler((req) =>
	Effect.gen(function* () {
		const videoService = yield* VideoService;

		const stats = yield* videoService.getFormatStats();

		return { stats };
	}).pipe(Effect.provide(VideoServiceLive))
));

/**
 * GET /videos/by-hash/:hash - Buscar video por hash
 */
router.get('/by-hash/:hash', effectHandler((req, res) => {
	const { hash } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getByHash(hash);

		if (!video) {
			res.status(404).json({
				error: 'NOT_FOUND',
				message: `Video con hash ${hash} no encontrado`,
			});
			return;
		}

		return video;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * GET /videos/folder/:folderId - Listar videos por folder
 */
router.get('/folder/:folderId', effectHandler((req) => {
	const { folderId } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* videoService.getByFolder(folderId, filters);

		const data = result.map((video) => ({
			...video,
			entityType: 'video' as const,
			thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
		}));

		return data;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * GET /videos/folder/:folderId/count - Contar videos en un folder
 */
router.get('/folder/:folderId/count', effectHandler((req) => {
	const { folderId } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const count = yield* videoService.countByFolder(folderId);

		return { count };
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * POST /videos - Crear nuevo video
 */
router.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.create(req.body);

		res.status(201);
		return video;
	}).pipe(Effect.provide(VideoServiceLive))
));

/**
 * GET /videos/:id/stats - Obtener video con estadísticas
 */
router.get('/:id/stats', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getByIdWithStats(id);

		return video;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * PATCH /videos/:id - Actualizar video
 */
router.patch('/:id', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.update(id, req.body);

		return video;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * POST /videos/:id/favorite - Toggle favorito de un video
 */
router.post('/:id/favorite', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;
		const video = yield* videoService.toggleFavorite(id);

		return video;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * POST /videos/:id/tags - Agregar tags a un video
 */
router.post('/:id/tags', effectHandler((req, res) =>
	Effect.gen(function* () {
		const tagService = yield* TagService;
		const tagIds = Array.isArray(req.body?.tagIds) ? req.body.tagIds : [];
		const result = yield* tagService.addToVideo(req.params.id, tagIds);
		res.status(201);
		return { success: true, added: result.added };
	}).pipe(Effect.provide(TagServiceLive))
));

/**
 * POST /videos/batch/favorite - Establecer favorito para múltiples videos
 */
router.post('/batch/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const { ids, isFavorite } = req.body;

		if (!Array.isArray(ids) || typeof isFavorite !== 'boolean') {
			yield* Effect.fail(new Error('Invalid request: ids must be array and isFavorite must be boolean'));
		}

		validateBatchSize(ids);

		const count = yield* Effect.tryPromise({
			try: () => favoriteService.setMany(FavoriteEntityType.VIDEO, ids, isFavorite),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		return { success: true, count, updated: count };
	})
));

/**
 * DELETE /videos/:id - Eliminar video
 */
router.delete('/:id', effectHandler((req, res) => {
	const { id } = req.params;
	const { force } = req.query;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		yield* videoService.deleteById(id, force === 'true');

		res.status(204);
		return undefined;
	}).pipe(Effect.provide(VideoServiceLive));
}));

/**
 * DELETE /videos/batch - Eliminar múltiples videos
 */
router.delete('/batch', effectHandler((req) =>
	Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { ids, force } = req.body;

		if (!Array.isArray(ids)) {
			yield* Effect.fail(new Error('Invalid request: ids must be an array'));
		}

		const count = yield* videoService.deleteManyByIds(ids, force === true);

		return { success: true, count, deleted: count };
	}).pipe(Effect.provide(VideoServiceLive))
));

/**
 * GET /videos/:id/content - Servir el video original
 */
router.get('/:id/content', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;
		const video = yield* videoService.getById(id);
		return video;
	}).pipe(Effect.provide(VideoServiceLive));

	try {
		const video = await Effect.runPromise(effect);

		if (!video?.path) {
			res.status(404).send('Video not found');
			return;
		}

		const fs = require('fs');
		if (!fs.existsSync(video.path)) {
			res.status(404).send('Video file not found');
			return;
		}

		// Determinar mime type básico por extensión
		const ext = video.path.split('.').pop()?.toLowerCase();
		let mimeType = 'video/mp4';
		if (ext === 'webm') mimeType = 'video/webm';
		if (ext === 'ogg') mimeType = 'video/ogg';
		if (ext === 'mov') mimeType = 'video/quicktime';
		if (ext === 'mkv') mimeType = 'video/x-matroska';

		res.sendFile(video.path, {
			acceptRanges: true,
			headers: {
				'Content-Type': mimeType,
			},
		});
	} catch (error) {
		const httpError = require('@/lib/effect/adapters/express.adapter').errorToHttpStatus(error);
		res.status(httpError.status).json({
			error: httpError.message,
			...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
		});
	}
});

/**
 * GET /videos/:id/thumbnail - Servir thumbnail de video
 */
router.get('/:id/thumbnail', effectHandler(
	(req) =>
		Effect.gen(function* () {
			const videoService = yield* VideoService;
			const video = yield* videoService.getById(req.params.id);
			const timeParam = (req.query.time || req.query.timestamp) as string | undefined;
			const time = timeParam ? Number.parseFloat(timeParam) : 1;
			return { video, time };
		}).pipe(Effect.provide(VideoServiceLive)),
	{
		onSuccess: async ({ video, time }, res) => {
			const id = video.id;

			if (!video) {
				res.status(404).send('Video not found');
				return;
			}

			// 1) Intentar desde DB (thumbnail base64)
			if (video.thumbnail) {
				try {
					const buffer = Buffer.from(video.thumbnail, 'base64');
					res.set({
						'Content-Type': 'image/jpeg',
						'Content-Length': buffer.length.toString(),
						'Cache-Control': 'public, max-age=31536000',
					});
					res.send(buffer);
					return;
				} catch {
					// continuar a fallback
				}
			}

			// Fallback: generar thumbnail estático con FFmpeg
			try {
				const { generateStaticVideoThumbnailFFmpeg } = await import('@/lib/utils/video/ffmpeg-thumbnails');
				const timestamp = Number.isFinite(time) ? Math.max(0.05, Math.min(time as number, 36_000)) : 1;

				const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
					time: timestamp,
					width: 320,
					height: 240,
					quality: 'medium',
				});

				if (thumbnailBuffer) {
					// Guardar el thumbnail generado en la base de datos para futuras solicitudes
					try {
						await db
							.update(videos)
							.set({
								thumbnail: thumbnailBuffer.toString('base64'),
								thumbnailSize: thumbnailBuffer.length,
								thumbnailWidth: 320,
								thumbnailHeight: 240,
								updatedAt: new Date(),
							})
							.where(eq(videos.id, id));
					} catch (saveError) {
						console.warn('No se pudo guardar el thumbnail en la base de datos:', saveError);
					}

					const etag = `W/"${thumbnailBuffer.length.toString(16)}-${id}"`;
					const lastModified = new Date().toUTCString();

					res.set({
						'Content-Type': 'image/webp',
						'Content-Length': thumbnailBuffer.length.toString(),
						'Cache-Control': 'public, max-age=86400',
						ETag: etag,
						'Last-Modified': lastModified,
						Vary: 'Accept, Accept-Encoding',
					});
					res.send(thumbnailBuffer);
					return;
				}
			} catch (error) {
				console.error('Error generating static thumbnail with FFmpeg:', error);
			}

			res.status(500).send('Unable to generate thumbnail');
		},
	}
));

/**
 * GET /videos/:id - Obtener video por ID (último para evitar conflictos con rutas dinámicas)
 */
router.get('/:id', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getById(id);

		return video;
	}).pipe(Effect.provide(VideoServiceLive));
}));

export default router;
