/**
 * @file ConceptService implementado con Effect
 * @module services/concept/concept.service.effect
 */

import { Schema, Context, Effect, Layer } from 'effect';
import { and, asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { concepts, imageConcepts, images, videoConcepts } from '@/lib/drizzle/schema';
import { Concept, ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import {
	ConceptDatabaseError,
	type ConceptError,
	ConceptHasRelationsError,
	ConceptNameConflict,
	ConceptNotFound,
	fromUnknownConceptError,
} from './concept-errors.effect';

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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], ConceptError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.CONCEPT),
				catch: (error) => fromUnknownConceptError('getById.favoriteIds', error),
			});

			return favoriteService.applyFavoriteProjection(validated, favoriteEntityIds);
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], ConceptError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.CONCEPT),
				catch: (error) => fromUnknownConceptError('getAll.favoriteIds', error),
			});

			const conditions = [];
			if (search) conditions.push(like(concepts.name, `%${search}%`));
			if (category) conditions.push(eq(concepts.category, category));
			if (onlyFavorites) {
				if (favoriteEntityIds.length === 0) {
					return {
						concepts: [],
						total: 0,
						limit,
						offset,
					};
				}

				conditions.push(inArray(concepts.id, favoriteEntityIds));
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

			const normalizedConcepts = favoriteService.applyFavoriteProjectionMany(
				data,
				favoriteEntityIds
			) as ConceptWithStats[];

			return {
				concepts: normalizedConcepts,
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: ConceptCreateInput): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			const restInput = input;

			const existing = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () => db.select().from(concepts).where(eq(concepts.name, restInput.name)).limit(1),
				catch: (error) => fromUnknownConceptError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new ConceptNameConflict({ name: restInput.name }));
			}

			const readableId = generateReadableId('concept', restInput.name, 1);

			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () =>
					db
						.insert(concepts)
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
				catch: (error) => fromUnknownConceptError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: ConceptUpdateInput): Effect.Effect<Concept, ConceptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const restInput = input;

			const result = yield* Effect.tryPromise<(typeof concepts.$inferSelect)[], ConceptError>({
				try: () =>
					db
						.update(concepts)
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
						.where(eq(concepts.id, id))
						.returning(),
				catch: (error) => fromUnknownConceptError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new ConceptDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return yield* getById(id);
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
			yield* getById(id);

			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, ConceptError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.CONCEPT, id),
				catch: (error) => fromUnknownConceptError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.CONCEPT, id, newFavoriteStatus),
				catch: (error) => fromUnknownConceptError('toggleFavorite.set', error),
			});

			return yield* getById(id);
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
						.where(and(eq(imageConcepts.B, id), visibleImageLifecycleCondition())),
				catch: (error) => fromUnknownConceptError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	const getRelationCounts = (id: string): Effect.Effect<ConceptRelationCounts, ConceptError> =>
		Effect.gen(function* () {
			const [imageCount, videoCount] = yield* Effect.all([
				Effect.tryPromise({
					try: () =>
						db
							.select({ count: count() })
							.from(imageConcepts)
							.innerJoin(images, eq(imageConcepts.A, images.id))
							.where(and(eq(imageConcepts.B, id), visibleImageLifecycleCondition())),
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
