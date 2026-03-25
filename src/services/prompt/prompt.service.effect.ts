/**
 * @file PromptService implementado con Effect
 * @module services/prompt/prompt.service.effect
 */

import { Schema } from '@effect/schema';
import { asc, count, desc, eq, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { imagePrompts, images, prompts } from '@/lib/drizzle/schema';
import { Prompt, PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
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
			return validated as Prompt;
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

			const conditions = [];
			if (search) conditions.push(like(prompts.name, `%${search}%`));
			if (category) conditions.push(eq(prompts.category, category));
			if (onlyFavorites) conditions.push(eq(prompts.isFavorite, true));

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

			return {
				prompts: data as PromptWithStats[],
				total: totalResult[0]?.count ?? 0,
				limit,
				offset,
			};
		});

	const create = (input: PromptCreateInput): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			const existing = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () => db.select().from(prompts).where(eq(prompts.name, input.name)).limit(1),
				catch: (error) => fromUnknownPromptError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new PromptNameConflict({ name: input.name }));
			}

			const readableId = generateReadableId('prompt', input.name, 1);

			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () =>
					db
						.insert(prompts)
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
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownPromptError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptDatabaseError({ operation: 'create', message: 'No row returned' }));
			}

			return result[0] as Prompt;
		});

	const update = (id: string, input: PromptUpdateInput): Effect.Effect<Prompt, PromptError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () =>
					db
						.update(prompts)
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
							updatedAt: new Date(),
						})
						.where(eq(prompts.id, id))
						.returning(),
				catch: (error) => fromUnknownPromptError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			return result[0] as Prompt;
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
			const prompt = yield* getById(id);
			const result = yield* Effect.tryPromise<(typeof prompts.$inferSelect)[], PromptError>({
				try: () =>
					db
						.update(prompts)
						.set({ isFavorite: !prompt.isFavorite, updatedAt: new Date() })
						.where(eq(prompts.id, id))
						.returning(),
				catch: (error) => fromUnknownPromptError('toggleFavorite', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new PromptDatabaseError({ operation: 'toggleFavorite', message: 'No row returned' }));
			}
			return result[0] as Prompt;
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
