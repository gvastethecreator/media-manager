/**
 * @file Album Transformer usando Effect
 * @module transformers/album/transformer.effect
 * @description Transformador Effect para la entidad Album usando @effect/schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { sql } from 'drizzle-orm';
import { Effect, Schema } from 'effect';

// ============= Type Definitions =============

/**
 * Estructura para datos de creación de álbum compatible con Drizzle
 */
export interface CreateAlbumData {
	color?: string | null;
	coverImage?: string | null;
	description?: string | null;
	emoji?: string | null;
	folderId?: string | null;
	isFavorite?: boolean;
	metadata?: unknown;
	name: string;
	tags?: readonly string[];
}

/**
 * Estructura para filtros de álbum compatible con Drizzle
 */
export interface DrizzleAlbumFilters {
	createdAfter?: Date;
	createdBefore?: Date;
	description?: string;
	folderId?: string | null;
	hasCoverImage?: boolean;
	hasDescription?: boolean;
	isFavorite?: boolean;
	maxImages?: number;
	minImages?: number;
	name?: string;
	tags?: readonly string[];
}

// ============= Error Types =============

export class AlbumTransformError extends Schema.TaggedError<AlbumTransformError>()('AlbumTransformError', {
	message: Schema.String,
	cause: Schema.optional(Schema.Unknown),
}) {}

// ============= Schemas =============

/**
 * Schema para CreateAlbumData de entrada
 */
export const CreateAlbumDataSchema = Schema.Struct({
	name: Schema.String,
	description: Schema.NullOr(Schema.String),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	coverImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.NullOr(Schema.Unknown),
	folderId: Schema.NullOr(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
});

export type CreateAlbumDataType = Schema.Schema.Type<typeof CreateAlbumDataSchema>;

/**
 * Schema para DrizzleCreateAlbumData (salida para DB)
 */
export const DrizzleCreateAlbumDataSchema = Schema.Struct({
	name: Schema.String,
	description: Schema.NullOr(Schema.String),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	coverImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	totalImages: Schema.Number,
	totalVideos: Schema.Number,
	totalSize: Schema.Number,
	metadata: Schema.NullOr(Schema.Unknown),
	folderId: Schema.NullOr(Schema.String),
});

export type DrizzleCreateAlbumDataType = Schema.Schema.Type<typeof DrizzleCreateAlbumDataSchema>;

/**
 * Schema para filtros de Album
 */
export const AlbumFiltersSchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	isFavorite: Schema.optional(Schema.Boolean),
	folderId: Schema.optional(Schema.String),
	hasCoverImage: Schema.optional(Schema.Boolean),
	hasDescription: Schema.optional(Schema.Boolean),
	minImages: Schema.optional(Schema.Number),
	maxImages: Schema.optional(Schema.Number),
	tags: Schema.optional(Schema.Array(Schema.String)),
	createdAfter: Schema.optional(Schema.DateFromSelf),
	createdBefore: Schema.optional(Schema.DateFromSelf),
});

export type AlbumFiltersType = Schema.Schema.Type<typeof AlbumFiltersSchema>;

// ============= Pure Transformation Functions =============

/**
 * Mapea CreateAlbumData a formato Drizzle (función pura)
 */
function mapCreateAlbumDataToDrizzlePure(data: CreateAlbumData): {
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	coverImage: string | null;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	metadata: unknown;
	folderId: string | null;
} {
	return {
		name: data.name,
		description: data.description ?? null,
		emoji: data.emoji ?? null,
		color: data.color ?? null,
		coverImage: data.coverImage ?? null,
		isFavorite: data.isFavorite ?? false,
		totalImages: 0,
		totalVideos: 0,
		totalSize: 0,
		metadata: data.metadata ?? null,
		folderId: data.folderId ?? null,
	};
}

/**
 * Mapea filtros de Album a condiciones Drizzle (función pura)
 * Retorna un objeto con las condiciones que puede usarse con Drizzle
 */
