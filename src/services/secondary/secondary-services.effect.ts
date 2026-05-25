/**
 * @file Secondary Services implementados con Effect
 * @module services/secondary/secondary-services.effect
 * @description Servicios Group, Wildcard, Note, Property, WorldItem con Effect-TS
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { and, desc, eq, inArray } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import {
	groupImages,
	groups,
	imageNotes,
	imageProperties,
	images,
	imageWildcards,
	imageWorldItems,
	notes,
	properties,
	videoNotes,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	fromUnknownGroupError,
	fromUnknownNoteError,
	fromUnknownPropertyError,
	fromUnknownWildcardError,
	fromUnknownWorldItemError,
	type GroupError,
	GroupNotFound,
	type NoteError,
	NoteNotFound,
	type PropertyError,
	PropertyNotFound,
	type WildcardError,
	WildcardNotFound,
	type WorldItemError,
	WorldItemNotFound,
} from './secondary-services-errors.effect';

const logger = serverLogger.withContext('SecondaryServices.Effect');

type FavoriteCapableEntity = { id: string; isFavorite?: boolean | null };

function normalizeFavoriteEntity<TEntity extends FavoriteCapableEntity>(
	entity: TEntity,
	favoriteEntityIds: readonly string[]
): TEntity & { isFavorite: boolean } {
	return favoriteService.applyFavoriteProjection(entity, favoriteEntityIds);
}

function normalizeFavoriteEntities<TEntity extends FavoriteCapableEntity>(
	entities: TEntity[],
	favoriteEntityIds: readonly string[]
): Array<TEntity & { isFavorite: boolean }> {
	return favoriteService.applyFavoriteProjectionMany(entities, favoriteEntityIds);
}

// ============= Group Service =============

export class GroupService extends Context.Tag('GroupService')<GroupService, GroupServiceInterface>() {}

export interface GroupServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, GroupError>;
	readonly create: (input: any) => Effect.Effect<any, GroupError>;
	readonly delete: (id: string) => Effect.Effect<void, GroupError>;
	readonly getAll: (options?: any) => Effect.Effect<any, GroupError>;
	readonly getById: (id: string) => Effect.Effect<any, GroupError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, GroupError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, GroupError>;
}

const makeGroupService = (): GroupServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[], GroupError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.GROUP),
				catch: (error) => fromUnknownGroupError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () => {
					let query = db.select().from(groups).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(inArray(groups.id, favoriteEntityIds));
					}

					return query.orderBy(desc(groups.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownGroupError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () => db.select().from(groups).where(eq(groups.id, id)).limit(1),
				catch: (error) => fromUnknownGroupError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new GroupNotFound({ groupId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[], GroupError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.GROUP),
				catch: (error) => fromUnknownGroupError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;
			const readableId = generateReadableId('group', input.name || 'grupo', 1);
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.insert(groups)
						.values({ id: readableId, ...restInput, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownGroupError('create', error),
			});

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.update(groups)
						.set({ ...restInput, updatedAt: new Date() })
						.where(eq(groups.id, id))
						.returning(),
				catch: (error) => fromUnknownGroupError('update', error),
			});
			if (result.length === 0) return yield* Effect.fail(new GroupNotFound({ groupId: id }));
			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, GroupError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(groups).where(eq(groups.id, id));
			},
			catch: (error) => fromUnknownGroupError('delete', error),
		});

	const toggleFavorite = (id: string): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, GroupError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.GROUP, id),
				catch: (error) => fromUnknownGroupError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.GROUP, id, newFavoriteStatus),
				catch: (error) => fromUnknownGroupError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, GroupError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(groupImages).values({ A: id, B: imageId }),
				catch: (error) => fromUnknownGroupError('addImage', error),
			});
		});

	return { getAll, getById, create, update, delete: delete_, toggleFavorite, addImage };
};

export const GroupServiceLive = Layer.effect(GroupService, Effect.succeed(makeGroupService()));

// ============= Wildcard Service =============

export class WildcardService extends Context.Tag('WildcardService')<WildcardService, WildcardServiceInterface>() {}

export interface WildcardServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, WildcardError>;
	readonly create: (input: any) => Effect.Effect<any, WildcardError>;
	readonly delete: (id: string) => Effect.Effect<void, WildcardError>;
	readonly getAll: (options?: any) => Effect.Effect<any, WildcardError>;
	readonly getById: (id: string) => Effect.Effect<any, WildcardError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, WildcardError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, WildcardError>;
}

const makeWildcardService = (): WildcardServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[], WildcardError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.WILDCARD),
				catch: (error) => fromUnknownWildcardError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () => {
					let query = db.select().from(wildcards).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(inArray(wildcards.id, favoriteEntityIds));
					}

					return query.orderBy(desc(wildcards.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownWildcardError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () => db.select().from(wildcards).where(eq(wildcards.id, id)).limit(1),
				catch: (error) => fromUnknownWildcardError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WildcardNotFound({ wildcardId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[], WildcardError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.WILDCARD),
				catch: (error) => fromUnknownWildcardError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;
			const readableId = generateReadableId('wildcard', input.name || 'wildcard', 1);
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.insert(wildcards)
						.values({
							id: readableId,
							...restInput,
							isFavorite: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownWildcardError('create', error),
			});

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.update(wildcards)
						.set({
							...restInput,
							updatedAt: new Date(),
						})
						.where(eq(wildcards.id, id))
						.returning(),
				catch: (error) => fromUnknownWildcardError('update', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WildcardNotFound({ wildcardId: id }));
			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, WildcardError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(wildcards).where(eq(wildcards.id, id));
			},
			catch: (error) => fromUnknownWildcardError('delete', error),
		});

	const toggleFavorite = (id: string): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, WildcardError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.WILDCARD, id),
				catch: (error) => fromUnknownWildcardError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.WILDCARD, id, newFavoriteStatus),
				catch: (error) => fromUnknownWildcardError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, WildcardError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageWildcards).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownWildcardError('addImage', error),
			});
		});

	return { getAll, getById, create, update, delete: delete_, toggleFavorite, addImage };
};

export const WildcardServiceLive = Layer.effect(WildcardService, Effect.succeed(makeWildcardService()));

// ============= Note Service =============

export class NoteService extends Context.Tag('NoteService')<NoteService, NoteServiceInterface>() {}

export interface NoteServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, NoteError>;
	readonly addVideo: (id: string, videoId: string) => Effect.Effect<void, NoteError>;
	readonly create: (input: any) => Effect.Effect<any, NoteError>;
	readonly delete: (id: string) => Effect.Effect<void, NoteError>;
	readonly getAll: (options?: any) => Effect.Effect<any, NoteError>;
	readonly getById: (id: string) => Effect.Effect<any, NoteError>;
	readonly getImages: (id: string) => Effect.Effect<any[], NoteError>;
	readonly removeImage: (id: string, imageId: string) => Effect.Effect<void, NoteError>;
	readonly removeVideo: (id: string, videoId: string) => Effect.Effect<void, NoteError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, NoteError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, NoteError>;
}

const makeNoteService = (): NoteServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[], NoteError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.NOTE),
				catch: (error) => fromUnknownNoteError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () => {
					let query = db.select().from(notes).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(inArray(notes.id, favoriteEntityIds));
					}

					return query.orderBy(desc(notes.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownNoteError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () => db.select().from(notes).where(eq(notes.id, id)).limit(1),
				catch: (error) => fromUnknownNoteError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new NoteNotFound({ noteId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[], NoteError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.NOTE),
				catch: (error) => fromUnknownNoteError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;
			const readableId = generateReadableId('note', input.title || 'nota', 1);
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.insert(notes)
						.values({
							id: readableId,
							...restInput,
							isFavorite: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownNoteError('create', error),
			});

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.update(notes)
						.set({
							...restInput,
							updatedAt: new Date(),
						})
						.where(eq(notes.id, id))
						.returning(),
				catch: (error) => fromUnknownNoteError('update', error),
			});
			if (result.length === 0) return yield* Effect.fail(new NoteNotFound({ noteId: id }));
			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, NoteError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.NOTE, id),
				catch: (error) => fromUnknownNoteError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.NOTE, id, newFavoriteStatus),
				catch: (error) => fromUnknownNoteError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, NoteError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(notes).where(eq(notes.id, id));
			},
			catch: (error) => fromUnknownNoteError('delete', error),
		});

	const getImages = (id: string): Effect.Effect<any[], NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const result = yield* Effect.tryPromise<Array<{ image: typeof images.$inferSelect }>, NoteError>({
				try: () =>
					db
						.select({ image: images })
						.from(imageNotes)
						.innerJoin(images, eq(imageNotes.A, images.id))
						.where(eq(imageNotes.B, id)),
				catch: (error) => fromUnknownNoteError('getImages', error),
			});
			return result.map((r: any) => r.image);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageNotes).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownNoteError('addImage', error),
			});
		});

	const removeImage = (id: string, imageId: string): Effect.Effect<void, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.delete(imageNotes).where(and(eq(imageNotes.A, imageId), eq(imageNotes.B, id))),
				catch: (error) => fromUnknownNoteError('removeImage', error),
			});
		});

	const addVideo = (id: string, videoId: string): Effect.Effect<void, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(videoNotes).values({ A: videoId, B: id }),
				catch: (error) => fromUnknownNoteError('addVideo', error),
			});
		});

	const removeVideo = (id: string, videoId: string): Effect.Effect<void, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.delete(videoNotes).where(and(eq(videoNotes.A, videoId), eq(videoNotes.B, id))),
				catch: (error) => fromUnknownNoteError('removeVideo', error),
			});
		});

	return {
		getAll,
		getById,
		create,
		update,
		delete: delete_,
		getImages,
		addImage,
		removeImage,
		addVideo,
		removeVideo,
		toggleFavorite,
	};
};

export const NoteServiceLive = Layer.effect(NoteService, Effect.succeed(makeNoteService()));

// ============= Property Service =============

export class PropertyService extends Context.Tag('PropertyService')<PropertyService, PropertyServiceInterface>() {}

export interface PropertyServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, PropertyError>;
	readonly create: (input: any) => Effect.Effect<any, PropertyError>;
	readonly delete: (id: string) => Effect.Effect<void, PropertyError>;
	readonly getAll: (options?: any) => Effect.Effect<any, PropertyError>;
	readonly getById: (id: string) => Effect.Effect<any, PropertyError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, PropertyError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, PropertyError>;
}

const makePropertyService = (): PropertyServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[], PropertyError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PROPERTY),
				catch: (error) => fromUnknownPropertyError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () => {
					let query = db.select().from(properties).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(inArray(properties.id, favoriteEntityIds));
					}

					return query.orderBy(desc(properties.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownPropertyError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () => db.select().from(properties).where(eq(properties.id, id)).limit(1),
				catch: (error) => fromUnknownPropertyError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new PropertyNotFound({ propertyId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[], PropertyError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PROPERTY),
				catch: (error) => fromUnknownPropertyError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;
			const readableId = generateReadableId('property', input.name || 'propiedad', 1);
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.insert(properties)
						.values({
							id: readableId,
							...restInput,
							isFavorite: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownPropertyError('create', error),
			});

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.update(properties)
						.set({
							...restInput,
							updatedAt: new Date(),
						})
						.where(eq(properties.id, id))
						.returning(),
				catch: (error) => fromUnknownPropertyError('update', error),
			});
			if (result.length === 0) return yield* Effect.fail(new PropertyNotFound({ propertyId: id }));
			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, PropertyError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.PROPERTY, id),
				catch: (error) => fromUnknownPropertyError('toggleFavorite.isFavorite', error),
			});

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.PROPERTY, id, !currentFavoriteStatus),
				catch: (error) => fromUnknownPropertyError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, PropertyError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(properties).where(eq(properties.id, id));
			},
			catch: (error) => fromUnknownPropertyError('delete', error),
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, PropertyError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageProperties).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownPropertyError('addImage', error),
			});
		});

	return { getAll, getById, create, update, delete: delete_, addImage, toggleFavorite };
};

export const PropertyServiceLive = Layer.effect(PropertyService, Effect.succeed(makePropertyService()));

// ============= WorldItem Service =============

export class WorldItemService extends Context.Tag('WorldItemService')<WorldItemService, WorldItemServiceInterface>() {}

export interface WorldItemServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, WorldItemError>;
	readonly create: (input: any) => Effect.Effect<any, WorldItemError>;
	readonly delete: (id: string) => Effect.Effect<void, WorldItemError>;
	readonly getAll: (options?: any) => Effect.Effect<any, WorldItemError>;
	readonly getById: (id: string) => Effect.Effect<any, WorldItemError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, WorldItemError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, WorldItemError>;
}

const makeWorldItemService = (): WorldItemServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[], WorldItemError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => {
					let query = db.select().from(worldItems).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(inArray(worldItems.id, favoriteEntityIds));
					}

					return query.orderBy(desc(worldItems.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownWorldItemError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => db.select().from(worldItems).where(eq(worldItems.id, id)).limit(1),
				catch: (error) => fromUnknownWorldItemError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WorldItemNotFound({ worldItemId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[], WorldItemError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;
			const readableId = generateReadableId('world-item', input.name || 'item', 1);
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.insert(worldItems)
						.values({
							id: readableId,
							...restInput,
							isFavorite: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownWorldItemError('create', error),
			});

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.update(worldItems)
						.set({
							...restInput,
							updatedAt: new Date(),
						})
						.where(eq(worldItems.id, id))
						.returning(),
				catch: (error) => fromUnknownWorldItemError('update', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WorldItemNotFound({ worldItemId: id }));
			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, WorldItemError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, id),
				catch: (error) => fromUnknownWorldItemError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.WORLD_ITEM, id, newFavoriteStatus),
				catch: (error) => fromUnknownWorldItemError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, WorldItemError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(worldItems).where(eq(worldItems.id, id));
			},
			catch: (error) => fromUnknownWorldItemError('delete', error),
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageWorldItems).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownWorldItemError('addImage', error),
			});
		});

	return { getAll, getById, create, update, delete: delete_, addImage, toggleFavorite };
};

export const WorldItemServiceLive = Layer.effect(WorldItemService, Effect.succeed(makeWorldItemService()));
