/**
 * @file Rutas de API para favoritos - Versión Effect-TS
 * @module server/routes/favorites.effect
 */

import { Effect } from 'effect';
import { Router } from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType, isCanonicalFavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = Router();
const logger = serverLogger.withContext('FavoritesEffect');

const favoriteListQuerySchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType).optional(),
	limit: z.string().optional(),
	offset: z.string().optional(),
	search: z.string().optional(),
	sortBy: z.enum(['addedAt', 'entityType']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
});

const favoriteCheckQuerySchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

// GET /api/favorites - Listar favoritos con filtros
router.get(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parseResult = yield* Effect.tryPromise({
				try: () => favoriteListQuerySchema.parseAsync(req.query),
				catch: (error) => error,
			});

			if (parseResult instanceof z.ZodError) {
				res.status(400);
				return { error: 'Query inválida', details: parseResult.issues };
			}

				if (parseResult.entityType && !isCanonicalFavoriteEntityType(parseResult.entityType)) {
					res.status(400);
					return {
						error: `El tipo ${parseResult.entityType} está fuera del perímetro canónico de Favorite`,
					};
				}

			const filters = {
				entityType: parseResult.entityType,
				limit: sanitizeLimit(parseResult.limit ?? '50'),
				offset: sanitizeOffset(parseResult.offset ?? '0'),
				search: parseResult.search,
				sortBy: parseResult.sortBy,
				sortOrder: parseResult.sortOrder ?? 'desc',
			};

			const result = yield* Effect.tryPromise({
				try: () => favoriteService.list(filters),
				catch: (error) => {
					logger.error('Error al listar favoritos:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return {
				data: result.items,
				pagination: {
					total: result.total,
					limit: filters.limit,
					offset: filters.offset,
					hasNext: result.hasMore,
					hasPrev: filters.offset > 0,
				},
			};
		})
	)
);

// GET /api/favorites/counts - Obtener conteos por tipo
router.get(
	'/counts',
	effectHandler((_req, res) =>
		Effect.gen(function* () {
			const counts = yield* Effect.tryPromise({
				try: () => favoriteService.getCountsByType(),
				catch: (error) => {
					logger.error('Error al obtener conteos de favoritos:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return counts;
		})
	)
);

// GET /api/favorites/check - Verificar si una entidad es favorita
router.get(
	'/check',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parseResult = yield* Effect.tryPromise({
				try: () => favoriteCheckQuerySchema.parseAsync(req.query),
				catch: (error) => error,
			});

			if (parseResult instanceof z.ZodError) {
				res.status(400);
				return { error: 'Query inválida', details: parseResult.issues };
			}

				if (!isCanonicalFavoriteEntityType(parseResult.entityType)) {
					res.status(400);
					return {
						error: `El tipo ${parseResult.entityType} está fuera del perímetro canónico de Favorite`,
					};
				}

			const isFavorite = yield* Effect.tryPromise({
				try: () => favoriteService.isFavorite(parseResult.entityType, parseResult.entityId),
				catch: (error) => {
					logger.error('Error al verificar favorito:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return { isFavorite };
		})
	)
);

// GET /api/favorites/:id - Obtener favorito por ID
router.get(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const favorite = yield* Effect.tryPromise({
				try: () => favoriteService.getById(id),
				catch: (error) => {
					logger.error(`Error al obtener favorito ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!favorite) {
				res.status(404);
				return { error: 'Favorito no encontrado' };
			}

			return favorite;
		})
	)
);

// POST /api/favorites/toggle - Alternar estado de favorito
router.post(
	'/toggle',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parseResult = yield* Effect.tryPromise({
				try: () => toggleFavoriteSchema.parseAsync(req.body),
				catch: (error) => error,
			});

			if (parseResult instanceof z.ZodError) {
				res.status(400);
				return { error: 'Datos inválidos', details: parseResult.issues };
			}

			const { entityType, entityId } = parseResult;

				if (!isCanonicalFavoriteEntityType(entityType)) {
					res.status(400);
					return { error: `El tipo ${entityType} está fuera del perímetro canónico de Favorite` };
				}

			const result = yield* Effect.tryPromise({
				try: () => favoriteService.toggle(entityType, entityId),
				catch: (error) => {
					logger.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			return result;
		})
	)
);

// DELETE /api/favorites/:id - Eliminar favorito
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const deleted = yield* Effect.tryPromise({
				try: () => favoriteService.delete(id),
				catch: (error) => {
					logger.error(`Error al eliminar favorito ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!deleted) {
				res.status(404);
				return { error: 'Favorito no encontrado' };
			}

			res.status(204);
			return { success: true };
		})
	)
);

export default router;
