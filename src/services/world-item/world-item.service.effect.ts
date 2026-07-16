/**
 * @file WorldItemService implementado con Effect
 * @module services/world-item/world-item.service.effect
 */

import { and, asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { imageWorldItems, images, videoWorldItems, worldItems } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	fromUnknownWorldItemError,
	WorldItemDatabaseError,
	type WorldItemError,
	WorldItemHasRelationsError,
	WorldItemNameConflict,
	WorldItemNotFound,
} from './world-item-errors.effect';

const logger = serverLogger.withContext('WorldItemService.Effect');

export interface GetWorldItemsOptions {
	category?: string;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

export interface GetWorldItemsResult {
	limit: number;
	offset: number;
	total: number;
	worldItems: Record<string, unknown>[];
}

export class WorldItemService extends Context.Tag('WorldItemService')<WorldItemService, WorldItemServiceInterface>() {}

export interface WorldItemServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, WorldItemError>;
	readonly addVideo: (id: string, videoId: string) => Effect.Effect<void, WorldItemError>;
	readonly create: (input: Record<string, unknown>) => Effect.Effect<Record<string, unknown>, WorldItemError>;
	readonly delete: (id: string) => Effect.Effect<void, WorldItemError>;
	readonly getAll: (options?: GetWorldItemsOptions) => Effect.Effect<GetWorldItemsResult, WorldItemError>;
	readonly getById: (id: string) => Effect.Effect<Record<string, unknown>, WorldItemError>;
	readonly getImages: (id: string) => Effect.Effect<any[], WorldItemError>;
	readonly removeImage: (id: string, imageId: string) => Effect.Effect<void, WorldItemError>;
	readonly removeVideo: (id: string, videoId: string) => Effect.Effect<void, WorldItemError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Record<string, unknown>, WorldItemError>;
	readonly update: (
		id: string,
		input: Record<string, unknown>
	) => Effect.Effect<Record<string, unknown>, WorldItemError>;
}

