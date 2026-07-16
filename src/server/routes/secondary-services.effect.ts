/**
 * @file Express Routes para servicios secundarios usando Effect
 * @module server/routes/secondary-services.effect
 * @description Rutas REST para Groups, Wildcards, Notes, Properties, WorldItems
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { authorizeMediaAssetParam, filterAuthorizedMediaEntities } from '@/server/security/authorized-root-request';
import { createNoteSchema, updateNoteSchema } from '@/lib/utils/note/validators';
import { createWorldItemSchema, updateWorldItemSchema } from '@/lib/utils/world-item/validators';
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
import { CreateGroupSchema, UpdateGroupSchema } from '@/types/entities/group/schema';
import { CreatePropertySchema, UpdatePropertySchema } from '@/types/entities/property/schema';
import { CreateWildcardSchema, UpdateWildcardSchema } from '@/types/entities/wildcard/schema';

const parseBody = <T>(label: string, parser: () => T): Effect.Effect<T, Error> =>
	Effect.try({
		try: parser,
		catch: (error) => new Error(`Validation failed (${label}): ${String(error)}`),
	});

const noteUpdateBodySchema = updateNoteSchema.omit({ id: true });

// Groups
const groupsEffectRouter = express.Router();
groupsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			return yield* service.getAll({
				limit: Number(req.query.limit) || 50,
				offset: Number(req.query.offset) || 0,
				onlyFavorites,
			});
		}).pipe(Effect.provide(GroupServiceLive))
	)
);
groupsEffectRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(GroupServiceLive))
	)
);
groupsEffectRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			const input = yield* parseBody('GroupCreate', () => CreateGroupSchema.parse(req.body));
			const result = yield* service.create(input);
			res.status(201);
			return result;
		}).pipe(Effect.provide(GroupServiceLive))
	)
);
groupsEffectRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			const input = yield* parseBody('GroupUpdate', () => UpdateGroupSchema.parse(req.body));
			return yield* service.update(req.params.id, input);
		}).pipe(Effect.provide(GroupServiceLive))
	)
);
groupsEffectRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(GroupServiceLive))
	)
);
groupsEffectRouter.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* GroupService;
			yield* service.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(GroupServiceLive))
	)
);

// Wildcards
const wildcardsEffectRouter = express.Router();
wildcardsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			return yield* service.getAll({
				limit: Number(req.query.limit) || 50,
				offset: Number(req.query.offset) || 0,
				onlyFavorites,
			});
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			const input = yield* parseBody('WildcardCreate', () => CreateWildcardSchema.parse(req.body));
			const result = yield* service.create(input);
			res.status(201);
			return result;
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			const input = yield* parseBody('WildcardUpdate', () => UpdateWildcardSchema.parse(req.body));
			return yield* service.update(req.params.id, input);
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			yield* service.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);

// Notes
const notesEffectRouter = express.Router();
notesEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			return yield* service.getAll({
				limit: Number(req.query.limit) || 50,
				offset: Number(req.query.offset) || 0,
				onlyFavorites,
			});
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			const input = yield* parseBody('NoteCreate', () => createNoteSchema.parse(req.body));
			const result = yield* service.create(input);
			res.status(201);
			return result;
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			const input = yield* parseBody('NoteUpdate', () => noteUpdateBodySchema.parse(req.body));
			return yield* service.update(req.params.id, input);
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.get(
	'/:id/images',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			const images = yield* service.getImages(req.params.id);
			return yield* Effect.tryPromise({
				try: () => filterAuthorizedMediaEntities(req, images, 'image', ['read', 'index']),
				catch: (error) => error,
			});
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			yield* service.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.delete(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			yield* service.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.post(
	'/:id/videos/:videoId',
	authorizeMediaAssetParam({
		assetType: 'video',
		idParam: 'videoId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			yield* service.addVideo(req.params.id, req.params.videoId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.delete(
	'/:id/videos/:videoId',
	authorizeMediaAssetParam({
		assetType: 'video',
		idParam: 'videoId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			yield* service.removeVideo(req.params.id, req.params.videoId);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(NoteServiceLive))
	)
);

// Properties
const propertiesEffectRouter = express.Router();
propertiesEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			return yield* service.getAll({
				limit: Number(req.query.limit) || 50,
				offset: Number(req.query.offset) || 0,
				onlyFavorites,
			});
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);
propertiesEffectRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);
propertiesEffectRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			const input = yield* parseBody('PropertyCreate', () => CreatePropertySchema.parse(req.body));
			const result = yield* service.create(input);
			res.status(201);
			return result;
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);
propertiesEffectRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			const input = yield* parseBody('PropertyUpdate', () => UpdatePropertySchema.parse(req.body));
			return yield* service.update(req.params.id, input);
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);
propertiesEffectRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);
propertiesEffectRouter.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* PropertyService;
			yield* service.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(PropertyServiceLive))
	)
);

// World Items
const worldItemsEffectRouter = express.Router();
worldItemsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			return yield* service.getAll({
				limit: Number(req.query.limit) || 50,
				offset: Number(req.query.offset) || 0,
				onlyFavorites,
			});
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);
worldItemsEffectRouter.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);
worldItemsEffectRouter.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			const input = yield* parseBody('WorldItemCreate', () => createWorldItemSchema.parse(req.body));
			const result = yield* service.create(input);
			res.status(201);
			return result;
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);
worldItemsEffectRouter.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			const input = yield* parseBody('WorldItemUpdate', () => updateWorldItemSchema.parse(req.body));
			return yield* service.update(req.params.id, input);
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);
worldItemsEffectRouter.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);
worldItemsEffectRouter.post(
	'/:id/images/:imageId',
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			yield* service.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(WorldItemServiceLive))
	)
);

export { groupsEffectRouter, wildcardsEffectRouter, notesEffectRouter, propertiesEffectRouter, worldItemsEffectRouter };
