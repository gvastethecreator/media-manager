/**
 * @file Express Routes para Tags usando Effect
 * @module server/routes/tags.effect
 * @description Rutas REST para Tags implementadas con Effect-TS
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { filterAuthorizedMediaEntities } from '@/server/security/authorized-root-request';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { TagCreate, TagUpdate } from '@/services/tag/tag-schemas';
import { markFavoriteToggleFacadeDeprecated } from '../utils/favorite-facade-deprecation';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

/**
 * GET /tags - Listar tags con filtros
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;

			const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc', onlyFavorites } = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt' | 'popularity') || 'name',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'asc',
				onlyFavorites: onlyFavorites === 'true',
			};

			const result = yield* tagService.getAll(options);

			return {
				data: result.tags,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.hasMore,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * POST /tags - Crear nuevo tag
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;

			// Validar input
			const input = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(TagCreate)(req.body),
				catch: (error) => new Error(`Validation failed: ${String(error)}`),
			});

			const tag = yield* tagService.create(input);
			res.status(201);
			return tag;
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * PUT /tags/:id - Actualizar tag
 */
router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;

			// Validar input y agregar ID desde params
			const input = yield* Effect.try({
				try: () =>
					Schema.decodeUnknownSync(TagUpdate)({
						...req.body,
						id: req.params.id,
					}),
				catch: (error) => new Error(`Validation failed: ${String(error)}`),
			});

			const tag = yield* tagService.update(input);
			return tag;
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * DELETE /tags/:id - Eliminar tag
 */
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;
			yield* tagService.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * POST /tags/:id/favorite - Toggle favorite status
 */
router.post(
	'/:id/favorite',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.TAG);
			const tagService = yield* TagService;
			const tag = yield* tagService.toggleFavorite(req.params.id);
			return tag;
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * GET /tags/:id/images - Obtener imágenes asociadas a un tag
 */
router.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;
			const images = yield* tagService.getImages(req.params.id);
			return yield* Effect.tryPromise({
				try: () => filterAuthorizedMediaEntities(req, images, 'image', ['read', 'index']),
				catch: (error) => error,
			});
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * GET /tags/:id/thumbnails - Obtener thumbnails de imágenes asociadas a un tag
 */
router.get(
	'/:id/thumbnails',
	effectHandler((req) =>
		Effect.gen(function* () {
			const limit = sanitizeLimit(String(req.query.limit ?? '6'));
			const tagService = yield* TagService;
			const images = yield* tagService.getImages(req.params.id);
			const authorizedImages = yield* Effect.tryPromise({
				try: () => filterAuthorizedMediaEntities(req, images, 'image', ['read', 'index']),
				catch: (error) => error,
			});
			return authorizedImages
				.filter((image) => image.thumbnailPath !== null)
				.slice(0, limit)
				.map((image) => ({
					id: image.id,
					name: image.name,
					thumbnailUrl: `/api/images/${image.id}/thumbnail`,
				}));
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * GET /tags/:id - Obtener tag por ID
 * IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar rutas específicas como /:id/favorite
 */
router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;
			const tag = yield* tagService.getByIdWithStats(req.params.id);
			return tag;
		}).pipe(Effect.provide(TagServiceLive))
	)
);

export default router;