function mapAlbumFiltersToDrizzlePure(filters: DrizzleAlbumFilters): {
	conditions: any[];
	hasFilters: boolean;
} {
	const conditions: any[] = [];

	if (filters.name !== undefined) {
		conditions.push(sql`name LIKE ${`%${filters.name}%`}`);
	}

	if (filters.description !== undefined) {
		conditions.push(sql`description LIKE ${`%${filters.description}%`}`);
	}

	if (filters.isFavorite !== undefined) {
		conditions.push(sql`is_favorite = ${filters.isFavorite ? 1 : 0}`);
	}

	if (filters.folderId !== undefined) {
		if (filters.folderId === null) {
			conditions.push(sql`folder_id IS NULL`);
		} else {
			conditions.push(sql`folder_id = ${filters.folderId}`);
		}
	}

	if (filters.hasCoverImage !== undefined) {
		if (filters.hasCoverImage) {
			conditions.push(sql`cover_image IS NOT NULL`);
		} else {
			conditions.push(sql`cover_image IS NULL`);
		}
	}

	if (filters.hasDescription !== undefined) {
		if (filters.hasDescription) {
			conditions.push(sql`description IS NOT NULL AND description != ''`);
		} else {
			conditions.push(sql`description IS NULL OR description = ''`);
		}
	}

	if (filters.minImages !== undefined) {
		conditions.push(sql`total_images >= ${filters.minImages}`);
	}

	if (filters.maxImages !== undefined) {
		conditions.push(sql`total_images <= ${filters.maxImages}`);
	}

	if (filters.createdAfter !== undefined) {
		conditions.push(sql`created_at >= ${filters.createdAfter.toISOString()}`);
	}

	if (filters.createdBefore !== undefined) {
		conditions.push(sql`created_at <= ${filters.createdBefore.toISOString()}`);
	}

	return {
		conditions,
		hasFilters: conditions.length > 0,
	};
}

// ============= Effect Transformers =============

/**
 * Transforma CreateAlbumData a DrizzleCreateAlbumData usando Effect
 *
 * @example
 * ```typescript
 * const drizzleData = yield* transformCreateAlbumData(inputData);
 * ```
 */
export const transformCreateAlbumData = (
	data: CreateAlbumData
): Effect.Effect<DrizzleCreateAlbumDataType, AlbumTransformError> =>
	Effect.gen(function* () {
		try {
			const mapped = mapCreateAlbumDataToDrizzlePure(data);

			// Validar usando schema
			const decode = Schema.decodeUnknown(DrizzleCreateAlbumDataSchema);
			return yield* decode(mapped).pipe(
				Effect.mapError(
					(error) =>
						new AlbumTransformError({
							message: 'Failed to transform CreateAlbumData to Drizzle format',
							cause: error,
						})
				)
			);
		} catch (error) {
			return yield* Effect.fail(
				new AlbumTransformError({
					message: 'Unexpected error transforming album data',
					cause: error,
				})
			);
		}
	});

/**
 * Valida y transforma CreateAlbumData con validación de schema de entrada
 *
 * @example
 * ```typescript
 * const validated = yield* validateAndTransformCreateAlbumData(rawInput);
 * ```
 */
export const validateAndTransformCreateAlbumData = (
	raw: unknown
): Effect.Effect<DrizzleCreateAlbumDataType, AlbumTransformError> =>
	Effect.gen(function* () {
		// 1. Validar entrada con schema
		const decode = Schema.decodeUnknown(CreateAlbumDataSchema);
		const validated = yield* decode(raw).pipe(
			Effect.mapError(
				(error) =>
					new AlbumTransformError({
						message: 'Invalid CreateAlbumData input',
						cause: error,
					})
			)
		);

		// 2. Transformar a Drizzle format
		return yield* transformCreateAlbumData(validated);
	});

