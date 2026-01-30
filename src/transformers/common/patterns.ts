/**
 * @file Common Transformation Patterns
 * @module transformers/common
 * @description Patrones reutilizables para transformaciones DB → DTO → View usando Effect Schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';

/**
 * Error de transformación
 */
export interface TransformError {
	_tag: 'TransformError';
	message: string;
	cause?: unknown;
	timestamp: Date;
}

/**
 * Crea un TransformError
 */
export const createTransformError = (message: string, cause?: unknown): TransformError => ({
	_tag: 'TransformError',
	message,
	cause,
	timestamp: new Date(),
});

/**
 * Patrón: DB → DTO
 * Transforma un objeto raw de DB a un DTO validado usando schema
 *
 * @example
 * ```typescript
 * const tagDTO = yield* dbToDTO(Tag)(rawTagFromDB);
 * ```
 */
export const dbToDTO = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return (raw: unknown): Effect.Effect<A, TransformError> =>
		decode(raw).pipe(Effect.mapError((error) => createTransformError('Failed to transform DB to DTO', error)));
};

/**
 * Patrón: DTO → View
 * Enriquece un DTO con campos calculados o formateo para UI
 *
 * @example
 * ```typescript
 * const tagView = dtoToView(tagDTO, (tag) => ({
 *   ...tag,
 *   displayName: tag.emoji ? `${tag.emoji} ${tag.name}` : tag.name,
 *   colorRgb: hexToRgb(tag.color),
 * }));
 * ```
 */
export const dtoToView = <DTO, View>(dto: DTO, enrichFn: (dto: DTO) => View): View => {
	return enrichFn(dto);
};

/**
 * Patrón: Array DB → Array DTO
 * Transforma un array de objetos raw de DB a DTOs validados
 *
 * @example
 * ```typescript
 * const tagDTOs = yield* dbArrayToDTO(Tag)(rawTagsFromDB);
 * ```
 */
export const dbArrayToDTO = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(Schema.Array(schema));

	return (rawArray: unknown): Effect.Effect<readonly A[], TransformError> =>
		decode(rawArray).pipe(
			Effect.mapError((error) => createTransformError('Failed to transform DB array to DTO array', error))
		);
};

/**
 * Patrón: Partial Update
 * Transforma un update parcial validando solo campos presentes
 *
 * @example
 * ```typescript
 * const validated = yield* validatePartialUpdate(TagUpdate)(req.body);
 * ```
 */
export const validatePartialUpdate = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return (partial: unknown): Effect.Effect<A, TransformError> =>
		decode(partial).pipe(Effect.mapError((error) => createTransformError('Failed to validate partial update', error)));
};

/**
 * Patrón: Enrich with Stats
 * Añade estadísticas a una entidad base
 *
 * @example
 * ```typescript
 * const tagWithStats = enrichWithStats(tag, {
 *   totalRelations: 10,
 *   usageDiversity: 0.5,
 *   popularity: 25,
 * });
 * ```
 */
export const enrichWithStats = <Entity, Stats>(entity: Entity, stats: Stats): Entity & { stats: Stats } => ({
	...entity,
	stats,
});

/**
 * Patrón: Enrich with Counts
 * Añade conteos de relaciones a una entidad
 *
 * @example
 * ```typescript
 * const tagWithCounts = enrichWithCounts(tag, {
 *   images: 5,
 *   videos: 3,
 *   documents: 2,
 * });
 * ```
 */
export const enrichWithCounts = <Entity, Counts>(entity: Entity, counts: Counts): Entity & { _count: Counts } => ({
	...entity,
	_count: counts,
});

/**
 * Patrón: Safe Parse
 * Intenta parsear, retorna undefined si falla (útil para datos opcionales)
 *
 * @example
 * ```typescript
 * const config = safeParse(ConfigSchema)(rawConfig) ?? defaultConfig;
 * ```
 */
export const safeParse = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return (value: unknown): A | undefined => {
		const result = Effect.runSync(Effect.either(decode(value)));
		return result._tag === 'Right' ? result.right : undefined;
	};
};

/**
 * Patrón: Transform Pipeline
 * Encadena múltiples transformaciones
 *
 * @example
 * ```typescript
 * const result = yield* transformPipeline(
 *   Effect.succeed(rawData),
 *   dbToDTO(Tag),
 *   (dto) => Effect.succeed(dtoToView(dto, enrichTagView))
 * );
 * ```
 */
export const transformPipeline = (
	...transforms: Array<(prev: any) => Effect.Effect<any, TransformError>>
): ((input: Effect.Effect<any, TransformError>) => Effect.Effect<any, TransformError>) => {
	return (input: Effect.Effect<any, TransformError>) =>
		transforms.reduce((acc, transform) => acc.pipe(Effect.flatMap(transform)), input);
};

/**
 * Patrón: Batch Transform
 * Transforma múltiples items en paralelo
 *
 * @example
 * ```typescript
 * const results = yield* batchTransform(rawItems, dbToDTO(Tag));
 * ```
 */
export const batchTransform = <A, B>(
	items: A[],
	transform: (item: A) => Effect.Effect<B, TransformError>
): Effect.Effect<B[], TransformError> => {
	return Effect.all(items.map(transform), { concurrency: 'unbounded' }).pipe(
		Effect.mapError((error) => createTransformError('Failed to transform batch', error))
	);
};

/**
 * Patrón: Default Values
 * Aplica valores por defecto a campos undefined
 *
 * @example
 * ```typescript
 * const tagWithDefaults = applyDefaults(partialTag, {
 *   color: '#6B7280',
 *   emoji: '🏷️',
 *   isFavorite: false,
 * });
 * ```
 */
export const applyDefaults = <T extends Record<string, any>>(obj: Partial<T>, defaults: Partial<T>): T => {
	return { ...defaults, ...obj } as T;
};

/**
 * Patrón: Pick Fields
 * Selecciona solo ciertos campos de un objeto (projection)
 *
 * @example
 * ```typescript
 * const lightTag = pickFields(fullTag, ['id', 'name', 'color']);
 * ```
 */
export const pickFields = <T, K extends keyof T>(obj: T, fields: K[]): Pick<T, K> => {
	const result = {} as Pick<T, K>;
	for (const field of fields) {
		result[field] = obj[field];
	}
	return result;
};

/**
 * Patrón: Omit Fields
 * Omite ciertos campos de un objeto
 *
 * @example
 * ```typescript
 * const publicTag = omitFields(tag, ['createdAt', 'updatedAt']);
 * ```
 */
export const omitFields = <T, K extends keyof T>(obj: T, fields: K[]): Omit<T, K> => {
	const result = { ...obj };
	for (const field of fields) {
		delete result[field];
	}
	return result;
};
