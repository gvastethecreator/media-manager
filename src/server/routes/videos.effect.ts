/**
 * @file Express Routes para Videos usando Effect
 * @module server/routes/videos.effect
 * @description Rutas REST para Videos implementadas con Effect-TS
 * @created 2025-01-10 - Phase 6.2 VideoService Effect Implementation
 */

import express from 'express';
import { Effect } from 'effect';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import { VideoService, VideoServiceLive } from '@/services/video/video.service.effect';

const router = express.Router();

/**
 * GET /videos - Listar videos con filtros y paginación
 */
router.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
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
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
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

		return res.json(result);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/favorites - Listar solo videos favoritos
 */
router.get('/favorites', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* videoService.getAllFavorites(filters);

		return res.json(result);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const stats = yield* videoService.getFormatStats();

		return res.json({ stats });
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/by-hash/:hash - Buscar video por hash
 */
router.get('/by-hash/:hash', async (req, res) => {
	const { hash } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getByHash(hash);

		if (!video) {
			return res.status(404).json({
				error: 'NOT_FOUND',
				message: `Video con hash ${hash} no encontrado`,
			});
		}

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/folder/:folderId - Listar videos por folder
 */
router.get('/folder/:folderId', async (req, res) => {
	const { folderId } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* videoService.getByFolder(folderId, filters);

		return res.json(result);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/folder/:folderId/count - Contar videos en un folder
 */
router.get('/folder/:folderId/count', async (req, res) => {
	const { folderId } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const count = yield* videoService.countByFolder(folderId);

		return res.json({ count });
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /videos - Crear nuevo video
 */
router.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.create(req.body);

		return res.status(201).json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/:id/stats - Obtener video con estadísticas
 */
router.get('/:id/stats', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getByIdWithStats(id);

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * PATCH /videos/:id - Actualizar video
 */
router.patch('/:id', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.update(id, req.body);

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /videos/:id/favorite - Toggle favorito de un video
 */
router.post('/:id/favorite', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.toggleFavorite(id);

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /videos/batch/favorite - Establecer favorito para múltiples videos
 */
router.post('/batch/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { ids, isFavorite } = req.body;

		if (!Array.isArray(ids) || typeof isFavorite !== 'boolean') {
			yield* Effect.fail(new Error('Invalid request: ids must be array and isFavorite must be boolean'));
		}

		const count = yield* videoService.setFavoriteMany(ids, isFavorite);

		return { success: true, count, updated: count };
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /videos/:id - Eliminar video
 */
router.delete('/:id', async (req, res) => {
	const { id } = req.params;
	const { force } = req.query;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		yield* videoService.deleteById(id, force === 'true');

		return res.status(204).send();
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /videos/batch - Eliminar múltiples videos
 */
router.delete('/batch', async (req, res) => {
	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const { ids, force } = req.body;

		if (!Array.isArray(ids)) {
			yield* Effect.fail(new Error('Invalid request: ids must be an array'));
		}

		const count = yield* videoService.deleteManyByIds(ids, force === true);

		return { success: true, count, deleted: count };
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /videos/:id - Obtener video por ID (último para evitar conflictos con rutas dinámicas)
 */
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const videoService = yield* VideoService;

		const video = yield* videoService.getById(id);

		return res.json(video);
	}).pipe(Effect.provide(VideoServiceLive));

	await runEffectForExpress(effect, res);
});

export default router;
