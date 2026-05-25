/**
 * @file Express Routes para Collections usando Effect
 * @module server/routes/collections.effect
 * @description Rutas REST para Collections implementadas con Effect-TS
 * @created 2025-10-11 - Fase 7.2 CollectionService Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { CollectionCreateInput, CollectionUpdateInput } from '@/lib/effect/schemas/entities';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { CollectionService, CollectionServiceLive } from '@/services/collection/collection.service.effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

/**
 * GET /collections - Listar colecciones con filtros
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;

			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'createdAt',
				sortOrder = 'desc',
				parentId,
				onlyFavorites,
			} = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				parentId: parentId === 'null' ? null : (parentId as string | null | undefined),
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.COLLECTION,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => collectionService.getById(entityId),
				});

				return {
					data: favoriteResult.data,
					pagination: {
						total: favoriteResult.total,
						limit: options.limit,
						offset: options.offset,
						hasNext: options.limit + options.offset < favoriteResult.total,
						hasPrev: options.offset > 0,
					},
				};
			}

			const result = yield* collectionService.getAll(options);

			return {
				data: result.collections,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * GET /collections/:id - Obtener colección por ID
 */
router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			return yield* collectionService.getById(req.params.id);
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * POST /collections - Crear nueva colección
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			const input = yield* Schema.decodeUnknown(CollectionCreateInput)(req.body);
			const collection = yield* collectionService.create(input);
			res.status(201);
			return collection;
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * PUT /collections/:id - Actualizar colección
 */
router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			const input = yield* Schema.decodeUnknown(CollectionUpdateInput)(req.body);
			return yield* collectionService.update(req.params.id, input);
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * DELETE /collections/:id - Eliminar colección
 */
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			yield* collectionService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * POST /collections/:id/favorite - Toggle favorite status
 */
router.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			return yield* collectionService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * GET /collections/:id/images - Obtener imágenes de la colección
 */
router.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			const limit = Number(req.query.limit) || 50;
			const offset = Number(req.query.offset) || 0;
			return yield* collectionService.getImages(req.params.id, { limit, offset });
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * POST /collections/:id/images - Agregar imágenes a la colección
 */
router.post(
	'/:id/images',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			const { imageIds } = req.body;
			if (!Array.isArray(imageIds)) {
				return yield* Effect.fail(new Error('imageIds must be an array'));
			}
			const result = yield* collectionService.addImages(req.params.id, imageIds);
			res.status(201);
			return result;
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

/**
 * DELETE /collections/:id/images/:imageId - Remover imagen de la colección
 */
router.delete(
	'/:id/images/:imageId',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const collectionService = yield* CollectionService;
			yield* collectionService.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(CollectionServiceLive))
	)
);

export default router;
