/**
 * @file Express Routes para Worldbuilding (Places, Concepts, Prompts) usando Effect
 * @module server/routes/worldbuilding.effect
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import {
	ConceptCreateInput,
	ConceptUpdateInput,
	PlaceCreateInput,
	PlaceUpdateInput,
	PromptCreateInput,
	PromptUpdateInput,
} from '@/lib/effect/schemas/entities';
import { ConceptService, ConceptServiceLive } from '@/services/concept/concept.service.effect';
import { PlaceService, PlaceServiceLive } from '@/services/place/place.service.effect';
import { PromptService, PromptServiceLive } from '@/services/prompt/prompt.service.effect';

// ============= Places Router =============

const placesRouter = express.Router();

placesRouter.get(
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
				limit: Number.parseInt(limit as string, 10),
				offset: Number.parseInt(offset as string, 10),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};
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

placesRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			return yield* placeService.getById(req.params.id);
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

placesRouter.post(
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

placesRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			const input = yield* Schema.decodeUnknown(PlaceUpdateInput)(req.body);
			return yield* placeService.update(req.params.id, input);
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

placesRouter.delete(
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

placesRouter.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			return yield* placeService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

placesRouter.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			const images = yield* placeService.getImages(req.params.id);
			return images.map((img: any) => ({
				id: img.id,
				name: img.name,
				thumbnailUrl: `/api/thumbnails/${img.id}`,
				url: `/api/images/${img.id}`,
				isVideo: false,
			}));
		}).pipe(Effect.provide(PlaceServiceLive))
	)
);

// ============= Concepts Router =============

const conceptsRouter = express.Router();

conceptsRouter.get(
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
				limit: Number.parseInt(limit as string, 10),
				offset: Number.parseInt(offset as string, 10),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};
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

conceptsRouter.get(
	'/:id/counts',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.getRelationCounts(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

conceptsRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.getById(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

conceptsRouter.post(
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

conceptsRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			const input = yield* Schema.decodeUnknown(ConceptUpdateInput)(req.body);
			return yield* conceptService.update(req.params.id, input);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

conceptsRouter.delete(
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

conceptsRouter.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(ConceptServiceLive))
	)
);

// ============= Prompts Router =============

const promptsRouter = express.Router();

promptsRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
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
				limit: Number.parseInt(limit as string, 10),
				offset: Number.parseInt(offset as string, 10),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};
			const result = yield* promptService.getAll(options);
			return {
				data: result.prompts,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

promptsRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			return yield* promptService.getById(req.params.id);
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

promptsRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptCreateInput)(req.body);
			const prompt = yield* promptService.create(input);
			res.status(201);
			return prompt;
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

promptsRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptUpdateInput)(req.body);
			return yield* promptService.update(req.params.id, input);
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

promptsRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

promptsRouter.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			return yield* promptService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

export { placesRouter, conceptsRouter, promptsRouter };
export default placesRouter;
