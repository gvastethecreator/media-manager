/**
 * @file Express Routes para Images usando Effect
 * @module server/routes/images.effect
 * @description Rutas REST para Images implementadas con Effect-TS
 * @created 2025-10-11 - Phase 6.1 ImageService Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { favoriteService } from '@/services/favorite/favorite.service';
import { ImageService, ImageServiceLive } from '@/services/image/image.service.effect';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset, validateBatchSize } from '../utils/pagination';
import { sendEffectHttpError } from '../utils/content-delivery';
import { getMimeTypeFromPath } from '../utils/mime';

const router = express.Router();

/**
 * GET /images - Listar imágenes con filtros y paginación
 */
router.get('/', effectHandler((req) =>
	Effect.gen(function* () {
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
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * GET /images/favorites - Listar solo imágenes favoritas
 */
router.get('/favorites', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const favoriteResult = yield* listFavoriteEntities({
			entityType: FavoriteEntityType.IMAGE,
			search: filters.search,
			limit: filters.limit,
			offset: filters.offset,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
			getEntityById: (entityId: string) => imageService.getByIdWithStats(entityId),
			mapEntity: (image) => ({
				...image,
				entityType: 'image' as const,
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
			}),
		});

		return {
			data: favoriteResult.data,
			pagination: {
				total: favoriteResult.total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < favoriteResult.total,
				hasPrev: filters.offset > 0,
			},
		};
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * GET /images/by-hash/:hash - Buscar imagen por hash SHA-256
 */
router.get('/by-hash/:hash', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.getByHash(req.params.hash);
		return image;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * GET /images/folder/:folderId - Listar imágenes de una carpeta
 */
router.get('/folder/:folderId', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;

		const { limit, offset } = req.query;

		const options = {
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
		};

		const images = yield* imageService.getByFolder(req.params.folderId, options);

		return { data: images };
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * GET /images/folder/:folderId/count - Contar imágenes en una carpeta
 */
router.get('/folder/:folderId/count', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		const count = yield* imageService.countByFolder(req.params.folderId);
		return { count };
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * POST /images - Crear nueva imagen
 */
router.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;

		// El servicio validará el input internamente con ImageCreateInput.make()
		const image = yield* imageService.create(req.body);
		res.status(201);
		return image;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * GET /images/:id/stats - Obtener imagen con estadísticas completas
 */
router.get('/:id/stats', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		const imageWithStats = yield* imageService.getByIdWithStats(req.params.id);
		return imageWithStats;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * PATCH /images/:id - Actualizar campos de una imagen
 */
router.patch('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;

		// El servicio validará el input internamente con ImageUpdateInput.make()
		const image = yield* imageService.update(req.params.id, req.body);
		return image;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * POST /images/:id/favorite - Toggle favorite status
 */
router.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		return yield* imageService.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * POST /images/:id/tags - Agregar tags a una imagen
 */
router.post('/:id/tags', effectHandler((req, res) =>
	Effect.gen(function* () {
		const tagService = yield* TagService;
		const tagIds = Array.isArray(req.body?.tagIds) ? req.body.tagIds : [];
		const result = yield* tagService.addToImage(req.params.id, tagIds);
		res.status(201);
		return { success: true, added: result.added };
	}).pipe(Effect.provide(TagServiceLive))
));

/**
 * POST /images/batch/favorite - Actualizar favorito en lote
 */
router.post('/batch/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const { ids, isFavorite } = req.body;

		if (!Array.isArray(ids) || typeof isFavorite !== 'boolean') {
			yield* Effect.fail(new Error('Invalid request: ids must be array and isFavorite must be boolean'));
		}

		validateBatchSize(ids);

		const count = yield* Effect.tryPromise({
			try: () => favoriteService.setMany(FavoriteEntityType.IMAGE, ids, isFavorite),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});
		return { success: true, count };
	})
));

/**
 * DELETE /images/:id - Eliminar imagen
 */
router.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;

		const force = req.query.force === 'true';

		yield* imageService.deleteById(req.params.id, { force });
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * DELETE /images/batch - Eliminar múltiples imágenes
 */
router.delete('/batch', effectHandler((req, res) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;

		const { ids } = req.body;
		const force = req.query.force === 'true';

		if (!Array.isArray(ids)) {
			yield* Effect.fail(new Error('Invalid request: ids must be array'));
		}

		validateBatchSize(ids);

		const count = yield* imageService.deleteManyByIds(ids, { force });
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(ImageServiceLive))
));

/**
 * POST /images/:id/thumbnail/generate - Generar thumbnail manualmente
 */
router.post('/:id/thumbnail/generate', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		yield* imageService.generateThumbnail(req.params.id);
		return { success: true, message: 'Thumbnail generated' };
	}).pipe(Effect.provide(ImageServiceLive))
));

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
		sendEffectHttpError(res, error);
	}
});

/**
 * GET /images/:id/content - Obtener imagen original (Alias de /original para compatibilidad)
 */
router.get('/:id/content', effectHandler(
	(req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const image = yield* imageService.getById(req.params.id);
			const buffer = yield* imageService.getOriginalImage(req.params.id);
			return { buffer, image };
		}).pipe(Effect.provide(ImageServiceLive)),
	{
		onSuccess: ({ buffer, image }, res) => {
			const mimeType = getMimeTypeFromPath(image?.path ?? 'default.jpg');
			res.set({
				'Content-Type': mimeType,
				'Content-Length': buffer.length.toString(),
				'Cache-Control': 'public, max-age=31536000',
			});
			res.send(buffer);
		},
	}
));

/**
 * GET /images/:id/original - Obtener imagen original
 */
router.get('/:id/original', effectHandler(
	(req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const image = yield* imageService.getById(req.params.id);
			const buffer = yield* imageService.getOriginalImage(req.params.id);
			return { buffer, path: image?.path };
		}).pipe(Effect.provide(ImageServiceLive)),
	{
		onSuccess: (result, res) => {
			const mimeType = getMimeTypeFromPath(result.path ?? 'default.jpg');
			res.set({
				'Content-Type': mimeType,
				'Content-Length': result.buffer.length.toString(),
				'Cache-Control': 'public, max-age=31536000',
				'X-Content-Type-Options': 'nosniff',
			});
			res.send(result.buffer);
		},
	}
));

/**
 * GET /images/:id - Obtener imagen por ID (sin stats)
 * IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar rutas específicas
 */
router.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const imageService = yield* ImageService;
		const image = yield* imageService.getById(req.params.id);
		return image;
	}).pipe(Effect.provide(ImageServiceLive))
));

export default router;
