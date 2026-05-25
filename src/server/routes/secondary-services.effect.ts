/**
 * @file Express Routes para servicios secundarios usando Effect
 * @module server/routes/secondary-services.effect
 * @description Rutas REST para Groups, Wildcards, Notes, Properties, WorldItems
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import {
	GroupService,
	GroupServiceLive,
	NoteService,
	NoteServiceLive,
	PropertyService,
	PropertyServiceLive,
	WildcardService,
	WildcardServiceLive,
	WorldItemService,
	WorldItemServiceLive,
} from '@/services/secondary/secondary-services.effect';

// Groups
const groupsEffectRouter = express.Router();
groupsEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		return yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			offset: Number(req.query.offset) || 0,
			onlyFavorites,
		});
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(GroupServiceLive))
));
groupsEffectRouter.post('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* GroupService;
		yield* service.addImage(req.params.id, req.params.imageId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(GroupServiceLive))
));

// Wildcards
const wildcardsEffectRouter = express.Router();
wildcardsEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		return yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			offset: Number(req.query.offset) || 0,
			onlyFavorites,
		});
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(WildcardServiceLive))
));
wildcardsEffectRouter.post('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WildcardService;
		yield* service.addImage(req.params.id, req.params.imageId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(WildcardServiceLive))
));

// Notes
const notesEffectRouter = express.Router();
notesEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		return yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			offset: Number(req.query.offset) || 0,
			onlyFavorites,
		});
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.get('/:id/images', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.getImages(req.params.id);
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.post('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.addImage(req.params.id, req.params.imageId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.delete('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.removeImage(req.params.id, req.params.imageId);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.post('/:id/videos/:videoId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.addVideo(req.params.id, req.params.videoId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(NoteServiceLive))
));
notesEffectRouter.delete('/:id/videos/:videoId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.removeVideo(req.params.id, req.params.videoId);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(NoteServiceLive))
));

// Properties
const propertiesEffectRouter = express.Router();
propertiesEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		return yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			offset: Number(req.query.offset) || 0,
			onlyFavorites,
		});
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(PropertyServiceLive))
));
propertiesEffectRouter.post('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* PropertyService;
		yield* service.addImage(req.params.id, req.params.imageId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(PropertyServiceLive))
));

// World Items
const worldItemsEffectRouter = express.Router();
worldItemsEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		return yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			offset: Number(req.query.offset) || 0,
			onlyFavorites,
		});
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.post('/:id/favorite', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(WorldItemServiceLive))
));
worldItemsEffectRouter.post('/:id/images/:imageId', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* WorldItemService;
		yield* service.addImage(req.params.id, req.params.imageId);
		res.status(201);
		return { success: true };
	}).pipe(Effect.provide(WorldItemServiceLive))
));

export { groupsEffectRouter, wildcardsEffectRouter, notesEffectRouter, propertiesEffectRouter, worldItemsEffectRouter };
