/**
 * @file PromptService implementado con Effect
 * @module services/prompt/prompt.service.effect
 */

import { Schema } from '@effect/schema';
import { asc, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { imagePrompts, images, prompts } from '@/lib/drizzle/schema';
import { Prompt, PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	fromUnknownPromptError,
	PromptDatabaseError,
	type PromptError,
	PromptHasRelationsError,
	PromptNameConflict,
	PromptNotFound,
} from '@/services/worldbuilding/worldbuilding-errors.effect';

const logger = serverLogger.withContext('PromptService.Effect');

export interface GetPromptsOptions {
	category?: string;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

export interface GetPromptsResult {
	limit: number;
	offset: number;
	prompts: PromptWithStats[];
	total: number;
}

export class PromptService extends Context.Tag('PromptService')<PromptService, PromptServiceInterface>() {}

export interface PromptServiceInterface {
	readonly addImage: (id: string, imageId: string) => Effect.Effect<void, PromptError>;
	readonly create: (input: PromptCreateInput) => Effect.Effect<Prompt, PromptError>;
	readonly delete: (id: string) => Effect.Effect<void, PromptError>;
	readonly getAll: (options?: GetPromptsOptions) => Effect.Effect<GetPromptsResult, PromptError>;
	readonly getById: (id: string) => Effect.Effect<Prompt, PromptError>;
	readonly getImages: (id: string) => Effect.Effect<any[], PromptError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Prompt, PromptError>;
	readonly update: (id: string, input: PromptUpdateInput) => Effect.Effect<Prompt, PromptError>;
}

const make = (): PromptServiceInterface => {
	const getById = (id: string): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando prompt: ${id}`);
			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () => db.select().from(prompts).where(eq(prompts.id, id)).limit(1),
				catch: (error) => fromUnknownPromptError('getById', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptNotFound({ promptId: id }));
			}

			const validated = yield* Schema.decodeUnknown(Prompt)(result[0]).pipe(
				Effect.mapError((error) => fromUnknownPromptError('decode', error))
			);

			const favoriteEntityIds = yield* Effect.tryPromise<string[], PromptError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PROMPT),
				catch: (error) => fromUnknownPromptError('getById.favoriteIds', error),
			});

			return favoriteService.applyFavoriteProjection(validated, favoriteEntityIds);
		});

	const getAll = (options: GetPromptsOptions = {}): Effect.Effect<GetPromptsResult, PromptError> =>
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], PromptError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.PROMPT),
				catch: (error) => fromUnknownPromptError('getAll.favoriteIds', error),
			});

			const conditions = [];
			if (search) conditions.push(like(prompts.name, `%${search}%`));
			if (category) conditions.push(eq(prompts.category, category));
			if (onlyFavorites) {
				if (favoriteEntityIds.length === 0) {
					return {
						prompts: [],
						total: 0,
						limit,
						offset,
					};
				}

				conditions.push(inArray(prompts.id, favoriteEntityIds));
			}

			const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
			const orderByColumn = (prompts as any)[orderBy] || prompts.createdAt;
			const orderByClause = orderDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

			const [data, totalResult] = yield* Effect.all([
				Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
					try: () =>
						db
							.select()
							.from(prompts)
							.where(whereClause as any)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
					catch: (error) => fromUnknownPromptError('getAll', error),
				}),
				Effect.tryPromise<Array<{ count: number }>, PromptError>({
					try: () =>
						db
							.select({ count: count() })
							.from(prompts)
							.where(whereClause as any),
					catch: (error) => fromUnknownPromptError('getCount', error),
				}),
			]);

			const normalizedPrompts = favoriteService.applyFavoriteProjectionMany(data, favoriteEntityIds) as PromptWithStats[];

			return {
				prompts: normalizedPrompts,
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: PromptCreateInput): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			const restInput = input;

			const existing = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () => db.select().from(prompts).where(eq(prompts.name, restInput.name)).limit(1),
				catch: (error) => fromUnknownPromptError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new PromptNameConflict({ name: restInput.name }));
			}

			const readableId = generateReadableId('prompt', restInput.name, 1);

			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () =>
					db
						.insert(prompts)
						.values({
							id: readableId,
							name: restInput.name,
							description: restInput.description ?? null,
							emoji: restInput.emoji ?? null,
							color: restInput.color ?? null,
							category: restInput.category ?? null,
							featuredImage: restInput.featuredImage ?? null,
							filters: restInput.filters ?? null,
							isFavorite: false,
							metadata: restInput.metadata ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownPromptError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			return yield* getById(readableId);
		});

	const update = (id: string, input: PromptUpdateInput): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const restInput = input;

			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () =>
					db
						.update(prompts)
						.set({
							...(restInput.name !== undefined && { name: restInput.name }),
							...(restInput.description !== undefined && { description: restInput.description }),
							...(restInput.emoji !== undefined && { emoji: restInput.emoji }),
							...(restInput.color !== undefined && { color: restInput.color }),
							...(restInput.category !== undefined && { category: restInput.category }),
							...(restInput.featuredImage !== undefined && { featuredImage: restInput.featuredImage }),
							...(restInput.filters !== undefined && { filters: restInput.filters }),
							...(restInput.metadata !== undefined && { metadata: restInput.metadata }),
							updatedAt: new Date(),
						})
						.where(eq(prompts.id, id))
						.returning(),
				catch: (error) => fromUnknownPromptError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, PromptError> =>
		Effect.gen(function* () {
			const relationCount = yield* Effect.tryPromise<Array<{ count: number }>, PromptError>({
				try: () => db.select({ count: count() }).from(imagePrompts).where(eq(imagePrompts.B, id)),
				catch: (error) => fromUnknownPromptError('checkRelations', error),
			});

			if ((relationCount[0]?.count ?? 0) > 0) {
				return yield* Effect.fail(
					new PromptHasRelationsError({
						promptId: id,
						relationCount: relationCount[0].count,
						relations: ['images'],
					})
				);
			}

			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () => db.delete(prompts).where(eq(prompts.id, id)).returning(),
				catch: (error) => fromUnknownPromptError('delete', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptNotFound({ promptId: id }));
			}
		});

	const toggleFavorite = (id: string): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, PromptError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.PROMPT, id),
				catch: (error) => fromUnknownPromptError('toggleFavorite.isFavorite', error),
			});
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.PROMPT, id, newFavoriteStatus),
				catch: (error) => fromUnknownPromptError('toggleFavorite.set', error),
			});

			return yield* getById(id);
		});

	const getImages = (id: string): Effect.Effect<any[], PromptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const result = yield* Effect.tryPromise<Array<{ image: typeof images.$inferSelect }>, PromptError>({
				try: () =>
					db
						.select({ image: images })
						.from(imagePrompts)
						.innerJoin(images, eq(imagePrompts.A, images.id))
						.where(eq(imagePrompts.B, id)),
				catch: (error) => fromUnknownPromptError('getImages', error),
			});
			return result.map((r) => r.image);
		});

	const addImage = (id: string, imageId: string): Effect.Effect<void, PromptError> =>
		Effect.gen(function* () {
			yield* getById(id);
			yield* Effect.tryPromise({
				try: () => db.insert(imagePrompts).values({ A: imageId, B: id }),
				catch: (error) => fromUnknownPromptError('addImage', error),
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

export const PromptServiceLive = Layer.effect(PromptService, Effect.succeed(make()));
