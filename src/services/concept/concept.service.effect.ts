/**
 * @file ConceptService implementado con Effect
 * @module services/concept/concept.service.effect
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { concepts, imageConcepts, images, videoConcepts } from '@/lib/drizzle/schema';
import { Concept, ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	ConceptDatabaseError,
	type ConceptError,
	ConceptHasRelationsError,
	ConceptNameConflict,
	ConceptNotFound,
	fromUnknownConceptError,
} from '@/services/worldbuilding/worldbuilding-errors.effect';

const logger = serverLogger.withContext('ConceptService.Effect');

export interface GetConceptsOptions {
	category?: string;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

export interface GetConceptsResult {
	concepts: ConceptWithStats[];
	limit: number;
	offset: number;
	total: number;
}

export interface ConceptRelationCounts {
	albums: number;
	characters: number;
	collections: number;
	groups: number;
	images: number;
	notes: number;
	places: number;
	prompts: number;
	properties: number;
	tags: number;
	videos: number;
	wildcards: number;
	worldItems: number;
}

export class ConceptService extends Context.Tag('ConceptService')<ConceptService, ConceptServiceInterface>() {}

export interface ConceptServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, ConceptError>;
	readonly addVideo: (id: string, videoId: string) => Effect.Effect<void, ConceptError>;
	readonly create: (input: ConceptCreateInput) => Effect.Effect<Concept, ConceptError>;
	readonly delete: (id: string) => Effect.Effect<void, ConceptError>;
	readonly getAll: (options?: GetConceptsOptions) => Effect.Effect<GetConceptsResult, ConceptError>;
	readonly getById: (id: string) => Effect.Effect<Concept, ConceptError>;
	readonly getImages: (id: string) => Effect.Effect<any[], ConceptError>;
	readonly getRelationCounts: (id: string) => Effect.Effect<ConceptRelationCounts, ConceptError>;
	readonly removeImage: (id: string, imageId: string) => Effect.Effect<void, ConceptError>;
	readonly removeVideo: (id: string, videoId: string) => Effect.Effect<void, ConceptError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Concept, ConceptError>;
	readonly update: (id: string, input: ConceptUpdateInput) => Effect.Effect<Concept, ConceptError>;
}

const make = (): ConceptServiceInterface => {
	const getById = (id: string): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando concept: ${id}`);
			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () => db.select().from(concepts).where(eq(concepts.id, id)).limit(1),
				catch: (error) => fromUnknownConceptError('getById', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptNotFound({ conceptId: id }));
			}

			const validated = yield* Schema.decodeUnknown(Concept)(result[0]).pipe(
				Effect.mapError((error) => fromUnknownConceptError('decode', error))
			);
			return validated as Concept;
		});

	const getAll = (options: GetConceptsOptions = {}): Effect.Effect<GetConceptsResult, ConceptError> =>
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

			const favoriteEntityIds: string[] | null =
				onlyFavorites
					? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.CONCEPT),
						catch: (error) => fromUnknownConceptError('getAll.favoriteIds', error),
					})
					: null;

			const conditions = [];
			if (search) conditions.push(like(concepts.name, `%${search}%`));
			if (category) conditions.push(eq(concepts.category, category));
			if (onlyFavorites) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(concepts.isFavorite, true));
				} else if (favoriteEntityIds.length === 0) {
					return {
						concepts: [],
						total: 0,
						limit,
						offset,
					};
				} else {
					conditions.push(inArray(concepts.id, favoriteEntityIds));
				}
			}

			const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
			const orderByColumn = (concepts as any)[orderBy] || concepts.createdAt;
			const orderByClause = orderDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

			const [data, totalResult] = yield* Effect.all([
				Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
					try: () =>
						db
							.select()
							.from(concepts)
							.where(whereClause as any)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
					catch: (error) => fromUnknownConceptError('getAll', error),
				}),
				Effect.tryPromise<Array<{ count: number }>, ConceptError>({
					try: () =>
						db
							.select({ count: count() })
							.from(concepts)
							.where(whereClause as any),
					catch: (error) => fromUnknownConceptError('getCount', error),
				}),
			]);

			const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;
			const normalizedConcepts =
				favoriteIdSet === null
					? data
					: data.map((concept) => ({
						...concept,
						isFavorite: favoriteIdSet.has(concept.id),
					}));

			return {
				concepts: normalizedConcepts as ConceptWithStats[],
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: ConceptCreateInput): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			const existing = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () => db.select().from(concepts).where(eq(concepts.name, input.name)).limit(1),
				catch: (error) => fromUnknownConceptError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new ConceptNameConflict({ name: input.name }));
			}

			const readableId = generateReadableId('concept', input.name, 1);
			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.CONCEPT)) !== null,
						catch: (error) => fromUnknownConceptError('create.favoriteScope', error),
					})
					: false;

			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () =>
					db
						.insert(concepts)
						.values({
							id: readableId,
							name: input.name,
							description: input.description ?? null,
							emoji: input.emoji ?? null,
							color: input.color ?? null,
							category: input.category ?? null,
							featuredImage: input.featuredImage ?? null,
							filters: input.filters ?? null,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							metadata: input.metadata ?? null,
							parentId: input.parentId ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownConceptError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.CONCEPT, result[0].id, true);
						} catch (error) {
							await db.delete(concepts).where(eq(concepts.id, result[0].id));
							throw error;
						}
					},
					catch: (error) => fromUnknownConceptError('create.favoriteBridge', error),
				});
			}

			return {
				...result[0],
				isFavorite: requestedIsFavorite ? true : result[0].isFavorite,
			} as Concept;
		});

	const update = (id: string, input: ConceptUpdateInput): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const requestedIsFavorite = input.isFavorite;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.CONCEPT)) !== null,
						catch: (error) => fromUnknownConceptError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.CONCEPT, id, requestedIsFavorite),
					catch: (error) => fromUnknownConceptError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () =>
					db
						.update(concepts)
						.set({
							...(input.name !== undefined && { name: input.name }),
							...(input.description !== undefined && { description: input.description }),
							...(input.emoji !== undefined && { emoji: input.emoji }),
							...(input.color !== undefined && { color: input.color }),
							...(input.category !== undefined && { category: input.category }),
							...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
							...(input.filters !== undefined && { filters: input.filters }),
							...(input.isFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: input.isFavorite }
								: {}),
							...(input.metadata !== undefined && { metadata: input.metadata }),
							...(input.parentId !== undefined && { parentId: input.parentId }),
							updatedAt: new Date(),
						})
						.where(eq(concepts.id, id))
						.returning(),
				catch: (error) => fromUnknownConceptError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return result[0] as Concept;
		});

	const delete_ = (id: string): Effect.Effect<void, ConceptError> =>
		Effect.gen(function* () {
			const relationCount = yield* Effect.tryPromise<Array<{ count: number }>, ConceptError>({
				try: () => db.select({ count: count() }).from(imageConcepts).where(eq(imageConcepts.B, id)),
				catch: (error) => fromUnknownConceptError('checkRelations', error),
			});

			if ((relationCount[0]?.count ?? 0) > 0) {
				return yield* Effect.fail(
					new ConceptHasRelationsError({
						conceptId: id,
						relationCount: relationCount[0].count,
						relations: ['images'],
					})
				);
			}

			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () => db.delete(concepts).where(eq(concepts.id, id)).returning(),
				catch: (error) => fromUnknownConceptError('delete', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptNotFound({ conceptId: id }));
			}
		});

	const toggleFavorite = (id: string): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			const concept = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.CONCEPT),
				catch: (error) => fromUnknownConceptError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? concept.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			let result;
			if (favoriteEntityIds === null) {
				result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
					try: () =>
						db
							.update(concepts)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(concepts.id, id))
							.returning(),
					catch: (error) => fromUnknownConceptError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.CONCEPT, id, newFavoriteStatus),
					catch: (error) => fromUnknownConceptError('toggleFavorite.favoriteBridge', error),
				});

				result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
					try: () => db.select().from(concepts).where(eq(concepts.id, id)).limit(1),
					catch: (error) => fromUnknownConceptError('toggleFavorite.refetch', error),
				});
			}

			if (result.length === 0) {
				return yield* Effect.fail(
					new ConceptDatabaseError({ operation: 'toggleFavorite', message: 'No row returned' })
				);
			}
			return result[0] as Concept;
		});

	const getImages = (id: string): Effect.Effect<any[], ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const result = yield* Effect.tryPromise<Array<{ image: typeof images.$inferSelect }>, ConceptError>({
				try: () =>
					db
						.select({ image: images })
						.from(imageConcepts)
						.innerJoin(images, eq(imageConcepts.A, images.id))
						.where(eq(imageConcepts.B, id)),
				catch: (error) => fromUnknownConceptError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	const getRelationCounts = (id: string): Effect.Effect<ConceptRelationCounts, ConceptError> =>
		Effect.gen(function* () {
			const [imageCount, videoCount] = yield* Effect.all([
				Effect.tryPromise({
					try: () => db.select({ count: count() }).from(imageConcepts).where(eq(imageConcepts.B, id)),
					catch: (error) => fromUnknownConceptError('getRelationCounts.images', error),
				}),
				Effect.tryPromise({
					try: () => db.select({ count: count() }).from(videoConcepts).where(eq(videoConcepts.B, id)),
					catch: (error) => fromUnknownConceptError('getRelationCounts.videos', error),
				}),
			]);

			return {
				images: imageCount[0]?.count ?? 0,
				videos: videoCount[0]?.count ?? 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			};
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imageConcepts).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownConceptError('addImage', error),
			});
		});

	const removeImage = (id: string, imageId: string): Effect.Effect<void, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.delete(imageConcepts).where(and(eq(imageConcepts.A, imageId), eq(imageConcepts.B, id))),
				catch: (error) => fromUnknownConceptError('removeImage', error),
			});
		});

	const addVideo = (id: string, videoId: string): Effect.Effect<void, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(videoConcepts).values({ A: videoId, B: id }),
				catch: (error) => fromUnknownConceptError('addVideo', error),
			});
		});

	const removeVideo = (id: string, videoId: string): Effect.Effect<void, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.delete(videoConcepts).where(and(eq(videoConcepts.A, videoId), eq(videoConcepts.B, id))),
				catch: (error) => fromUnknownConceptError('removeVideo', error),
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
		getRelationCounts,
		addImage,
		removeImage,
		addVideo,
		removeVideo,
	};
};

export const ConceptServiceLive = Layer.effect(ConceptService, Effect.succeed(make()));
