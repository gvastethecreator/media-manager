/**
 * @file Image Transformer usando Effect
 * @module transformers/image/transformer.effect
 * @description Transformador Effect para la entidad Image usando @effect/schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Effect, Schema } from 'effect';
import { createDefaultEntityStats } from '@/lib/utils';
import type { ImageBase, ImageStatistics, ImageWithStats } from '@/types/entities/image';

// ============= Error Types =============

export class ImageTransformError extends Schema.TaggedError<ImageTransformError>()('ImageTransformError', {
	message: Schema.String,
	cause: Schema.optional(Schema.Unknown),
}) {}

// ============= Schemas =============

/**
 * Schema para Image raw de DB
 */
export const ImageRawSchema = Schema.Struct({
	id: Schema.String,
	assetId: Schema.optional(Schema.NullOr(Schema.String)),
	legacyId: Schema.optional(Schema.String),
	canonicalState: Schema.optional(Schema.Literal('canonical', 'legacy_only', 'diverged')),
	canonicalDivergences: Schema.optional(Schema.Array(Schema.String)),
	name: Schema.String,
	description: Schema.NullOr(Schema.String),
	path: Schema.String,
	hash: Schema.String,
	size: Schema.Number,
	width: Schema.Number,
	height: Schema.Number,
	metadata: Schema.NullOr(Schema.String),
	thumbnail: Schema.NullOr(Schema.String),
	thumbnailSize: Schema.NullOr(Schema.Number),
	thumbnailWidth: Schema.NullOr(Schema.Number),
	thumbnailHeight: Schema.NullOr(Schema.Number),
	thumbnailMimeType: Schema.NullOr(Schema.String),
	thumbnailError: Schema.NullOr(Schema.String),
	thumbnailErrorAt: Schema.NullOr(Schema.DateFromSelf),
	thumbnailOptimizedAt: Schema.NullOr(Schema.DateFromSelf),
	isFavorite: Schema.Boolean,
	folderId: Schema.String,
	noteId: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	addedAt: Schema.DateFromSelf,
	// Relations opcionales
	_count: Schema.optional(
		Schema.Struct({
			tags: Schema.optional(Schema.Number),
			albums: Schema.optional(Schema.Number),
			collections: Schema.optional(Schema.Number),
			characters: Schema.optional(Schema.Number),
			places: Schema.optional(Schema.Number),
			worldItems: Schema.optional(Schema.Number),
			concepts: Schema.optional(Schema.Number),
			prompts: Schema.optional(Schema.Number),
			notes: Schema.optional(Schema.Number),
			properties: Schema.optional(Schema.Number),
		})
	),
	folder: Schema.optional(
		Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			path: Schema.String,
		})
	),
});

export type ImageRaw = Schema.Schema.Type<typeof ImageRawSchema>;

type ImageTransformInput = Omit<ImageBase, 'assetId' | 'canonicalDivergences' | 'canonicalState' | 'legacyId'> &
	Partial<Pick<ImageBase, 'assetId' | 'canonicalState' | 'legacyId'>> & {
		canonicalDivergences?: readonly string[];
		_count?: any;
		folder?: any;
	};

/**
 * Schema para ImageSummary (vista reducida)
 */
export const ImageSummarySchema = Schema.Struct({
	id: Schema.String,
	filename: Schema.String,
	filepath: Schema.String,
	thumbnailPath: Schema.NullOr(Schema.String),
	width: Schema.NullOr(Schema.Number),
	height: Schema.NullOr(Schema.Number),
	size: Schema.Number,
	isFavorite: Schema.Boolean,
	isArchived: Schema.Boolean,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
});

export type ImageSummaryType = Schema.Schema.Type<typeof ImageSummarySchema>;

// ============= Pure Functions =============

/**
 * Calcula el aspect ratio de una imagen
 */
function computeAspectRatio(width: number, height: number): number {
	if (height === 0) return 0;
	return width / height;
}

/**
 * Completa campos default de una imagen (función pura)
 */