/**
 * Transforma filtros de Album a condiciones Drizzle usando Effect
 *
 * @example
 * ```typescript
 * const filterResult = yield* transformAlbumFilters(filters);
 * // filterResult = { conditions: [...], hasFilters: true }
 * ```
 */
export const transformAlbumFilters = (
	filters: DrizzleAlbumFilters
): Effect.Effect<
	{
		conditions: any[];
		hasFilters: boolean;
	},
	AlbumTransformError
> =>
	Effect.gen(function* () {
		try {
			return mapAlbumFiltersToDrizzlePure(filters);
		} catch (error) {
			return yield* Effect.fail(
				new AlbumTransformError({
					message: 'Failed to transform album filters',
					cause: error,
				})
			);
		}
	});

/**
 * Valida filtros con schema y transforma a Drizzle
 *
 * @example
 * ```typescript
 * const validated = yield* validateAndTransformAlbumFilters(rawFilters);
 * ```
 */
export const validateAndTransformAlbumFilters = (
	raw: unknown
): Effect.Effect<
	{
		conditions: any[];
		hasFilters: boolean;
	},
	AlbumTransformError
> =>
	Effect.gen(function* () {
		// Validar entrada
		const decode = Schema.decodeUnknown(AlbumFiltersSchema);
		const validated = yield* decode(raw).pipe(
			Effect.mapError(
				(error) =>
					new AlbumTransformError({
						message: 'Invalid album filters',
						cause: error,
					})
			)
		);

		// Transformar
		return yield* transformAlbumFilters(validated);
	});

// ============= Batch Operations =============

/**
 * Transforma múltiples CreateAlbumData en batch
 *
 * @example
 * ```typescript
 * const results = yield* transformCreateAlbumDataBatch(albumsData);
 * ```
 */
export const transformCreateAlbumDataBatch = (
	dataArray: CreateAlbumData[]
): Effect.Effect<DrizzleCreateAlbumDataType[], AlbumTransformError> =>
	Effect.all(dataArray.map(transformCreateAlbumData), { concurrency: 'unbounded' });

/**
 * Transforma batch con manejo de errores individual
 *
 * @example
 * ```typescript
 * const results = yield* transformCreateAlbumDataBatchSafe(albumsData);
 * // results = { succeeded: [...], failed: [...] }
 * ```
 */
export const transformCreateAlbumDataBatchSafe = (
	dataArray: CreateAlbumData[]
): Effect.Effect<
	{
		succeeded: DrizzleCreateAlbumDataType[];
		failed: Array<{ data: CreateAlbumData; error: string }>;
	},
	never
> =>
	Effect.gen(function* () {
		const results = yield* Effect.all(
			dataArray.map((data) =>
				transformCreateAlbumData(data).pipe(
					Effect.either,
					Effect.map((either) => ({ data, result: either }))
				)
			),
			{ concurrency: 'unbounded' }
		);

		const succeeded: DrizzleCreateAlbumDataType[] = [];
		const failed: Array<{ data: CreateAlbumData; error: string }> = [];

		for (const { data, result } of results) {
			if (result._tag === 'Right') {
				succeeded.push(result.right);
			} else {
				failed.push({
					data,
					error: result.left.message,
				});
			}
		}

		return { succeeded, failed };
	});

// ============= Export Helpers (Non-Effect para compatibilidad) =============

/**
 * Wrapper no-Effect para compatibilidad con código existente
 */
export function mapCreateAlbumDataToDrizzle(data: CreateAlbumData) {
	return mapCreateAlbumDataToDrizzlePure(data);
}

/**
 * Wrapper no-Effect para filtros
 */
export function mapAlbumFiltersToDrizzle(filters: DrizzleAlbumFilters) {
	return mapAlbumFiltersToDrizzlePure(filters);
}

// ============= Export Pure Functions =============

export { mapCreateAlbumDataToDrizzlePure, mapAlbumFiltersToDrizzlePure };
