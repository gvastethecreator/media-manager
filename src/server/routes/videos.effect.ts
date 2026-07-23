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
import { serverLogger } from '@/lib/logger/server-logger';
import { setAuthorizedAssetCacheHeaders } from '@/server/security/authorized-asset-cache';
import {
	authorizeMediaAssetBodyIds,
	authorizeMediaAssetParam,
	authorizeMediaPlacementInput,
	authorizeMediaPathInput,
	filterAuthorizedMediaEntities,
	authorizeFolderPathById,
	getAuthorizedRootRegistry,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import {
	countAuthorizedMediaAssetsByFolder,
	resolveMediaAssetReference,
} from '@/server/security/media-asset-reference';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import {
	type Video,
	VideoService,
	type VideoServiceInterface,
	VideoServiceLive,
} from '@/services/video/video.service.effect';
import { sendEffectHttpError } from '../utils/content-delivery';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();
router.use(sanitizeJsonResponses);
const logger = serverLogger.withContext('VideosRoutes');
type VideoListOptions = Parameters<VideoServiceInterface['getAll']>[0];

function listAuthorizedVideos(
	request: { app: { locals: Record<string, unknown> } },
	service: VideoServiceInterface,
	options: VideoListOptions,
	page: { limit: number; offset: number }
) {
	return Effect.gen(function* () {
		const authorized: Video[] = [];
		let rawOffset = 0;
		const chunkSize = 500;
		while (true) {
			const chunk = yield* service.getAll({ ...options, limit: chunkSize, offset: rawOffset });
			authorized.push(
				...(yield* Effect.promise(() => filterAuthorizedMediaEntities(request, chunk, 'video', ['read', 'index'])))
			);
			rawOffset += chunk.length;
			if (chunk.length < chunkSize) break;
		}
		return {
			hasNext: page.offset + page.limit < authorized.length,
			items: authorized.slice(page.offset, page.offset + page.limit),
			total: authorized.length,
		};
	});
}

/**
 * GET /videos - Listar videos con filtros y paginación
 */
router.get(
	'/',
	effectHandler((req) =>
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

			const result = yield* listAuthorizedVideos(req, videoService, filters, {
				limit: filters.limit,
				offset: filters.offset,
			});

			const data = result.items.map((video) => ({
				...video,
				entityType: 'video' as const,
				thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
			}));

			return {
				data,
				pagination: {
					total: result.total,
					limit: filters.limit,
					offset: filters.offset,
					hasNext: result.hasNext,
					hasPrev: filters.offset > 0,
				},
			};
		}).pipe(Effect.provide(VideoServiceLive))
	)
);

/**
 * GET /videos/favorites - Listar solo videos favoritos
 */
router.get(
	'/favorites',
	effectHandler((req) =>
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

			const favoriteResult = yield* listAuthorizedVideos(
				req,
				videoService,
				{
					isFavorite: true,
					search: filters.search,
					sortBy: filters.sortBy,
					sortOrder: filters.sortOrder,
				},
				{
					limit: filters.limit,
					offset: filters.offset,
				}
			);

			const data = favoriteResult.items.map((video) => ({
				...video,
				entityType: 'video' as const,
				thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
			}));
			return {
				data,
				pagination: {
					total: favoriteResult.total,
					limit: filters.limit,
					offset: filters.offset,
					hasNext: favoriteResult.hasNext,
					hasPrev: filters.offset > 0,
				},
			};
		}).pipe(Effect.provide(VideoServiceLive))
	)
);

/**
 * GET /videos/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', (_req, res) => {
	res.status(410).json({
		code: 'AUTHORIZED_SCOPE_REQUIRED',
		message: 'Las estadísticas globales fueron retiradas hasta disponer de agregados por media root.',
		retryable: false,
	});
});

/**
 * GET /videos/by-hash/:hash - Buscar video por hash
 */
