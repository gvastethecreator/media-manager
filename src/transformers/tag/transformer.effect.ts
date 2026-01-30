/**
 * @file Tag Transformer usando Effect
 * @module transformers/tag/transformer.effect
 * @description Transformador Effect para la entidad Tag usando @effect/schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Effect, Schema } from 'effect';
import { createDefaultEntityStats } from '@/lib/utils';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import type { TagBase, TagStatistics, TagWithStats } from '@/types/entities/tag';

// ============= Error Types =============

export class TagTransformError extends Schema.TaggedError<TagTransformError>()('TagTransformError', {
	message: Schema.String,
	cause: Schema.optional(Schema.Unknown),
}) {}

// ============= Schemas =============

/**
 * Schema para Tag raw de DB con counts opcionales
 */
export const TagRawSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	shortcut: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	_count: Schema.optional(
		Schema.Struct({
			images: Schema.optional(Schema.Number),
			videos: Schema.optional(Schema.Number),
			albums: Schema.optional(Schema.Number),
			collections: Schema.optional(Schema.Number),
			characters: Schema.optional(Schema.Number),
			places: Schema.optional(Schema.Number),
			worldItems: Schema.optional(Schema.Number),
			concepts: Schema.optional(Schema.Number),
			prompts: Schema.optional(Schema.Number),
			notes: Schema.optional(Schema.Number),
			wildcards: Schema.optional(Schema.Number),
			properties: Schema.optional(Schema.Number),
			groups: Schema.optional(Schema.Number),
		})
	),
});

export type TagRaw = Schema.Schema.Type<typeof TagRawSchema>;

/**
 * Schema para TagWithStats completo
 */
export const TagWithStatsSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	shortcut: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	entityType: Schema.Literal('tag'),
	stats: Schema.Unknown, // TagStatistics es complejo, usar Unknown por ahora
	statistics: Schema.Unknown,
	_count: Schema.Unknown,
});

export type TagWithStatsType = Schema.Schema.Type<typeof TagWithStatsSchema>;

// ============= Pure Functions =============

/**
 * Calcula estadísticas de un tag (función pura)
 */
function computeTagStats(
	baseTag: TagBase & {
		_count?: {
			images?: number;
			videos?: number;
			albums?: number;
			collections?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			concepts?: number;
			prompts?: number;
			notes?: number;
			wildcards?: number;
			properties?: number;
			groups?: number;
		};
	}
): TagStatistics {
	const counts = baseTag._count ?? {};
	const countValues = Object.values(counts) as number[];
	const totalRelations = countValues.reduce((sum, n) => sum + (n || 0), 0);
	const usageDiversity = countValues.filter((n) => (n || 0) > 0).length;
	const denominator = Math.max(Object.keys(counts).length || 0, 1);
	const popularity = totalRelations * (usageDiversity / denominator);

	const completenessInput = {
		name: baseTag.name,
		description: baseTag.description,
		category: baseTag.category,
	} as Record<string, unknown>;
	const completenessScore = calculateCompleteness(completenessInput, ['name', 'description', 'category']);

	return {
		...createDefaultEntityStats({ type: 'tag' }),
		imageCount: counts.images || 0,
		videoCount: counts.videos || 0,
		albumCount: counts.albums || 0,
		collectionCount: counts.collections || 0,
		characterCount: counts.characters || 0,
		placeCount: counts.places || 0,
		worldItemCount: counts.worldItems || 0,
		conceptCount: counts.concepts || 0,
		promptCount: counts.prompts || 0,
		noteCount: counts.notes || 0,
		wildcardCount: counts.wildcards || 0,
		propertyCount: counts.properties || 0,
		groupCount: counts.groups || 0,
		tagCount: 1,
		totalItems: totalRelations,
		totalAssociations: totalRelations,
		lastUpdated: new Date(),
		totalRelations,
		usageDiversity,
		popularity,
		completenessScore,
	};
}

// ============= Effect Transformers =============

/**
 * Transforma TagRaw a TagWithStats usando Effect
 *
 * @example
 * ```typescript
 * const tagWithStats = yield* transformTagToWithStats(rawTag);
 * ```
 */
