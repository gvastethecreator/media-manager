/**
 * @file Express Routes para Images usando Effect
 * @module server/routes/images.effect
 * @description Rutas REST para Images implementadas con Effect-TS
 * @created 2025-10-11 - Phase 6.1 ImageService Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import { ImageService, ImageServiceLive } from '@/services/image/image.service.effect';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { sanitizeLimit, sanitizeOffset, validateBatchSize } from '../utils/pagination';

const router = express.Router();

/**
 * GET /images - Listar imágenes con filtros y paginación
 */
router.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		const {
			search,
			limit = '50',
			offset = '0',
			sortBy = 'createdAt',
			sortOrder = 'desc',
			folderId,
			isFavorite,
			minWidth,
			maxWidth,
			minHeight,
			maxHeight,
			minSize,
			maxSize,
			aiEngine,
			aiModel,
			aiOriginDetected,
		} = req.query;

		const options = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height') || 'createdAt',
			orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
			folderId: folderId as string | undefined,
			isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
			minWidth: minWidth ? Number.parseInt(minWidth as string, 10) : undefined,
			maxWidth: maxWidth ? Number.parseInt(maxWidth as string, 10) : undefined,
			minHeight: minHeight ? Number.parseInt(minHeight as string, 10) : undefined,
			maxHeight: maxHeight ? Number.parseInt(maxHeight as string, 10) : undefined,
			minSize: minSize ? Number.parseInt(minSize as string, 10) : undefined,
			maxSize: maxSize ? Number.parseInt(maxSize as string, 10) : undefined,
			aiEngine: aiEngine as string | undefined,
			aiModel: aiModel as string | undefined,
			aiOriginDetected: aiOriginDetected === 'true' ? true : aiOriginDetected === 'false' ? false : undefined,
		};

		const result = yield* imageService.getAll(options);

		const data = result.images.map((image) => ({
			...image,
			entityType: 'image' as const,
			thumbnailUrl: `/api/images/${image.id}/thumbnail`,
		}));

		return {
			data,
			pagination: {
				total: result.total,
				limit: result.limit,
				offset: result.offset,
				hasNext: result.hasMore,
				hasPrev: result.offset > 0,
			},
		};
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /images/favorites - Listar solo imágenes favoritas
 */
router.get('/favorites', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const favorites = yield* imageService.getAllFavorites();
		return { data: favorites };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /images/by-hash/:hash - Buscar imagen por hash SHA-256
 */
router.get('/by-hash/:hash', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.getByHash(req.params.hash);
		return image;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /images/folder/:folderId - Listar imágenes de una carpeta
 */
router.get('/folder/:folderId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		const { limit, offset } = req.query;

		const options = {
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
		};

		const images = yield* imageService.getByFolder(req.params.folderId, options);

		return { data: images };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /images/folder/:folderId/count - Contar imágenes en una carpeta
 */
router.get('/folder/:folderId/count', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const count = yield* imageService.countByFolder(req.params.folderId);
		return { count };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /images - Crear nueva imagen
 */
router.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		// El servicio validará el input internamente con ImageCreateInput.make()
		const image = yield* imageService.create(req.body);
		return image;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 201 });
});

/**
 * GET /images/:id/stats - Obtener imagen con estadísticas completas
 */
router.get('/:id/stats', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const imageWithStats = yield* imageService.getByIdWithStats(req.params.id);
		return imageWithStats;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * PATCH /images/:id - Actualizar campos de una imagen
 */
router.patch('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		// El servicio validará el input internamente con ImageUpdateInput.make()
		const image = yield* imageService.update(req.params.id, req.body);
		return image;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /images/:id/favorite - Toggle favorite status
 */
router.post('/:id/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.toggleFavorite(req.params.id);
		return image;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /images/:id/tags - Agregar tags a una imagen
 */
router.post('/:id/tags', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		const tagIds = Array.isArray(req.body?.tagIds) ? req.body.tagIds : [];
		const result = yield* tagService.addToImage(req.params.id, tagIds);
		return { success: true, added: result.added };
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 201 });
});

/**
 * POST /images/batch/favorite - Actualizar favorito en lote
 */
router.post('/batch/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		const { ids, isFavorite } = req.body;

		if (!Array.isArray(ids) || typeof isFavorite !== 'boolean') {
			yield* Effect.fail(new Error('Invalid request: ids must be array and isFavorite must be boolean'));
		}

		validateBatchSize(ids);

		const count = yield* imageService.setFavoriteMany(ids, isFavorite);
		return { success: true, count };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /images/:id - Eliminar imagen
 */
router.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		const force = req.query.force === 'true';

		yield* imageService.deleteById(req.params.id, { force });
		return { success: true };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 204 });
});

