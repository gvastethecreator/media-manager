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
	favoriteEntityIds: string[] | null,
	fallbackIfMissing = false
): TEntity & { isFavorite: boolean } {
	const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;

	return {
		...entity,
		isFavorite:
			favoriteIdSet !== null
				? favoriteIdSet.has(entity.id)
				: typeof entity.isFavorite === 'boolean'
					? entity.isFavorite
					: fallbackIfMissing,
	};
}

function normalizeFavoriteEntities<TEntity extends FavoriteCapableEntity>(
	entities: TEntity[],
	favoriteEntityIds: string[] | null,
	fallbackIfMissing = false
): Array<TEntity & { isFavorite: boolean }> {
	const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;

	return entities.map((entity) => ({
		...entity,
		isFavorite:
			favoriteIdSet !== null
				? favoriteIdSet.has(entity.id)
				: typeof entity.isFavorite === 'boolean'
					? entity.isFavorite
					: fallbackIfMissing,
	}));
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
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, GroupError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.GROUP),
				catch: (error) => fromUnknownGroupError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && (!favoriteEntityIds || favoriteEntityIds.length === 0)) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () => {
					let query = db.select().from(groups).$dynamic();

					if (options.onlyFavorites && favoriteEntityIds) {
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, GroupError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.GROUP),
				catch: (error) => fromUnknownGroupError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const readableId = generateReadableId('group', input.name || 'grupo', 1);
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, GroupError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.GROUP)) !== null,
						catch: (error) => fromUnknownGroupError('create.favoriteScope', error),
					})
					: false;
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.insert(groups)
						.values({ id: readableId, ...restInput, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownGroupError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.GROUP, readableId, true);
						} catch (error) {
							await db.delete(groups).where(eq(groups.id, readableId));
							throw error;
						}
					},
					catch: (error) => fromUnknownGroupError('create.favoriteBridge', error),
				});
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, GroupError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.GROUP)) !== null,
						catch: (error) => fromUnknownGroupError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.GROUP, id, requestedIsFavorite),
					catch: (error) => fromUnknownGroupError('update.favoriteBridge', error),
				});
			}

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
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, GroupError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.GROUP),
				catch: (error) => fromUnknownGroupError('toggleFavorite.scope', error),
			});

			if (favoriteEntityIds === null) {
				return yield* Effect.fail(
					fromUnknownGroupError('toggleFavorite.noActiveProfile', new Error('No hay un perfil activo para favoritos de grupos'))
				);
			}

			const currentFavoriteStatus = favoriteEntityIds.includes(id);
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.GROUP, id, newFavoriteStatus),
				catch: (error) => fromUnknownGroupError('toggleFavorite.favoriteBridge', error),
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
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WildcardError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WILDCARD),
				catch: (error) => fromUnknownWildcardError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () => {
					let query = db.select().from(wildcards).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(wildcards.isFavorite, true))
								: query.where(inArray(wildcards.id, favoriteEntityIds));
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WildcardError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WILDCARD),
				catch: (error) => fromUnknownWildcardError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const readableId = generateReadableId('wildcard', input.name || 'wildcard', 1);
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, WildcardError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.WILDCARD)) !== null,
						catch: (error) => fromUnknownWildcardError('create.favoriteScope', error),
					})
					: false;
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.insert(wildcards)
						.values({
							id: readableId,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownWildcardError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.WILDCARD, readableId, true);
						} catch (error) {
							await db.delete(wildcards).where(eq(wildcards.id, readableId));
							throw error;
						}
					},
					catch: (error) => fromUnknownWildcardError('create.favoriteBridge', error),
				});
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, WildcardError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.WILDCARD)) !== null,
						catch: (error) => fromUnknownWildcardError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.WILDCARD, id, requestedIsFavorite),
					catch: (error) => fromUnknownWildcardError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.update(wildcards)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
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
			const wildcard = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WildcardError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WILDCARD),
				catch: (error) => fromUnknownWildcardError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? wildcard.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(wildcards)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(wildcards.id, id)),
					catch: (error) => fromUnknownWildcardError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.WILDCARD, id, newFavoriteStatus),
					catch: (error) => fromUnknownWildcardError('toggleFavorite.favoriteBridge', error),
				});
			}

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
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, NoteError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.NOTE),
				catch: (error) => fromUnknownNoteError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () => {
					let query = db.select().from(notes).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(notes.isFavorite, true))
								: query.where(inArray(notes.id, favoriteEntityIds));
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, NoteError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.NOTE),
				catch: (error) => fromUnknownNoteError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const readableId = generateReadableId('note', input.title || 'nota', 1);
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, NoteError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.NOTE)) !== null,
						catch: (error) => fromUnknownNoteError('create.favoriteScope', error),
					})
					: false;
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.insert(notes)
						.values({
							id: readableId,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownNoteError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.NOTE, readableId, true);
						} catch (error) {
							await db.delete(notes).where(eq(notes.id, readableId));
							throw error;
						}
					},
					catch: (error) => fromUnknownNoteError('create.favoriteBridge', error),
				});
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, NoteError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.NOTE)) !== null,
						catch: (error) => fromUnknownNoteError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.NOTE, id, requestedIsFavorite),
					catch: (error) => fromUnknownNoteError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.update(notes)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
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
			const note = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, NoteError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.NOTE),
				catch: (error) => fromUnknownNoteError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? note.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(notes)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(notes.id, id)),
					catch: (error) => fromUnknownNoteError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.NOTE, id, newFavoriteStatus),
					catch: (error) => fromUnknownNoteError('toggleFavorite.favoriteBridge', error),
				});
			}

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
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () => {
					let query = db.select().from(properties).$dynamic();

					if (options.onlyFavorites) {
						query = query.where(eq(properties.isFavorite, true));
					}

					return query.orderBy(desc(properties.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownPropertyError('getAll', error),
			});
			return { data: normalizeFavoriteEntities(result, null), total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () => db.select().from(properties).where(eq(properties.id, id)).limit(1),
				catch: (error) => fromUnknownPropertyError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new PropertyNotFound({ propertyId: id }));

			return normalizeFavoriteEntity(result[0], null);
		});

	const create = (input: any): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const readableId = generateReadableId('property', input.name || 'propiedad', 1);
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.insert(properties)
						.values({
							id: readableId,
							...restInput,
							isFavorite: requestedIsFavorite,
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
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;

			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.update(properties)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined ? { isFavorite: requestedIsFavorite } : {}),
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
			const property = yield* getById(id);

			yield* Effect.tryPromise({
				try: () =>
					db
						.update(properties)
						.set({ isFavorite: !property.isFavorite, updatedAt: new Date() })
						.where(eq(properties.id, id)),
				catch: (error) => fromUnknownPropertyError('toggleFavorite', error),
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
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WorldItemError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => {
					let query = db.select().from(worldItems).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(worldItems.isFavorite, true))
								: query.where(inArray(worldItems.id, favoriteEntityIds));
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WorldItemError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('getById.favoriteIds', error),
			});

			return normalizeFavoriteEntity(result[0], favoriteEntityIds);
		});

	const create = (input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const readableId = generateReadableId('world-item', input.name || 'item', 1);
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, WorldItemError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM)) !== null,
						catch: (error) => fromUnknownWorldItemError('create.favoriteScope', error),
					})
					: false;
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.insert(worldItems)
						.values({
							id: readableId,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownWorldItemError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.WORLD_ITEM, readableId, true);
						} catch (error) {
							await db.delete(worldItems).where(eq(worldItems.id, readableId));
							throw error;
						}
					},
					catch: (error) => fromUnknownWorldItemError('create.favoriteBridge', error),
				});
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, WorldItemError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM)) !== null,
						catch: (error) => fromUnknownWorldItemError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.WORLD_ITEM, id, requestedIsFavorite),
					catch: (error) => fromUnknownWorldItemError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.update(worldItems)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
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
			const worldItem = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, WorldItemError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? worldItem.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(worldItems)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(worldItems.id, id)),
					catch: (error) => fromUnknownWorldItemError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.WORLD_ITEM, id, newFavoriteStatus),
					catch: (error) => fromUnknownWorldItemError('toggleFavorite.favoriteBridge', error),
				});
			}

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