export const transformTagToWithStats = (
	baseTag: TagBase & {
		_count?: {
			images?: number;
			videos?: number;
			albums?: number;
			collections?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			concepts?: number;
			prompts?: number;
			notes?: number;
			wildcards?: number;
			properties?: number;
			groups?: number;
		};
	}
): Effect.Effect<TagWithStats, TagTransformError> =>
	Effect.gen(function* () {
		try {
			const statistics: TagStatistics = computeTagStats(baseTag);

			const result: TagWithStats = {
				...baseTag,
				entityType: 'tag',
				stats: statistics,
				statistics,
				_count: baseTag._count || {},
			};

			return result;
		} catch (error) {
			return yield* Effect.fail(
				new TagTransformError({
					message: 'Failed to transform tag to TagWithStats',
					cause: error,
				})
			);
		}
	});

/**
 * Transforma array de TagRaw a TagWithStats[]
 *
 * @example
 * ```typescript
 * const tagsWithStats = yield* transformTagsToWithStats(rawTags);
 * ```
 */
export const transformTagsToWithStats = (
	tags: Array<TagBase & { _count?: any }>
): Effect.Effect<TagWithStats[], TagTransformError> =>
	Effect.all(tags.map(transformTagToWithStats), { concurrency: 'unbounded' });

/**
 * Valida y transforma un tag raw usando schema
 *
 * @example
 * ```typescript
 * const validated = yield* validateAndTransformTag(rawData);
 * ```
 */
export const validateAndTransformTag = (raw: unknown): Effect.Effect<TagWithStats, TagTransformError> =>
	Effect.gen(function* () {
		// Decode usando schema
		const decode = Schema.decodeUnknown(TagRawSchema);
		const validated = yield* decode(raw).pipe(
			Effect.mapError(
				(error) =>
					new TagTransformError({
						message: 'Tag validation failed',
						cause: error,
					})
			)
		);

		// Transform to TagWithStats
		return yield* transformTagToWithStats(validated);
	});

/**
 * Helper no-Effect para compatibilidad con código existente
 * Wrapper sobre la versión Effect
 */
export function toTagWithStats(baseTag: TagBase & { _count?: any }): TagWithStats {
	const statistics: TagStatistics = computeTagStats(baseTag);

	return {
		...baseTag,
		entityType: 'tag',
		stats: statistics,
		statistics,
		_count: baseTag._count || {},
	};
}

// ============= Batch Operations =============

/**
 * Transforma tags en batch con manejo de errores individual
 *
 * @example
 * ```typescript
 * const results = yield* transformTagsBatch(rawTags);
 * // results = { succeeded: [...], failed: [...] }
 * ```
 */
export const transformTagsBatch = (
	tags: Array<TagBase & { _count?: any }>
): Effect.Effect<
	{
		succeeded: TagWithStats[];
		failed: Array<{ tag: TagBase; error: string }>;
	},
	never
> =>
	Effect.gen(function* () {
		const results = yield* Effect.all(
			tags.map((tag) =>
				transformTagToWithStats(tag).pipe(
					Effect.either,
					Effect.map((either) => ({ tag, result: either }))
				)
			),
			{ concurrency: 'unbounded' }
		);

		const succeeded: TagWithStats[] = [];
		const failed: Array<{ tag: TagBase; error: string }> = [];

		for (const { tag, result } of results) {
			if (result._tag === 'Right') {
				succeeded.push(result.right);
			} else {
				failed.push({
					tag,
					error: result.left.message,
				});
			}
		}

		return { succeeded, failed };
	});

// ============= Stats Helpers =============

/**
 * Extrae solo las estadísticas de un tag
 */
export const extractTagStats = (tag: TagBase & { _count?: any }): Effect.Effect<TagStatistics, never> =>
	Effect.succeed(computeTagStats(tag));

/**
 * Combina estadísticas de múltiples tags
 */
export const aggregateTagStats = (tags: TagWithStats[]): Effect.Effect<TagStatistics, never> =>
	Effect.gen(function* () {
		const totalImages = tags.reduce((sum, t) => sum + (t.stats.imageCount || 0), 0);
		const totalVideos = tags.reduce((sum, t) => sum + (t.stats.videoCount || 0), 0);
		const totalAlbums = tags.reduce((sum, t) => sum + (t.stats.albumCount || 0), 0);
		const totalRelations = tags.reduce((sum, t) => sum + (t.stats.totalRelations || 0), 0);

		return {
			...createDefaultEntityStats({ type: 'tag' }),
			imageCount: totalImages,
			videoCount: totalVideos,
			albumCount: totalAlbums,
			totalRelations,
			tagCount: tags.length,
			totalItems: totalRelations,
			totalAssociations: totalRelations,
			lastUpdated: new Date(),
			usageDiversity: 0,
			popularity: 0,
			completenessScore: 0,
			collectionCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
		};
	});

// ============= Export Helpers =============

export { computeTagStats };