function mapImageToCompletePure(image: ImageTransformInput): ImageWithStats {
	const stats: ImageStatistics = {
		...createDefaultEntityStats({ type: 'image' }),
		imageCount: 1,
		videoCount: 0,
		albumCount: image._count?.albums || 0,
		collectionCount: image._count?.collections || 0,
		characterCount: image._count?.characters || 0,
		placeCount: image._count?.places || 0,
		worldItemCount: image._count?.worldItems || 0,
		conceptCount: image._count?.concepts || 0,
		promptCount: image._count?.prompts || 0,
		noteCount: image._count?.notes || 0,
		propertyCount: image._count?.properties || 0,
		tagCount: image._count?.tags || 0,
		totalItems: 1,
		totalAssociations:
			(image._count?.albums || 0) +
			(image._count?.collections || 0) +
			(image._count?.characters || 0) +
			(image._count?.places || 0) +
			(image._count?.worldItems || 0) +
			(image._count?.concepts || 0) +
			(image._count?.prompts || 0) +
			(image._count?.notes || 0) +
			(image._count?.properties || 0) +
			(image._count?.tags || 0),
		lastUpdated: new Date(),
		aspectRatio: computeAspectRatio(image.width, image.height),
	};

	return {
		...image,
		id: image.assetId ?? image.id,
		assetId: image.assetId ?? null,
		legacyId: image.legacyId ?? image.id,
		canonicalState: image.canonicalState ?? (image.assetId ? 'canonical' : 'legacy_only'),
		canonicalDivergences: [...(image.canonicalDivergences ?? [])],
		entityType: 'image' as const,
		stats,
		thumbnailUrl: image.thumbnail || '',
		fullUrl: image.path,
		_count: image._count || {},
	};
}

/**
 * Extrae solo campos summary de una imagen (función pura)
 */
function mapToImageSummaryPure(image: ImageBase): ImageSummaryType {
	return {
		id: image.id,
		filename: image.name,
		filepath: image.path,
		thumbnailPath: image.thumbnail,
		width: image.width,
		height: image.height,
		size: image.size,
		isFavorite: image.isFavorite,
		isArchived: false, // No existe en ImageBase, usar default
		createdAt: image.createdAt,
		updatedAt: image.updatedAt,
	};
}

// ============= Effect Transformers =============

/**
 * Transforma ImageBase a ImageWithStats usando Effect
 *
 * @example
 * ```typescript
 * const imageWithStats = yield* transformImageToWithStats(rawImage);
 * ```
 */
export const transformImageToWithStats = (
	image: ImageTransformInput
): Effect.Effect<ImageWithStats, ImageTransformError> =>
	Effect.gen(function* () {
		try {
			return mapImageToCompletePure(image);
		} catch (error) {
			return yield* Effect.fail(
				new ImageTransformError({
					message: 'Failed to transform image to ImageWithStats',
					cause: error,
				})
			);
		}
	});

/**
 * Transforma array de ImageBase a ImageWithStats[]
 *
 * @example
 * ```typescript
 * const imagesWithStats = yield* transformImagesToWithStats(rawImages);
 * ```
 */
export const transformImagesToWithStats = (
	images: ImageTransformInput[]
): Effect.Effect<ImageWithStats[], ImageTransformError> =>
	Effect.all(images.map(transformImageToWithStats), { concurrency: 'unbounded' });

/**
 * Transforma ImageBase a ImageSummary
 *
 * @example
 * ```typescript
 * const summary = yield* transformImageToSummary(image);
 * ```
 */
export const transformImageToSummary = (image: ImageBase): Effect.Effect<ImageSummaryType, ImageTransformError> =>
	Effect.gen(function* () {
		try {
			const mapped = mapToImageSummaryPure(image);

			// Validar usando schema
			const decode = Schema.decodeUnknown(ImageSummarySchema);
			return yield* decode(mapped).pipe(
				Effect.mapError(
					(error) =>
						new ImageTransformError({
							message: 'Failed to transform to ImageSummary',
							cause: error,
						})
				)
			);
		} catch (error) {
			return yield* Effect.fail(
				new ImageTransformError({
					message: 'Unexpected error transforming image to summary',
					cause: error,
				})
			);
		}
	});

/**
 * Transforma array de ImageBase a ImageSummary[]
 *
 * @example
 * ```typescript
 * const summaries = yield* transformImagesToSummaries(images);
 * ```
 */
