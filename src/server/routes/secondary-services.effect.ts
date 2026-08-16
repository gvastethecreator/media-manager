/**
 * @file Express Routes para servicios secundarios usando Effect
 * @module server/routes/secondary-services.effect
 * @description Rutas REST para Groups, Wildcards, Notes, Properties, WorldItems
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { Effect } from 'effect';
import express, { type NextFunction, type Response } from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import {
	authorizeMediaAssetParam,
	filterAuthorizedMediaEntities,
	getAuthorizedRootRegistry,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { RootAuthorizationError } from '@/server/security/authorized-roots';
import { preserveJsonResponseTextFields } from '@/server/security/sanitize-public-payload';
import {
	assertTaxonomyEntityRootPermissions,
	type TaxonomyRootPermission,
} from '@/server/security/taxonomy-root-authorization';
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
import { ArtifactConflictError, type ArtifactFamily } from '@/services/taxonomy/file-backed/file-backed.service';
import {
	assertInlineTaxonomyMutationAllowed,
	filterAuthorizedTaxonomyEntities,
} from '@/services/taxonomy/file-backed/taxonomy-artifact.service';
import { CreateGroupSchema, UpdateGroupSchema } from '@/types/entities/group/schema';
import { CreatePropertySchema, UpdatePropertySchema } from '@/types/entities/property/schema';
import { CreateWildcardSchema, UpdateWildcardSchema } from '@/types/entities/wildcard/schema';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

class RouteValidationError extends Error {
	readonly code = 'ROUTE_VALIDATION_ERROR';
	readonly status = 400;

	constructor(label: string) {
		super(`Contrato inválido (${label}).`);
		this.name = 'RouteValidationError';
	}
}

const parseBody = <T>(label: string, parser: () => T): Effect.Effect<T, RouteValidationError> =>
	Effect.try({
		try: parser,
		catch: () => new RouteValidationError(label),
	});

const noteUpdateBodySchema = updateNoteSchema.omit({ id: true });

function requireInlineTaxonomy(entityType: ArtifactFamily) {
	return async (req: { params: Record<string, string> }, res: Response, next: NextFunction) => {
		try {
			await assertInlineTaxonomyMutationAllowed(entityType, req.params.id);
			next();
		} catch (error) {
			if (error instanceof ArtifactConflictError) {
				res.status(409).json({ code: 'ARTIFACT_FILE_BACKED', message: error.message, retryable: false });
				return;
			}
			next(error);
		}
	};
}

const requireInlineWildcard = requireInlineTaxonomy('wildcard');
const requireInlineNote = requireInlineTaxonomy('note');

function requireAuthorizedTaxonomy(entityType: ArtifactFamily, permissions: readonly TaxonomyRootPermission[]) {
	return async (
		req: { app: { locals: Record<string, unknown> }; params: Record<string, string> },
		res: Response,
		next: NextFunction
	) => {
		try {
			await assertTaxonomyEntityRootPermissions(getAuthorizedRootRegistry(req), entityType, req.params.id, permissions);
			next();
		} catch (error) {
			if (error instanceof RootAuthorizationError && error.status === 404) {
				res.status(404).json({ code: 'TAXONOMY_ENTITY_NOT_FOUND', message: 'Entidad taxonomy no encontrada.' });
				return;
			}
			if (!sendRootAuthorizationError(res, error)) next(error);
		}
	};
}

const requireAuthorizedWildcardRead = requireAuthorizedTaxonomy('wildcard', ['read', 'index']);
const requireAuthorizedWildcardWrite = requireAuthorizedTaxonomy('wildcard', ['read', 'index', 'write']);
const requireAuthorizedWildcardDelete = requireAuthorizedTaxonomy('wildcard', ['read', 'index', 'write', 'delete']);
const requireAuthorizedNoteRead = requireAuthorizedTaxonomy('note', ['read', 'index']);
const requireAuthorizedNoteWrite = requireAuthorizedTaxonomy('note', ['read', 'index', 'write']);
const requireAuthorizedNoteDelete = requireAuthorizedTaxonomy('note', ['read', 'index', 'write', 'delete']);

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
wildcardsEffectRouter.use(
	preserveJsonResponseTextFields('category', 'children', 'color', 'description', 'emoji', 'name')
);
wildcardsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* WildcardService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			const limit = sanitizeLimit(req.query.limit ?? '50');
			const offset = sanitizeOffset(req.query.offset ?? '0');
			const authorized: Array<{ id: string }> = [];
			let rawOffset = 0;
			const chunkSize = 250;
			while (true) {
				const result = yield* service.getAll({ limit: chunkSize, offset: rawOffset, onlyFavorites });
				authorized.push(
					...(yield* Effect.tryPromise({
						try: () => filterAuthorizedTaxonomyEntities(getAuthorizedRootRegistry(req), 'wildcard', result.data),
						catch: (error) => error,
					}))
				);
				rawOffset += result.data.length;
				if (result.data.length < chunkSize) break;
			}
			return { data: authorized.slice(offset, offset + limit), total: authorized.length };
		}).pipe(Effect.provide(WildcardServiceLive))
	)
);
wildcardsEffectRouter.get(
	'/:id',
	requireAuthorizedWildcardRead,
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
	requireAuthorizedWildcardWrite,
	requireInlineWildcard,
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
	requireAuthorizedWildcardDelete,
	requireInlineWildcard,
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
	requireAuthorizedWildcardWrite,
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index', 'write'],
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
notesEffectRouter.use(preserveJsonResponseTextFields('category', 'color', 'content', 'emoji', 'summary', 'title'));
notesEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* NoteService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			const limit = sanitizeLimit(req.query.limit ?? '50');
			const offset = sanitizeOffset(req.query.offset ?? '0');
			const authorized: Array<{ id: string }> = [];
			let rawOffset = 0;
			const chunkSize = 250;
			while (true) {
				const result = yield* service.getAll({ limit: chunkSize, offset: rawOffset, onlyFavorites });
				authorized.push(
					...(yield* Effect.tryPromise({
						try: () => filterAuthorizedTaxonomyEntities(getAuthorizedRootRegistry(req), 'note', result.data),
						catch: (error) => error,
					}))
				);
				rawOffset += result.data.length;
				if (result.data.length < chunkSize) break;
			}
			return { data: authorized.slice(offset, offset + limit), total: authorized.length };
		}).pipe(Effect.provide(NoteServiceLive))
	)
);
notesEffectRouter.get(
	'/:id',
	requireAuthorizedNoteRead,
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
	requireAuthorizedNoteWrite,
	requireInlineNote,
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
	requireAuthorizedNoteDelete,
	requireInlineNote,
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
	requireAuthorizedNoteRead,
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
	requireAuthorizedNoteWrite,
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index', 'write'],
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
	requireAuthorizedNoteDelete,
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index', 'write', 'delete'],
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
	requireAuthorizedNoteWrite,
	authorizeMediaAssetParam({
		assetType: 'video',
		idParam: 'videoId',
		permissions: ['read', 'index', 'write'],
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
	requireAuthorizedNoteDelete,
	authorizeMediaAssetParam({
		assetType: 'video',
		idParam: 'videoId',
		permissions: ['read', 'index', 'write', 'delete'],
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
