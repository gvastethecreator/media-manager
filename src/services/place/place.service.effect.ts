/**
 * @file PlaceService implementado con Effect
 * @module services/place/place.service.effect
 */

import { Schema } from '@effect/schema';
import { asc, count, desc, eq, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { imagePlaces, images, places } from '@/lib/drizzle/schema';
import { Place, PlaceCreateInput, PlaceUpdateInput, PlaceWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import {
	fromUnknownError,
	PlaceDatabaseError,
	type PlaceError,
	PlaceHasRelationsError,
	PlaceNameConflict,
	PlaceNotFound,
} from '@/services/worldbuilding/worldbuilding-errors.effect';

const logger = serverLogger.withContext('PlaceService.Effect');

export interface GetPlacesOptions {
	category?: string;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

export interface GetPlacesResult {
	limit: number;
	offset: number;
	places: PlaceWithStats[];
	total: number;
}

export class PlaceService extends Context.Tag('PlaceService')<PlaceService, PlaceServiceInterface>() {}

export interface PlaceServiceInterface {
	readonly create: (input: PlaceCreateInput) => Effect.Effect<Place, PlaceError>;
	readonly delete: (id: string) => Effect.Effect<void, PlaceError>;
	readonly getAll: (options?: GetPlacesOptions) => Effect.Effect<GetPlacesResult, PlaceError>;
	readonly getById: (id: string) => Effect.Effect<Place, PlaceError>;
	readonly getImages: (id: string) => Effect.Effect<any[], PlaceError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Place, PlaceError>;
	readonly update: (id: string, input: PlaceUpdateInput) => Effect.Effect<Place, PlaceError>;
}

const make = (): PlaceServiceInterface => {
	const getById = (id: string): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando place: ${id}`);
			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () => db.select().from(places).where(eq(places.id, id)).limit(1),
				catch: (error) => fromUnknownError('getById', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceNotFound({ placeId: id }));
			}

			const validated = yield* Schema.decodeUnknown(Place)(result[0]).pipe(
				Effect.mapError((error) => fromUnknownError('decode', error))
			);
			return validated as Place;
		});

	const getAll = (options: GetPlacesOptions = {}): Effect.Effect<GetPlacesResult, PlaceError> =>
		Effect.gen(function* () {
			const {
				search,
				limit = 50,
				offset = 0,
				orderBy = 'createdAt',
				orderDirection = 'desc',
				category,
				onlyFavorites,
			} = options;

			const conditions = [];
			if (search) conditions.push(like(places.name, `%${search}%`));
			if (category) conditions.push(eq(places.category, category));
			if (onlyFavorites) conditions.push(eq(places.isFavorite, true));

			const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
			const orderByColumn = (places as any)[orderBy] || places.createdAt;
			const orderByClause = orderDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

			const [data, totalResult] = yield* Effect.all([
				Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
					try: () =>
						db
							.select()
							.from(places)
							.where(whereClause as any)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
					catch: (error) => fromUnknownError('getAll', error),
				}),
				Effect.tryPromise<Array<{ count: number }>, PlaceError>({
					try: () =>
						db
							.select({ count: count() })
							.from(places)
							.where(whereClause as any),
					catch: (error) => fromUnknownError('getCount', error),
				}),
			]);

			return {
				places: data as PlaceWithStats[],
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: PlaceCreateInput): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			const existing = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () => db.select().from(places).where(eq(places.name, input.name)).limit(1),
				catch: (error) => fromUnknownError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new PlaceNameConflict({ name: input.name }));
			}

			const readableId = generateReadableId('place', input.name, 1);

			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () =>
					db
						.insert(places)
						.values({
							id: readableId,
							name: input.name,
							description: input.description ?? null,
							emoji: input.emoji ?? null,
							color: input.color ?? null,
							category: input.category ?? null,
							featuredImage: input.featuredImage ?? null,
							filters: input.filters ?? null,
							isFavorite: input.isFavorite ?? false,
							metadata: input.metadata ?? null,
							parentId: input.parentId ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			return result[0] as Place;
		});

	const update = (id: string, input: PlaceUpdateInput): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () =>
					db
						.update(places)
						.set({
							...(input.name !== undefined && { name: input.name }),
							...(input.description !== undefined && { description: input.description }),
							...(input.emoji !== undefined && { emoji: input.emoji }),
							...(input.color !== undefined && { color: input.color }),
							...(input.category !== undefined && { category: input.category }),
							...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
							...(input.filters !== undefined && { filters: input.filters }),
							...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
							...(input.metadata !== undefined && { metadata: input.metadata }),
							...(input.parentId !== undefined && { parentId: input.parentId }),
							updatedAt: new Date(),
						})
						.where(eq(places.id, id))
						.returning(),
				catch: (error) => fromUnknownError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return result[0] as Place;
		});

	const delete_ = (id: string): Effect.Effect<void, PlaceError> =>
		Effect.gen(function* () {
			const relationCount = yield* Effect.tryPromise<Array<{ count: number }>, PlaceError>({
				try: () => db.select({ count: count() }).from(imagePlaces).where(eq(imagePlaces.B, id)),
				catch: (error) => fromUnknownError('checkRelations', error),
			});

			if ((relationCount[0]?.count ?? 0) > 0) {
				return yield* Effect.fail(
					new PlaceHasRelationsError({
						placeId: id,
						relationCount: relationCount[0].count,
						relations: ['images'],
					})
				);
			}

			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () => db.delete(places).where(eq(places.id, id)).returning(),
				catch: (error) => fromUnknownError('delete', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceNotFound({ placeId: id }));
			}
		});

	const toggleFavorite = (id: string): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			const place = yield* getById(id);
			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () =>
					db
						.update(places)
						.set({ isFavorite: !place.isFavorite, updatedAt: new Date() })
						.where(eq(places.id, id))
						.returning(),
				catch: (error) => fromUnknownError('toggleFavorite', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceDatabaseError({ operation: 'toggleFavorite', message: 'No row returned' }));
			}
			return result[0] as Place;
		});

	const getImages = (id: string): Effect.Effect<any[], PlaceError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const result = yield* Effect.tryPromise<Array<{ image: typeof images.$inferSelect }>, PlaceError>({
				try: () =>
					db
						.select({ image: images })
						.from(imagePlaces)
						.innerJoin(images, eq(imagePlaces.A, images.id))
						.where(eq(imagePlaces.B, id)),
				catch: (error) => fromUnknownError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	return {
		getById,
		getAll,
		create,
		update,
		delete: delete_,
		toggleFavorite,
		getImages,
	};
};

export const PlaceServiceLive = Layer.effect(PlaceService, Effect.succeed(make()));
