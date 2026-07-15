/**
 * @file Express Routes para Concepts usando Effect
 * @module server/routes/concepts.effect
 * @description Rutas REST para Concepts implementadas con Effect-TS
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { ConceptCreateInput, ConceptUpdateInput } from '@/lib/effect/schemas/entities';
import { authorizeMediaAssetParam } from '@/server/security/authorized-root-request';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { ConceptService, ConceptServiceLive } from '@/services/concept/concept.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { markFavoriteToggleFacadeDeprecated } from '../utils/favorite-facade-deprecation';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
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
					entityType: FavoriteEntityType.CONCEPT,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => conceptService.getById(entityId),
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

			const result = yield* conceptService.getAll(options);
			return {
				data: result.concepts,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.get(
	'/:id/counts',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.getRelationCounts(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.getById(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			const input = yield* Schema.decodeUnknown(ConceptCreateInput)(req.body);
			const concept = yield* conceptService.create(input);
			res.status(201);
			return concept;
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			const input = yield* Schema.decodeUnknown(ConceptUpdateInput)(req.body);
			return yield* conceptService.update(req.params.id, input);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			yield* conceptService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.post(
	'/:id/favorite',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.CONCEPT);
			const conceptService = yield* ConceptService;
			return yield* conceptService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({ assetType: 'image', idParam: 'imageId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			yield* conceptService.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.delete(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({ assetType: 'image', idParam: 'imageId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			yield* conceptService.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.post(
	'/:id/videos/:videoId',
	authorizeMediaAssetParam({ assetType: 'video', idParam: 'videoId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			yield* conceptService.addVideo(req.params.id, req.params.videoId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

router.delete(
	'/:id/videos/:videoId',
	authorizeMediaAssetParam({ assetType: 'video', idParam: 'videoId', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			yield* conceptService.removeVideo(req.params.id, req.params.videoId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

export default router;
export { router as conceptsRouter, router as conceptsEffectRouter };
