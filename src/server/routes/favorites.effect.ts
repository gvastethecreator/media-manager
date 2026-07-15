/**
 * @file Rutas de API para favoritos - Versión Effect-TS
 * @module server/routes/favorites.effect
 */

import { Effect } from 'effect';
import { type NextFunction, Router, type Response } from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	getAuthorizedRootRegistry,
	resolveAuthorizedFolderById,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { type MediaAssetType, resolveMediaAssetReference } from '@/server/security/media-asset-reference';
import { RootAuthorizationError, type RootPermission } from '@/server/security/authorized-roots';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType, isCanonicalFavoriteEntityType, type FavoriteWithStats } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = Router();
router.use(sanitizeJsonResponses);
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

const mediaFavoriteTypes = new Map<FavoriteEntityType, MediaAssetType>([
	[FavoriteEntityType.IMAGE, 'image'],
	[FavoriteEntityType.VIDEO, 'video'],
	[FavoriteEntityType.AUDIO, 'audio'],
	[FavoriteEntityType.DOCUMENT, 'document'],
	[FavoriteEntityType.JSON_FILE, 'json'],
	[FavoriteEntityType.FILE_3D, 'file3d'],
]);

interface FavoriteRequestContext {
	app: { locals: Record<string, unknown> };
}

type FavoriteRootPermission = Exclude<RootPermission, 'export'>;

async function assertAuthorizedFavoriteTarget(
	request: FavoriteRequestContext,
	target: { entityId: string; entityType: FavoriteEntityType },
	permissions: FavoriteRootPermission[]
): Promise<void> {
	const assetType = mediaFavoriteTypes.get(target.entityType);
	if (assetType) {
		for (const permission of permissions) {
			await resolveMediaAssetReference(
				getAuthorizedRootRegistry(request),
				{ assetId: target.entityId, assetType },
				permission
			);
		}
		return;
	}
	if (target.entityType === FavoriteEntityType.FOLDER) {
		for (const permission of permissions) await resolveAuthorizedFolderById(request, target.entityId, permission);
	}
}

function authorizeFavoriteTargetInput(
	readTarget: (request: { body?: Record<string, unknown>; query: Record<string, unknown> }) => {
		entityId: unknown;
		entityType: unknown;
	},
	permissions: FavoriteRootPermission[]
) {
	return async (
		request: {
			app: { locals: Record<string, unknown> };
			body?: Record<string, unknown>;
			query: Record<string, unknown>;
		},
		response: Response,
		next: NextFunction
	): Promise<void> => {
		const target = readTarget(request);
		if (typeof target.entityId !== 'string' || !isCanonicalFavoriteEntityType(target.entityType as string)) {
			next();
			return;
		}
		try {
			await assertAuthorizedFavoriteTarget(
				request,
				{ entityId: target.entityId, entityType: target.entityType as FavoriteEntityType },
				permissions
			);
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

function authorizeFavoriteById(permissions: FavoriteRootPermission[]) {
	return async (
		request: { app: { locals: Record<string, unknown> }; params: Record<string, string> },
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const favorite = await favoriteService.getById(request.params.id);
			if (!favorite) {
				response.status(404).json({ error: 'Favorito no encontrado' });
				return;
			}
			await assertAuthorizedFavoriteTarget(request, favorite, permissions);
			response.locals.authorizedFavorite = favorite;
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

const authorizeFavoriteQueryRead = authorizeFavoriteTargetInput(
	(request) => ({ entityId: request.query.entityId, entityType: request.query.entityType }),
	['read', 'index']
);
const authorizeFavoriteBodyWrite = authorizeFavoriteTargetInput(
	(request) => ({ entityId: request.body?.entityId, entityType: request.body?.entityType }),
	['read', 'index', 'write']
);

async function filterAuthorizedFavorites(
	request: FavoriteRequestContext,
	items: FavoriteWithStats[],
	permissions: FavoriteRootPermission[]
): Promise<FavoriteWithStats[]> {
	const decisions = await Promise.all(
		items.map(async (favorite) => {
			try {
				await assertAuthorizedFavoriteTarget(request, favorite, permissions);
				return true;
			} catch (error) {
				if (error instanceof RootAuthorizationError) return false;
				throw error;
			}
		})
	);
	return items.filter((_item, index) => decisions[index]);
}

async function listAuthorizedFavorites(
	request: FavoriteRequestContext,
	filters: {
		entityType?: FavoriteEntityType;
		limit: number;
		offset: number;
		search?: string;
		sortBy?: 'addedAt' | 'entityType';
		sortOrder: 'asc' | 'desc';
	},
	permissions: FavoriteRootPermission[] = ['read', 'index']
): Promise<{ hasMore: boolean; items: FavoriteWithStats[]; total: number }> {
	const authorized: FavoriteWithStats[] = [];
	let rawOffset = 0;
	const chunkSize = 250;
	while (true) {
		const page = await favoriteService.list({ ...filters, limit: chunkSize, offset: rawOffset });
		authorized.push(...(await filterAuthorizedFavorites(request, page.items, permissions)));
		rawOffset += page.items.length;
		if (!page.hasMore || page.items.length === 0) break;
	}
	return {
		hasMore: filters.offset + filters.limit < authorized.length,
		items: authorized.slice(filters.offset, filters.offset + filters.limit),
		total: authorized.length,
	};
}

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
				try: () => listAuthorizedFavorites(req, filters),
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
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const favorites = yield* Effect.tryPromise({
				try: () =>
					listAuthorizedFavorites(req, {
						limit: Number.MAX_SAFE_INTEGER,
						offset: 0,
						sortOrder: 'desc',
					}),
				catch: (error) => {
					logger.error('Error al obtener conteos de favoritos:', error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});
			const counts: Record<string, number> = {};
			for (const favorite of favorites.items) counts[favorite.entityType] = (counts[favorite.entityType] ?? 0) + 1;
			return counts;
		})
	)
);

// GET /api/favorites/check - Verificar si una entidad es favorita
router.get(
	'/check',
	authorizeFavoriteQueryRead,
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
	authorizeFavoriteById(['read', 'index']),
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
	authorizeFavoriteBodyWrite,
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
	authorizeFavoriteById(['read', 'index', 'write']),
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
