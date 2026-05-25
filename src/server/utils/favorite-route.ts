import { Effect } from 'effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';

function normalizeSortValue(value: unknown): number | string {
	if (value instanceof Date) {
		return value.getTime();
	}

	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		return value.toLowerCase();
	}

	if (typeof value === 'boolean') {
		return value ? 1 : 0;
	}

	if (value && typeof value === 'object' && 'getTime' in value && typeof value.getTime === 'function') {
		return value.getTime();
	}

	return 0;
}

function sortEntitiesByField<T extends object>(
	items: T[],
	sortBy: string,
	sortOrder: 'asc' | 'desc'
): T[] {
	const direction = sortOrder === 'asc' ? 1 : -1;

	return [...items].sort((left, right) => {
		const leftValue = normalizeSortValue((left as Record<string, unknown>)[sortBy]);
		const rightValue = normalizeSortValue((right as Record<string, unknown>)[sortBy]);

		if (leftValue < rightValue) {
			return -1 * direction;
		}

		if (leftValue > rightValue) {
			return 1 * direction;
		}

		return 0;
	});
}

export interface ListFavoriteEntitiesOptions<
	TEntity extends object,
	TResult extends object = TEntity,
> {
	entityType: FavoriteEntityType;
	getEntityById: (entityId: string) => Effect.Effect<TEntity, unknown, never>;
	limit: number;
	mapEntity?: (entity: TEntity) => TResult;
	offset: number;
	search?: string;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

export interface ListFavoriteEntitiesResult<TResult extends object> {
	data: TResult[];
	total: number;
}

export function listFavoriteEntities<
	TEntity extends object,
	TResult extends object = TEntity,
>(
	options: ListFavoriteEntitiesOptions<TEntity, TResult>
): Effect.Effect<ListFavoriteEntitiesResult<TResult>, Error, never> {
	return Effect.gen(function* () {
		const counts = yield* Effect.tryPromise({
			try: () => favoriteService.getCountsByType(),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const totalFavorites = counts[options.entityType] ?? 0;

		if (totalFavorites === 0) {
			return { data: [], total: 0 };
		}

		const favoriteResult = yield* Effect.tryPromise({
			try: () =>
				favoriteService.list({
					entityType: options.entityType,
					search: options.search,
					limit: totalFavorites,
					offset: 0,
					sortBy: 'addedAt',
					sortOrder: 'desc',
				}),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const favoriteEntities = yield* Effect.all(
			favoriteResult.items.map((favorite) =>
				options.getEntityById(favorite.entityId).pipe(
					Effect.map((entity) => (options.mapEntity ? options.mapEntity(entity) : (entity as unknown as TResult))),
					Effect.catchAll(() => Effect.succeed(null))
				)
			)
		);

		const data = sortEntitiesByField(
			favoriteEntities.flatMap((entity) => (entity ? [entity] : [])),
			options.sortBy,
			options.sortOrder
		).slice(options.offset, options.offset + options.limit);

		return {
			data,
			total: favoriteResult.total,
		};
	});
}