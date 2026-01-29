/**
 * @file Secondary Services implementados con Effect
 * @module services/secondary/secondary-services.effect
 * @description Servicios Group, Wildcard, Note, Property, WorldItem con Effect-TS
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { desc, eq } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { generateReadableId } from '@/lib/utils/id-generator';
import { groups, imageNotes, images, notes, properties, wildcards, worldItems } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
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

// ============= Group Service =============

export class GroupService extends Context.Tag('GroupService')<GroupService, GroupServiceInterface>() {}

export interface GroupServiceInterface {
	readonly getAll: (options?: any) => Effect.Effect<any, GroupError>;
	readonly getById: (id: string) => Effect.Effect<any, GroupError>;
	readonly create: (input: any) => Effect.Effect<any, GroupError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, GroupError>;
	readonly delete: (id: string) => Effect.Effect<void, GroupError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, GroupError>;
}

const makeGroupService = (): GroupServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.select()
						.from(groups)
						.orderBy(desc(groups.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownGroupError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () => db.select().from(groups).where(eq(groups.id, id)).limit(1),
				catch: (error) => fromUnknownGroupError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new GroupNotFound({ groupId: id }));
			return result[0];
		});

	const create = (input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const readableId = generateReadableId('group', input.name || 'grupo', 1);
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.insert(groups)
						.values({ id: readableId, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownGroupError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: any): Effect.Effect<any, GroupError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.update(groups)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(groups.id, id))
						.returning(),
				catch: (error) => fromUnknownGroupError('update', error),
			});
			return result[0];
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
			const group = yield* getById(id);
			const result = yield* Effect.tryPromise<(typeof groups.$inferSelect)[], GroupError>({
				try: () =>
					db
						.update(groups)
						.set({ isFavorite: !group.isFavorite, updatedAt: new Date() })
						.where(eq(groups.id, id))
						.returning(),
				catch: (error) => fromUnknownGroupError('toggleFavorite', error),
			});
			return result[0];
		});

	return { getAll, getById, create, update, delete: delete_, toggleFavorite };
};

export const GroupServiceLive = Layer.effect(GroupService, Effect.succeed(makeGroupService()));

// ============= Wildcard Service =============

export class WildcardService extends Context.Tag('WildcardService')<WildcardService, WildcardServiceInterface>() {}

export interface WildcardServiceInterface {
	readonly getAll: (options?: any) => Effect.Effect<any, WildcardError>;
	readonly getById: (id: string) => Effect.Effect<any, WildcardError>;
	readonly create: (input: any) => Effect.Effect<any, WildcardError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, WildcardError>;
	readonly delete: (id: string) => Effect.Effect<void, WildcardError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<any, WildcardError>;
}

const makeWildcardService = (): WildcardServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.select()
						.from(wildcards)
						.orderBy(desc(wildcards.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownWildcardError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () => db.select().from(wildcards).where(eq(wildcards.id, id)).limit(1),
				catch: (error) => fromUnknownWildcardError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WildcardNotFound({ wildcardId: id }));
			return result[0];
		});

	const create = (input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const readableId = generateReadableId('wildcard', input.name || 'wildcard', 1);
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.insert(wildcards)
						.values({ id: readableId, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownWildcardError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: any): Effect.Effect<any, WildcardError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.update(wildcards)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(wildcards.id, id))
						.returning(),
				catch: (error) => fromUnknownWildcardError('update', error),
			});
			return result[0];
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
			const result = yield* Effect.tryPromise<(typeof wildcards.$inferSelect)[], WildcardError>({
				try: () =>
					db
						.update(wildcards)
						.set({ isFavorite: !wildcard.isFavorite, updatedAt: new Date() })
						.where(eq(wildcards.id, id))
						.returning(),
				catch: (error) => fromUnknownWildcardError('toggleFavorite', error),
			});
			return result[0];
		});

	return { getAll, getById, create, update, delete: delete_, toggleFavorite };
};

export const WildcardServiceLive = Layer.effect(WildcardService, Effect.succeed(makeWildcardService()));

// ============= Note Service =============

export class NoteService extends Context.Tag('NoteService')<NoteService, NoteServiceInterface>() {}

export interface NoteServiceInterface {
	readonly getAll: (options?: any) => Effect.Effect<any, NoteError>;
	readonly getById: (id: string) => Effect.Effect<any, NoteError>;
	readonly create: (input: any) => Effect.Effect<any, NoteError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, NoteError>;
	readonly delete: (id: string) => Effect.Effect<void, NoteError>;
	readonly getImages: (id: string) => Effect.Effect<any[], NoteError>;
}

const makeNoteService = (): NoteServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.select()
						.from(notes)
						.orderBy(desc(notes.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownNoteError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () => db.select().from(notes).where(eq(notes.id, id)).limit(1),
				catch: (error) => fromUnknownNoteError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new NoteNotFound({ noteId: id }));
			return result[0];
		});

	const create = (input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const readableId = generateReadableId('note', input.title || 'nota', 1);
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.insert(notes)
						.values({ id: readableId, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownNoteError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: any): Effect.Effect<any, NoteError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof notes.$inferSelect)[], NoteError>({
				try: () =>
					db
						.update(notes)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(notes.id, id))
						.returning(),
				catch: (error) => fromUnknownNoteError('update', error),
			});
			return result[0];
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

	return { getAll, getById, create, update, delete: delete_, getImages };
};

export const NoteServiceLive = Layer.effect(NoteService, Effect.succeed(makeNoteService()));

// ============= Property Service =============

export class PropertyService extends Context.Tag('PropertyService')<PropertyService, PropertyServiceInterface>() {}

export interface PropertyServiceInterface {
	readonly getAll: (options?: any) => Effect.Effect<any, PropertyError>;
	readonly getById: (id: string) => Effect.Effect<any, PropertyError>;
	readonly create: (input: any) => Effect.Effect<any, PropertyError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, PropertyError>;
	readonly delete: (id: string) => Effect.Effect<void, PropertyError>;
}

const makePropertyService = (): PropertyServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.select()
						.from(properties)
						.orderBy(desc(properties.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownPropertyError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () => db.select().from(properties).where(eq(properties.id, id)).limit(1),
				catch: (error) => fromUnknownPropertyError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new PropertyNotFound({ propertyId: id }));
			return result[0];
		});

	const create = (input: any): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const readableId = generateReadableId('property', input.name || 'propiedad', 1);
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.insert(properties)
						.values({ id: readableId, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownPropertyError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: any): Effect.Effect<any, PropertyError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof properties.$inferSelect)[], PropertyError>({
				try: () =>
					db
						.update(properties)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(properties.id, id))
						.returning(),
				catch: (error) => fromUnknownPropertyError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, PropertyError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(properties).where(eq(properties.id, id));
			},
			catch: (error) => fromUnknownPropertyError('delete', error),
		});

	return { getAll, getById, create, update, delete: delete_ };
};

export const PropertyServiceLive = Layer.effect(PropertyService, Effect.succeed(makePropertyService()));

// ============= WorldItem Service =============

export class WorldItemService extends Context.Tag('WorldItemService')<WorldItemService, WorldItemServiceInterface>() {}

export interface WorldItemServiceInterface {
	readonly getAll: (options?: any) => Effect.Effect<any, WorldItemError>;
	readonly getById: (id: string) => Effect.Effect<any, WorldItemError>;
	readonly create: (input: any) => Effect.Effect<any, WorldItemError>;
	readonly update: (id: string, input: any) => Effect.Effect<any, WorldItemError>;
	readonly delete: (id: string) => Effect.Effect<void, WorldItemError>;
}

const makeWorldItemService = (): WorldItemServiceInterface => {
	const getAll = (options: any = {}): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.select()
						.from(worldItems)
						.orderBy(desc(worldItems.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownWorldItemError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => db.select().from(worldItems).where(eq(worldItems.id, id)).limit(1),
				catch: (error) => fromUnknownWorldItemError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new WorldItemNotFound({ worldItemId: id }));
			return result[0];
		});

	const create = (input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const readableId = generateReadableId('world-item', input.name || 'item', 1);
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.insert(worldItems)
						.values({ id: readableId, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownWorldItemError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: any): Effect.Effect<any, WorldItemError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () =>
					db
						.update(worldItems)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(worldItems.id, id))
						.returning(),
				catch: (error) => fromUnknownWorldItemError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, WorldItemError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(worldItems).where(eq(worldItems.id, id));
			},
			catch: (error) => fromUnknownWorldItemError('delete', error),
		});

	return { getAll, getById, create, update, delete: delete_ };
};

export const WorldItemServiceLive = Layer.effect(WorldItemService, Effect.succeed(makeWorldItemService()));