router.get(
	'/by-hash/:hash',
	effectHandler((req, res) => {
		const { hash } = req.params;

		return Effect.gen(function* () {
			const videoService = yield* VideoService;

			const candidates = yield* videoService.getByHashCandidates(hash);
			const [video] = yield* Effect.promise(() =>
				filterAuthorizedMediaEntities(req, candidates, 'video', ['read', 'index'])
			);

			if (!video) {
				res.status(404).json({
					error: 'NOT_FOUND',
					message: `Video con hash ${hash} no encontrado`,
				});
				return;
			}
			return video;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/**
 * GET /videos/folder/:folderId - Listar videos por folder
 */
router.get(
	'/folder/:folderId',
	authorizeFolderPathById('index'),
	effectHandler((req) => {
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

			const result = yield* listAuthorizedVideos(
				req,
				videoService,
				{ ...filters, folderId },
				{
					limit: filters.limit,
					offset: filters.offset,
				}
			);

			const data = result.items.map((video) => ({
				...video,
				entityType: 'video' as const,
				thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
			}));

			return data;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/**
 * GET /videos/folder/:folderId/count - Contar videos en un folder
 */
router.get(
	'/folder/:folderId/count',
	authorizeFolderPathById('index'),
	effectHandler((req) => {
		const { folderId } = req.params;

		return Effect.gen(function* () {
			const count = yield* Effect.promise(() =>
				countAuthorizedMediaAssetsByFolder(getAuthorizedRootRegistry(req), 'video', folderId, 'index')
			);

			return { count };
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/**
 * POST /videos - Crear nuevo video
 */
router.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const videoService = yield* VideoService;

			const video = yield* videoService.create(req.body);

			res.status(201);
			return video;
		}).pipe(Effect.provide(VideoServiceLive))
	)
);

/**
 * GET /videos/:id/stats - Obtener video con estadísticas
 */
router.get(
	'/:id/stats',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'index'] }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const videoService = yield* VideoService;

			const video = yield* videoService.getByIdWithStats(id);

			return video;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/**
 * PATCH /videos/:id - Actualizar video
 */
router.patch(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'write'] }),
	authorizeMediaPathInput({ expected: 'file', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const videoService = yield* VideoService;

			const video = yield* videoService.update(id, req.body);

			return video;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/**
 * POST /videos/:id/tags - Agregar tags a un video
 */
router.post(
	'/:id/tags',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'write'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;
			const tagIds = Array.isArray(req.body?.tagIds) ? req.body.tagIds : [];
			const result = yield* tagService.addToVideo(req.params.id, tagIds);
			res.status(201);
			return { success: true, added: result.added };
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * DELETE /videos/batch - Eliminar múltiples videos
 */
router.delete(
	'/batch',
	authorizeMediaAssetBodyIds({ assetType: 'video', permissions: ['delete'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const videoService = yield* VideoService;

			const { ids, force } = req.body;

			const count = yield* videoService.deleteManyByIds(ids, force === true);

			return { success: true, count, deleted: count };
		}).pipe(Effect.provide(VideoServiceLive))
	)
);

/**
 * DELETE /videos/:id - Eliminar video
 */
router.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'video', permissions: ['delete'] }),
	effectHandler((req, res) => {
		const { id } = req.params;
		const { force } = req.query;

		return Effect.gen(function* () {
			const videoService = yield* VideoService;

			yield* videoService.deleteById(id, force === 'true');

			res.status(204);
			return undefined;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

/** POST /videos/:id/restore - Restaurar un tombstone canónico. */
router.post(
	'/:id/restore',
	authorizeMediaAssetParam({
		allowDeleted: true,
		allowMissing: true,
		assetType: 'video',
		permissions: ['read', 'write'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const videoService = yield* VideoService;
			return yield* videoService.restoreById(req.params.id);
		}).pipe(Effect.provide(VideoServiceLive))
	)
);

/**
 * GET /videos/:id/content - Servir el video original
 */
router.get('/:id/content', async (req, res) => {
	const { id } = req.params;

	try {
		const resolved = await resolveMediaAssetReference(
			getAuthorizedRootRegistry(req),
			{ assetId: id, assetType: 'video' },
			'read'
		);

		// Determinar mime type básico por extensión
		const ext = resolved.absolutePath.split('.').pop()?.toLowerCase();
		let mimeType = 'video/mp4';
		if (ext === 'webm') mimeType = 'video/webm';
		if (ext === 'ogg') mimeType = 'video/ogg';
		if (ext === 'mov') mimeType = 'video/quicktime';
		if (ext === 'mkv') mimeType = 'video/x-matroska';

		res.sendFile(resolved.absolutePath, {
			acceptRanges: true,
			headers: {
				'Content-Type': mimeType,
			},
		});
	} catch (error) {
		if (!sendRootAuthorizationError(res, error)) sendEffectHttpError(res, error);
	}
});

/**
 * GET /videos/:id/thumbnail - Servir thumbnail de video
 */
router.get(
	'/:id/thumbnail',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'index'] }),
	effectHandler(
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
						});
						setAuthorizedAssetCacheHeaders(res, 'revalidate');
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

					const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(res.locals.authorizedAssetPath, {
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
							logger.warn('No se pudo guardar el thumbnail en la base de datos', { error: saveError });
						}

						const etag = `W/"${thumbnailBuffer.length.toString(16)}-${id}"`;
						const lastModified = new Date().toUTCString();

						res.set({
							'Content-Type': 'image/webp',
							'Content-Length': thumbnailBuffer.length.toString(),
							ETag: etag,
							'Last-Modified': lastModified,
							Vary: 'Accept, Accept-Encoding',
						});
						setAuthorizedAssetCacheHeaders(res, 'revalidate');
						res.send(thumbnailBuffer);
						return;
					}
				} catch (error) {
					logger.error('No se pudo generar el thumbnail estático', { error });
				}

				res.status(500).send('Unable to generate thumbnail');
			},
		}
	)
);

/**
 * GET /videos/:id - Obtener video por ID (último para evitar conflictos con rutas dinámicas)
 */
router.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'index'] }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const videoService = yield* VideoService;

			const video = yield* videoService.getById(id);

			return video;
		}).pipe(Effect.provide(VideoServiceLive));
	})
);

export default router;
