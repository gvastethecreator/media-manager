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
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = Router();
const logger = serverLogger.withContext('FavoritesEffect');

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

// GET /api/favorites - Listar favoritos con filtros
router.get(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { entityType, limit = '50', offset = '0', sortOrder = 'desc' } = req.query;

			const filters = {
				entityType: entityType as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				sortOrder: sortOrder as 'asc' | 'desc',
			};

			const result = yield* Effect.tryPromise({
				try: () => favoriteService.list(filters),
				catch: (error) => {
					logger.error('Error al listar favoritos:', error);
					return error;
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
					return error;
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
			const { entityType, entityId } = req.query;

			if (!entityType || typeof entityType !== 'string') {
				res.status(400);
				return { error: 'entityType es requerido' };
			}

			if (!entityId || typeof entityId !== 'string') {
				res.status(400);
				return { error: 'entityId es requerido' };
			}

			const isFavorite = yield* Effect.tryPromise({
				try: () => favoriteService.isFavorite(entityType as FavoriteEntityType, entityId),
				catch: (error) => {
					logger.error('Error al verificar favorito:', error);
					return error;
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
					return error;
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

			const result = yield* Effect.tryPromise({
				try: () => favoriteService.toggle(entityType, entityId),
				catch: (error) => {
					logger.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
					return error;
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
					return error;
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
