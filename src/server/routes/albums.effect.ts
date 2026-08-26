/**
 * @file Express Routes para Albums usando Effect
 * @module server/routes/albums.effect
 * @description Rutas REST para Albums implementadas con Effect-TS
 * @created 2025-10-11 - Fase 7.1 AlbumService Effect Implementation
 */

import { Schema, Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { AlbumCreateInput, AlbumUpdateInput } from '@/lib/effect/schemas/entities';
import {
	authorizeMediaAssetBodyIds,
	authorizeMediaAssetParam,
	filterAuthorizedMediaEntities,
} from '@/server/security/authorized-root-request';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { AlbumService, AlbumServiceLive } from '@/services/album/album.service.effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

/**
 * GET /albums - Listar álbumes con filtros
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;

			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'createdAt',
				sortOrder = 'desc',
				category,
				onlyFavorites,
			} = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.ALBUM,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => albumService.getByIdWithStats(entityId),
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

			const result = yield* albumService.getAll(options);

			return {
				data: result.albums,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * GET /albums/:id - Obtener álbum por ID
 */
router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			return yield* albumService.getByIdWithStats(req.params.id);
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * POST /albums - Crear nuevo álbum
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			const input = yield* Schema.decodeUnknown(AlbumCreateInput)(req.body);
			const album = yield* albumService.create(input);
			res.status(201);
			return album;
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * PUT /albums/:id - Actualizar álbum
 */
router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			const input = yield* Schema.decodeUnknown(AlbumUpdateInput)(req.body);
			return yield* albumService.update(req.params.id, input);
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * DELETE /albums/:id - Eliminar álbum
 */
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			yield* albumService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * GET /albums/:id/images - Obtener imágenes del álbum
 */
router.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			const limit = sanitizeLimit(String(req.query.limit ?? '50'));
			const offset = sanitizeOffset(String(req.query.offset ?? '0'));
			const authorizedImages: any[] = [];
			const rawChunkSize = 100;
			let rawOffset = 0;

			while (authorizedImages.length < offset + limit) {
				const rawImages = yield* albumService.getImages(req.params.id, {
					limit: rawChunkSize,
					offset: rawOffset,
				});
				const authorizedChunk = yield* Effect.tryPromise({
					try: () => filterAuthorizedMediaEntities(req, rawImages, 'image', ['read', 'index']),
					catch: (error) => error,
				});
				authorizedImages.push(...authorizedChunk);
				rawOffset += rawImages.length;
				if (rawImages.length < rawChunkSize) break;
			}

			return authorizedImages.slice(offset, offset + limit);
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * POST /albums/:id/images - Agregar imágenes al álbum
 */
router.post(
	'/:id/images',
	authorizeMediaAssetBodyIds({ assetType: 'image', bodyField: 'imageIds', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			const { imageIds } = req.body;

			if (!Array.isArray(imageIds)) {
				return yield* Effect.fail(new Error('imageIds must be an array'));
			}

			const result = yield* albumService.addImages(req.params.id, imageIds);
			res.status(201);
			return result;
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * DELETE /albums/:id/images/:imageId - Remover imagen del álbum
 */
router.delete(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({ assetType: 'image', idParam: 'imageId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			yield* albumService.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

/**
 * GET /albums/:id/stats - Obtener estadísticas del álbum
 */
router.get(
	'/:id/stats',
	effectHandler((req) =>
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			return yield* albumService.getRelationsCounts(req.params.id);
		}).pipe(Effect.provide(AlbumServiceLive))
	)
);

export default router;