/**
 * DELETE /images/batch - Eliminar múltiples imágenes
 */
router.delete('/batch', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;

		const { ids } = req.body;
		const force = req.query.force === 'true';

		if (!Array.isArray(ids)) {
			yield* Effect.fail(new Error('Invalid request: ids must be array'));
		}

		validateBatchSize(ids);

		const count = yield* imageService.deleteManyByIds(ids, { force });
		return { success: true, count };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 204 });
});

/**
 * POST /images/:id/thumbnail/generate - Generar thumbnail manualmente
 */
router.post('/:id/thumbnail/generate', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		yield* imageService.generateThumbnail(req.params.id);
		return { success: true, message: 'Thumbnail generated' };
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /images/:id/thumbnail - Obtener thumbnail (genera si no existe)
 */
router.get('/:id/thumbnail', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const buffer = yield* imageService.getThumbnail(req.params.id);
		return buffer;
	}).pipe(Effect.provide(ImageServiceLive));

	try {
		const buffer = await Effect.runPromise(effect);
		res.set('Content-Type', 'image/webp');
		res.send(buffer);
	} catch (error) {
		const httpError = require('@/lib/effect/adapters/express.adapter').errorToHttpStatus(error);
		res.status(httpError.status).json({
			error: httpError.message,
			...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
		});
	}
});

/**
 * GET /images/:id/content - Obtener imagen original (Alias de /original para compatibilidad)
 */
router.get('/:id/content', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.getById(req.params.id);
		const buffer = yield* imageService.getOriginalImage(req.params.id);
		return { buffer, image };
	}).pipe(Effect.provide(ImageServiceLive));

	try {
		const { buffer, image } = await Effect.runPromise(effect);

		let mimeType = 'image/jpeg';
		if (image?.path) {
			const ext = image.path.split('.').pop()?.toLowerCase();
			if (ext === 'png') mimeType = 'image/png';
			if (ext === 'gif') mimeType = 'image/gif';
			if (ext === 'webp') mimeType = 'image/webp';
			if (ext === 'svg') mimeType = 'image/svg+xml';
			if (ext === 'bmp') mimeType = 'image/bmp';
			if (ext === 'avif') mimeType = 'image/avif';
		}

		res.set({
			'Content-Type': mimeType,
			'Content-Length': buffer.length.toString(),
			'Cache-Control': 'public, max-age=31536000',
		});
		res.send(buffer);
	} catch (error) {
		const httpError = require('@/lib/effect/adapters/express.adapter').errorToHttpStatus(error);
		res.status(httpError.status).json({
			error: httpError.message,
			...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
		});
	}
});

/**
 * GET /images/:id/original - Obtener imagen original
 */
router.get('/:id/original', async (req, res) => {
	try {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const imageService = yield* ImageService;
				const image = yield* imageService.getById(req.params.id);
				const buffer = yield* imageService.getOriginalImage(req.params.id);
				return { buffer, path: image?.path };
			}).pipe(Effect.provide(ImageServiceLive))
		);

		const ext = result.path?.split('.').pop()?.toLowerCase();
		const mimeMap: Record<string, string> = {
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			gif: 'image/gif',
			webp: 'image/webp',
			svg: 'image/svg+xml',
			bmp: 'image/bmp',
			avif: 'image/avif',
			ico: 'image/x-icon',
		};
		const mimeType = (ext && mimeMap[ext]) || 'application/octet-stream';

		res.set({
			'Content-Type': mimeType,
			'Content-Length': result.buffer.length.toString(),
			'Cache-Control': 'public, max-age=31536000',
			'X-Content-Type-Options': 'nosniff',
		});
		res.send(result.buffer);
	} catch (error) {
		const httpError = require('@/lib/effect/adapters/express.adapter').errorToHttpStatus(error);
		res.status(httpError.status).json({
			error: httpError.message,
			...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
		});
	}
});

/**
 * GET /images/:id - Obtener imagen por ID (sin stats)
 * IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar rutas específicas
 */
router.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.getById(req.params.id);
		return image;
	}).pipe(Effect.provide(ImageServiceLive));

	await runEffectForExpress(effect, res);
});

export default router;
