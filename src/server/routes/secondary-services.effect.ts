/**
 * @file Express Routes para servicios secundarios usando Effect
 * @module server/routes/secondary-services.effect
 * @description Rutas REST para Groups, Wildcards, Notes, Properties, WorldItems
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
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
groupsEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res);
});
groupsEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res);
});
groupsEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res, { successStatus: 201 });
});
groupsEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res);
});
groupsEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res, { successStatus: 204 });
});
groupsEffectRouter.post('/:id/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		return yield* service.toggleFavorite(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res);
});
groupsEffectRouter.post('/:id/images/:imageId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* GroupService;
		yield* service.addImage(req.params.id, req.params.imageId);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(GroupServiceLive)), res, { successStatus: 201 });
});

// Wildcards
const wildcardsEffectRouter = express.Router();
wildcardsEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res);
});
wildcardsEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res);
});
wildcardsEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res, { successStatus: 201 });
});
wildcardsEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res);
});
wildcardsEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res, { successStatus: 204 });
});
wildcardsEffectRouter.post('/:id/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		return yield* service.toggleFavorite(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res);
});
wildcardsEffectRouter.post('/:id/images/:imageId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WildcardService;
		yield* service.addImage(req.params.id, req.params.imageId);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WildcardServiceLive)), res, { successStatus: 201 });
});

// Notes
const notesEffectRouter = express.Router();
notesEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res);
});
notesEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res);
});
notesEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res, { successStatus: 201 });
});
notesEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res);
});
notesEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res, { successStatus: 204 });
});
notesEffectRouter.get('/:id/images', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		return yield* service.getImages(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res);
});
notesEffectRouter.post('/:id/images/:imageId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* NoteService;
		yield* service.addImage(req.params.id, req.params.imageId);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(NoteServiceLive)), res, { successStatus: 201 });
});

// Properties
const propertiesEffectRouter = express.Router();
propertiesEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res);
});
propertiesEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res);
});
propertiesEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res, { successStatus: 201 });
});
propertiesEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res);
});
propertiesEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res, { successStatus: 204 });
});
propertiesEffectRouter.post('/:id/images/:imageId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* PropertyService;
		yield* service.addImage(req.params.id, req.params.imageId);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(PropertyServiceLive)), res, { successStatus: 201 });
});

// World Items
const worldItemsEffectRouter = express.Router();
worldItemsEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res);
});
worldItemsEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res);
});
worldItemsEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res, { successStatus: 201 });
});
worldItemsEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res);
});
worldItemsEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res, { successStatus: 204 });
});
worldItemsEffectRouter.post('/:id/images/:imageId', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* WorldItemService;
		yield* service.addImage(req.params.id, req.params.imageId);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(WorldItemServiceLive)), res, { successStatus: 201 });
});

export { groupsEffectRouter, wildcardsEffectRouter, notesEffectRouter, propertiesEffectRouter, worldItemsEffectRouter };