const make = (): WorldItemServiceInterface => {
	const getById = (id: string): Effect.Effect<Record<string, unknown>, WorldItemError> =>
		Effect.gen(function* () {
			logger.info(`Buscando worldItem: ${id}`);
			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => db.select().from(worldItems).where(eq(worldItems.id, id)).limit(1),
				catch: (error) => fromUnknownWorldItemError('getById', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new WorldItemNotFound({ worldItemId: id }));
			}

			return result[0] as Record<string, unknown>;
		});

	const getAll = (options: GetWorldItemsOptions = {}): Effect.Effect<GetWorldItemsResult, WorldItemError> =>
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

			const favoriteEntityIds: string[] | null = onlyFavorites
				? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM),
						catch: (error) => fromUnknownWorldItemError('getAll.favoriteIds', error),
					})
				: null;

			const conditions = [];
			if (search) conditions.push(like(worldItems.name, `%${search}%`));
			if (category) conditions.push(eq(worldItems.category, category));
			if (onlyFavorites) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(worldItems.isFavorite, true));
				} else if (favoriteEntityIds.length === 0) {
					return {
						worldItems: [],
						total: 0,
						limit,
						offset,
					};
				} else {
					conditions.push(inArray(worldItems.id, favoriteEntityIds));
				}
			}

			const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
			const orderByColumn = (worldItems as any)[orderBy] || worldItems.createdAt;
			const orderByClause = orderDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

			const [data, totalResult] = yield* Effect.all([
				Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
					try: () =>
						db
							.select()
							.from(worldItems)
							.where(whereClause as any)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
					catch: (error) => fromUnknownWorldItemError('getAll', error),
				}),
				Effect.tryPromise<Array<{ count: number }>, WorldItemError>({
					try: () =>
						db
							.select({ count: count() })
							.from(worldItems)
							.where(whereClause as any),
					catch: (error) => fromUnknownWorldItemError('getCount', error),
				}),
			]);

			const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;
			const normalizedWorldItems =
				favoriteIdSet === null
					? data
					: data.map((item) => ({
							...item,
							isFavorite: favoriteIdSet.has(item.id),
						}));

			return {
				worldItems: normalizedWorldItems as Record<string, unknown>[],
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: Record<string, unknown>): Effect.Effect<Record<string, unknown>, WorldItemError> =>
		Effect.gen(function* () {
			const name = input.name as string;
			const existing = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => db.select().from(worldItems).where(eq(worldItems.name, name)).limit(1),
				catch: (error) => fromUnknownWorldItemError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new WorldItemNameConflict({ name }));
			}

			const readableId = generateReadableId('world-item', name, 1);
			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge = requestedIsFavorite
				? yield* Effect.tryPromise({
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
							name,
							description: (input.description as string) ?? null,
							emoji: (input.emoji as string) ?? null,
							color: (input.color as string) ?? null,
							category: (input.category as string) ?? null,
							subtype: (input.subtype as string) ?? null,
							featuredImage: (input.featuredImage as string) ?? null,
							filters: (input.filters as string) ?? null,
							isArchived: (input.isArchived as boolean) ?? false,
							metadata: (input.metadata as string) ?? null,
							parentId: (input.parentId as string) ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownWorldItemError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new WorldItemDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.WORLD_ITEM, result[0].id, true);
						} catch (error) {
							await db.delete(worldItems).where(eq(worldItems.id, result[0].id));
							throw error;
						}
					},
					catch: (error) => fromUnknownWorldItemError('create.favoriteBridge', error),
				});
			}

			return {
				...result[0],
				isFavorite: requestedIsFavorite ? true : result[0].isFavorite,
			} as Record<string, unknown>;
		});

	const update = (id: string, input: Record<string, unknown>): Effect.Effect<Record<string, unknown>, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const requestedIsFavorite = input.isFavorite as boolean | undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
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
							...(input.name !== undefined && { name: input.name as string }),
							...(input.description !== undefined && { description: input.description as string }),
							...(input.emoji !== undefined && { emoji: input.emoji as string }),
							...(input.color !== undefined && { color: input.color as string }),
							...(input.category !== undefined && { category: input.category as string }),
							...(input.subtype !== undefined && { subtype: input.subtype as string }),
							...(input.featuredImage !== undefined && { featuredImage: input.featuredImage as string }),
							...(input.filters !== undefined && { filters: input.filters as string }),
							...(input.isArchived !== undefined && { isArchived: input.isArchived as boolean }),
							...(input.metadata !== undefined && { metadata: input.metadata as string }),
							...(input.parentId !== undefined && { parentId: input.parentId as string }),
							updatedAt: new Date(),
						})
						.where(eq(worldItems.id, id))
						.returning(),
				catch: (error) => fromUnknownWorldItemError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new WorldItemDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return result[0] as Record<string, unknown>;
		});

	const delete_ = (id: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			const [imageRelationCount, videoRelationCount] = yield* Effect.all([
				Effect.tryPromise<Array<{ count: number }>, WorldItemError>({
					try: () => db.select({ count: count() }).from(imageWorldItems).where(eq(imageWorldItems.B, id)),
					catch: (error) => fromUnknownWorldItemError('checkRelations.images', error),
				}),
				Effect.tryPromise<Array<{ count: number }>, WorldItemError>({
					try: () => db.select({ count: count() }).from(videoWorldItems).where(eq(videoWorldItems.B, id)),
					catch: (error) => fromUnknownWorldItemError('checkRelations.videos', error),
				}),
			]);

			const totalRelations = (imageRelationCount[0]?.count ?? 0) + (videoRelationCount[0]?.count ?? 0);

			if (totalRelations > 0) {
				const relations: string[] = [];
				if ((imageRelationCount[0]?.count ?? 0) > 0) relations.push('images');
				if ((videoRelationCount[0]?.count ?? 0) > 0) relations.push('videos');

				return yield* Effect.fail(
					new WorldItemHasRelationsError({
						worldItemId: id,
						relationCount: totalRelations,
						relations,
					})
				);
			}

			const result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
				try: () => db.delete(worldItems).where(eq(worldItems.id, id)).returning(),
				catch: (error) => fromUnknownWorldItemError('delete', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new WorldItemNotFound({ worldItemId: id }));
			}
		});

	const toggleFavorite = (id: string): Effect.Effect<Record<string, unknown>, WorldItemError> =>
		Effect.gen(function* () {
			const item = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.WORLD_ITEM),
				catch: (error) => fromUnknownWorldItemError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? Boolean((item as any).isFavorite);
			const newFavoriteStatus = !currentFavoriteStatus;

			let result;
			if (favoriteEntityIds !== null) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.WORLD_ITEM, id, newFavoriteStatus),
					catch: (error) => fromUnknownWorldItemError('toggleFavorite.favoriteBridge', error),
				});

				result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
					try: () => db.select().from(worldItems).where(eq(worldItems.id, id)).limit(1),
					catch: (error) => fromUnknownWorldItemError('toggleFavorite.refetch', error),
				});
			} else {
				result = yield* Effect.tryPromise<(typeof worldItems.$inferSelect)[], WorldItemError>({
					try: () => db.select().from(worldItems).where(eq(worldItems.id, id)).limit(1),
					catch: (error) => fromUnknownWorldItemError('toggleFavorite.refetch', error),
				});
			}

			if (result.length === 0) {
				return yield* Effect.fail(
					new WorldItemDatabaseError({ operation: 'toggleFavorite', message: 'No row returned' })
				);
			}
			return result[0] as Record<string, unknown>;
		});

	const getImages = (id: string): Effect.Effect<any[], WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const result = yield* Effect.tryPromise<Array<{ image: typeof images.$inferSelect }>, WorldItemError>({
				try: () =>
					db
						.select({ image: images })
						.from(imageWorldItems)
						.innerJoin(images, eq(imageWorldItems.A, images.id))
						.where(and(eq(imageWorldItems.B, id), visibleImageLifecycleCondition())),
				catch: (error) => fromUnknownWorldItemError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageWorldItems).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownWorldItemError('addImage', error),
			});
		});

	const removeImage = (id: string, imageId: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () =>
					db.delete(imageWorldItems).where(sql`${imageWorldItems.A} = ${imageId} AND ${imageWorldItems.B} = ${id}`),
				catch: (error) => fromUnknownWorldItemError('removeImage', error),
			});
		});

	const addVideo = (id: string, videoId: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(videoWorldItems).values({ A: videoId, B: id }),
				catch: (error) => fromUnknownWorldItemError('addVideo', error),
			});
		});

	const removeVideo = (id: string, videoId: string): Effect.Effect<void, WorldItemError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () =>
					db.delete(videoWorldItems).where(sql`${videoWorldItems.A} = ${videoId} AND ${videoWorldItems.B} = ${id}`),
				catch: (error) => fromUnknownWorldItemError('removeVideo', error),
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
		removeImage,
		addVideo,
		removeVideo,
	};
};

export const WorldItemServiceLive = Layer.effect(WorldItemService, Effect.succeed(make()));
