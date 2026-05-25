/**
 * @file Express Routes para Characters usando Effect
 * @module server/routes/characters.effect
 * @description Rutas REST para Characters implementadas con Effect-TS
 * @created 2025-10-11 - Fase 8.1 CharacterService Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { CharacterCreateInput, CharacterUpdateInput } from '@/lib/effect/schemas/entities';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { CharacterService, CharacterServiceLive } from '@/services/character/character.service.effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

/**
 * GET /characters - Listar characters con filtros
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;

			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'createdAt',
				sortOrder = 'desc',
				category,
				parentId,
				onlyFavorites,
			} = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				parentId: parentId === 'null' ? null : (parentId as string | null | undefined),
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.CHARACTER,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => characterService.getById(entityId),
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

			const result = yield* characterService.getAll(options);

			return {
				data: result.characters,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * GET /characters/:id - Obtener character por ID
 */
router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			return yield* characterService.getById(req.params.id);
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * POST /characters - Crear nuevo character
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			const input = yield* Schema.decodeUnknown(CharacterCreateInput)(req.body);
			const character = yield* characterService.create(input);
			res.status(201);
			return character;
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * PUT /characters/:id - Actualizar character
 */
router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			const input = yield* Schema.decodeUnknown(CharacterUpdateInput)(req.body);
			return yield* characterService.update(req.params.id, input);
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * DELETE /characters/:id - Eliminar character
 */
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			yield* characterService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * POST /characters/bulk-delete - Eliminar múltiples characters
 */
router.post(
	'/bulk-delete',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			const { ids } = req.body;

			if (!Array.isArray(ids)) {
				return yield* Effect.fail(new Error('ids must be an array'));
			}

			return yield* characterService.bulkDelete(ids);
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * POST /characters/:id/favorite - Toggle favorite status
 */
router.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			return yield* characterService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * GET /characters/:id/images - Obtener imágenes del character
 */
router.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			return yield* characterService.getImages(req.params.id);
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * POST /characters/:id/images/:imageId - Agregar imagen a character
 */
router.post(
	'/:id/images/:imageId',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			yield* characterService.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * DELETE /characters/:id/images/:imageId - Remover imagen de character
 */
router.delete(
	'/:id/images/:imageId',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			yield* characterService.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * POST /characters/:id/notes - Agregar nota a character
 */
router.post(
	'/:id/notes/:noteId',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			yield* characterService.addNote(req.params.id, req.params.noteId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

/**
 * DELETE /characters/:id/notes/:noteId - Remover nota de character
 */
router.delete(
	'/:id/notes/:noteId',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			yield* characterService.removeNote(req.params.id, req.params.noteId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(CharacterServiceLive))
	)
);

export default router;
