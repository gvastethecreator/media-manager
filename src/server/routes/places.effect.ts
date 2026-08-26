/**
 * @file Express Routes para Places usando Effect
 * @module server/routes/places.effect
 * @description Rutas REST para Places implementadas con Effect-TS
 */

import { Schema, Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { PlaceCreateInput, PlaceUpdateInput } from '@/lib/effect/schemas/entities';
import { authorizeMediaAssetParam, filterAuthorizedMediaEntities } from '@/server/security/authorized-root-request';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { PlaceService, PlaceServiceLive } from '@/services/place/place.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
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
				limit: sanitizeLimit(limit),
				offset: sanitizeOffset(offset),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.PLACE,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => placeService.getById(entityId),
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

			const result = yield* placeService.getAll(options);
			return {
				data: result.places,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			return yield* placeService.getById(req.params.id);
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			const input = yield* Schema.decodeUnknown(PlaceCreateInput)(req.body);
			const place = yield* placeService.create(input);
			res.status(201);
			return place;
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			const input = yield* Schema.decodeUnknown(PlaceUpdateInput)(req.body);
			return yield* placeService.update(req.params.id, input);
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			yield* placeService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			const images = yield* placeService.getImages(req.params.id);
			const authorizedImages = yield* Effect.tryPromise({
				try: () => filterAuthorizedMediaEntities(req, images, 'image', ['read', 'index']),
				catch: (error) => error,
			});
			return authorizedImages.map((img: any) => ({
				id: img.id,
				name: img.name,
				thumbnailUrl: `/api/thumbnails/${img.id}`,
				url: `/api/images/${img.id}`,
				isVideo: false,
			}));
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

router.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({ assetType: 'image', idParam: 'imageId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			yield* placeService.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

export default router;
export { router as placesRouter, router as placesEffectRouter };