export const transformImagesToSummaries = (
	images: ImageBase[]
): Effect.Effect<ImageSummaryType[], ImageTransformError> =>
	Effect.all(images.map(transformImageToSummary), { concurrency: 'unbounded' });

/**
 * Valida y transforma un image raw usando schema
 *
 * @example
 * ```typescript
 * const validated = yield* validateAndTransformImage(rawData);
 * ```
 */
export const validateAndTransformImage = (raw: unknown): Effect.Effect<ImageWithStats, ImageTransformError> =>
	Effect.gen(function* () {
		// Decode usando schema
		const decode = Schema.decodeUnknown(ImageRawSchema);
		const validated = yield* decode(raw).pipe(
			Effect.mapError(
				(error) =>
					new ImageTransformError({
						message: 'Image validation failed',
						cause: error,
					})
			)
		);

		// Transform to ImageWithStats
		return yield* transformImageToWithStats(validated);
	});

// ============= Batch Operations =============

/**
 * Transforma images en batch con manejo de errores individual
 *
 * @example
 * ```typescript
 * const results = yield* transformImagesBatch(rawImages);
 * // results = { succeeded: [...], failed: [...] }
 * ```
 */
export const transformImagesBatch = (
	images: Array<ImageBase & { _count?: any; folder?: any }>
): Effect.Effect<
	{
		succeeded: ImageWithStats[];
		failed: Array<{ image: ImageBase; error: string }>;
	},
	never
> =>
	Effect.gen(function* () {
		const results = yield* Effect.all(
			images.map((image) =>
				transformImageToWithStats(image).pipe(
					Effect.either,
					Effect.map((either) => ({ image, result: either }))
				)
			),
			{ concurrency: 'unbounded' }
		);

		const succeeded: ImageWithStats[] = [];
		const failed: Array<{ image: ImageBase; error: string }> = [];

		for (const { image, result } of results) {
			if (result._tag === 'Right') {
				succeeded.push(result.right);
			} else {
				failed.push({
					image,
					error: result.left.message,
				});
			}
		}

		return { succeeded, failed };
	});

// ============= Stats Helpers =============

/**
 * Extrae solo las estadísticas de una imagen
 */
export const extractImageStats = (image: ImageBase & { _count?: any }): Effect.Effect<ImageStatistics, never> =>
	Effect.succeed(mapImageToCompletePure(image).stats);

/**
 * Combina estadísticas de múltiples imágenes
 */
export const aggregateImageStats = (images: ImageWithStats[]): Effect.Effect<ImageStatistics, never> =>
	Effect.gen(function* () {
		const totalTags = images.reduce((sum, img) => sum + (img._count?.tags || 0), 0);
		const totalAlbums = images.reduce((sum, img) => sum + (img._count?.albums || 0), 0);
		const avgAspectRatio =
			images.length > 0 ? images.reduce((sum, img) => sum + img.stats.aspectRatio, 0) / images.length : 0;

		return {
			...createDefaultEntityStats({ type: 'image' }),
			imageCount: images.length,
			videoCount: 0,
			albumCount: totalAlbums,
			tagCount: totalTags,
			totalItems: images.length,
			totalAssociations: totalTags + totalAlbums,
			lastUpdated: new Date(),
			aspectRatio: avgAspectRatio,
			collectionCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			propertyCount: 0,
		};
	});

// ============= Export Helpers (Non-Effect para compatibilidad) =============

/**
 * Wrapper no-Effect para compatibilidad con código existente
 */
export function mapImageToComplete(image: ImageBase & { _count?: any; folder?: any }): ImageWithStats {
	return mapImageToCompletePure(image);
}

/**
 * Wrapper no-Effect para summary
 */
export function mapToImageSummary(image: ImageBase) {
	return mapToImageSummaryPure(image);
}

/**
 * Wrapper no-Effect para summaries batch
 */
export function mapToImageSummaries(images: ImageBase[]) {
	return images.map(mapToImageSummaryPure);
}

// ============= Export Pure Functions =============

export { mapImageToCompletePure, mapToImageSummaryPure, computeAspectRatio };
