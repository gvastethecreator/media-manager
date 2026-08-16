/**
 * @file PlaceService implementado con Effect
 * @module services/place/place.service.effect
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { imagePlaces, images, places } from '@/lib/drizzle/schema';
import { Place, PlaceCreateInput, PlaceUpdateInput, PlaceWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import {
	fromUnknownError,
	PlaceDatabaseError,
	type PlaceError,
	PlaceHasRelationsError,
	PlaceNameConflict,
	PlaceNotFound,
} from './place-errors.effect';

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
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, PlaceError>;
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], PlaceError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PLACE),
				catch: (error) => fromUnknownError('getById.favoriteIds', error),
			});

			return favoriteService.applyFavoriteProjection(validated, favoriteEntityIds);
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], PlaceError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PLACE),
				catch: (error) => fromUnknownError('getAll.favoriteIds', error),
			});

			const conditions = [];
			if (search) conditions.push(like(places.name, `%${search}%`));
			if (category) conditions.push(eq(places.category, category));
			if (onlyFavorites) {
				if (favoriteEntityIds.length === 0) {
					return {
						places: [],
						total: 0,
						limit,
						offset,
					};
				}

				conditions.push(inArray(places.id, favoriteEntityIds));
			}

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

			const normalizedPlaces = favoriteService.applyFavoriteProjectionMany(data, favoriteEntityIds) as PlaceWithStats[];

			return {
				places: normalizedPlaces,
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: PlaceCreateInput): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			const restInput = input;

			const existing = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () => db.select().from(places).where(eq(places.name, restInput.name)).limit(1),
				catch: (error) => fromUnknownError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new PlaceNameConflict({ name: restInput.name }));
			}

			const readableId = generateReadableId('place', restInput.name, 1);

			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () =>
					db
						.insert(places)
						.values({
							id: readableId,
							name: restInput.name,
							description: restInput.description ?? null,
							emoji: restInput.emoji ?? null,
							color: restInput.color ?? null,
							category: restInput.category ?? null,
							featuredImage: restInput.featuredImage ?? null,
							filters: restInput.filters ?? null,
							metadata: restInput.metadata ?? null,
							parentId: restInput.parentId ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: PlaceUpdateInput): Effect.Effect<Place, PlaceError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const restInput = input;

			const result = yield* Effect.tryPromise<(typeof places.$inferSelect)[], PlaceError>({
				try: () =>
					db
						.update(places)
						.set({
							...(restInput.name !== undefined && { name: restInput.name }),
							...(restInput.description !== undefined && { description: restInput.description }),
							...(restInput.emoji !== undefined && { emoji: restInput.emoji }),
							...(restInput.color !== undefined && { color: restInput.color }),
							...(restInput.category !== undefined && { category: restInput.category }),
							...(restInput.featuredImage !== undefined && { featuredImage: restInput.featuredImage }),
							...(restInput.filters !== undefined && { filters: restInput.filters }),
							...(restInput.metadata !== undefined && { metadata: restInput.metadata }),
							...(restInput.parentId !== undefined && { parentId: restInput.parentId }),
							updatedAt: new Date(),
						})
						.where(eq(places.id, id))
						.returning(),
				catch: (error) => fromUnknownError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PlaceDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return yield* getById(id);
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
			yield* getById(id);

			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, PlaceError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.PLACE, id),
				catch: (error) => fromUnknownError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.PLACE, id, newFavoriteStatus),
				catch: (error) => fromUnknownError('toggleFavorite.set', error),
			});

			return yield* getById(id);
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
						.where(and(eq(imagePlaces.B, id), visibleImageLifecycleCondition())),
				catch: (error) => fromUnknownError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, PlaceError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imagePlaces).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownError('addImage', error),
			});
		});

	return {
		getById,
		getAll,
		create,
		update,
		delete: delete_,
		toggleFavorite,
		getImages,
		addImage,
	};
};

export const PlaceServiceLive = Layer.effect(PlaceService, Effect.succeed(make()));
