/**
 * ImageService - Effect-based implementation (Phase 6.2)
 *
 * CRUD operations for Image entity with proper error handling.
 * Follows Phase 5 lessons learned:
 * - Schema.String for UUIDs (not Schema.ID)
 * - Effect.tryPromise for all async operations
 * - Explicit error types in catch handlers
 * - Effect.catchTag for graceful error recovery
 * - Constraint documentation upfront
 *
 * CONSTRAINTS:
 * - hash: CHECK length(hash) = 64 (SHA-256)
 * - size: CHECK size >= 0 AND size <= 107,374,182,400 (100GB)
 * - dimensions: CHECK width/height > 0 AND <= 32,768
 * - path: CHECK length(path) BETWEEN 1 AND 1000
 * - folderId: NOT NULL (requires folder existence)
 * - UNIQUE (path, folderId)
 * - hash is indexed but intentionally non-unique: identical content at distinct locations is a duplicate candidate
 */

import { and, asc, count, desc, eq, inArray, notInArray, or, sql } from 'drizzle-orm';
import { Effect, Context, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import {
	assets,
	groupImages,
	imageAlbums,
	imageCharacters,
	imageCollections,
	imageConcepts,
	imageNotes,
	imagePlaces,
	imagePrompts,
	imageProperties,
	images,
	imageTags,
	imageWildcards,
	imageWorldItems,
} from '@/lib/drizzle/schema';
import { Image, ImageCreateInput, ImageUpdateInput, ImageWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	emitCommittedFavoriteChange,
	setFavoriteStateForActiveProfile,
} from '@/services/favorite/favorite-write-transaction';
import type { FavoriteWriteTransaction, FavoriteWriteResult } from '@/services/favorite/favorite-write-transaction';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	ImageDatabaseError,
	type ImageError,
	ImageHasRelationsError,
	ImageNotFound,
	ImageThumbnailError,
	ImageValidationError,
} from './image-errors.effect';
import {
	assertCanonicalImageCreateCommand,
	createCanonicalImage,
	type ImageCreateCommand,
	projectCanonicalImage,
	projectCanonicalImages,
} from './image-canonical-persistence';
import { visibleImageLifecycleCondition } from './image-lifecycle-query';
import { thumbnailService } from './image-thumbnail.service';

// Helper para crear un logger seguro que funcione en tests y producción
const createSafeLogger = (context: string) => {
	const baseLogger = serverLogger.withContext(context);
	// En tests, el mock puede no tener todas las funciones, así que las proporcionamos
	return {
		debug: baseLogger.debug?.bind(baseLogger) ?? (() => {}),
		info: baseLogger.info?.bind(baseLogger) ?? (() => {}),
		warn: baseLogger.warn?.bind(baseLogger) ?? (() => {}),
		error: baseLogger.error?.bind(baseLogger) ?? (() => {}),
	};
};

const logger = createSafeLogger('ImageService');

const getFirstRow = async <TRow>(operation: () => PromiseLike<TRow[]>): Promise<TRow | null> => {
	const rows = await operation();
	return rows[0] ?? null;
};

const stripLegacyFavoriteInput = <TInput>(input: TInput): TInput => {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return input;
	}

	const { isFavorite: _legacyIsFavorite, ...rest } = input as Record<string, unknown>;
	return rest as TInput;
};

const getImageFavoriteIds = (): Effect.Effect<string[], ImageError, never> =>
	Effect.tryPromise({
		try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.IMAGE),
		catch: (error) =>
			new ImageDatabaseError({
				operation: 'getImageFavoriteIds',
				originalError: error,
			}),
	});

const projectImage = (image: Image, favoriteEntityIds: readonly string[]): Image =>
	Image.make(favoriteService.applyFavoriteProjection(image, favoriteEntityIds));

const projectImages = (images: Image[], favoriteEntityIds: readonly string[]): Image[] =>
	images.map((image) => projectImage(image, favoriteEntityIds));

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get image by ID without stats computation (internal use)
 */
const getByIdInternal = (id: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image by ID (internal)', { id });

		const result = yield* Effect.tryPromise({
			try: async () => {
				const image = await getFirstRow<typeof images.$inferSelect>(() =>
					db.select().from(images).where(eq(images.id, id)).limit(1)
				);
				if (!image) return null;
				const projected = await projectCanonicalImage(image);
				return projected ? Image.make(projected) : null;
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getByIdInternal',
					originalError: error,
				}),
		});

		if (!result) {
			logger.warn('❌ Image not found', { id });
			return yield* Effect.fail(new ImageNotFound({ imageId: id }));
		}

		logger.info('✅ Image found (internal)', { id, name: result.name });
		return result;
	});

/**
 * Get relation counts for a single image
 */
const getRelationsCounts = (
	imageId: string
): Effect.Effect<
	{
		albumCount: number;
		collectionCount: number;
		tagCount: number;
		characterCount: number;
		placeCount: number;
		worldItemCount: number;
		conceptCount: number;
		promptCount: number;
		noteCount: number;
		wildcardCount: number;
		propertyCount: number;
		groupCount: number;
	},
	ImageError,
	never
> =>
	Effect.gen(function* () {
		logger.debug('📊 Computing relation counts', { imageId });

		const counts = yield* Effect.tryPromise({
			try: async () => {
				const [
					albumRows,
					collectionRows,
					tagRows,
					characterRows,
					placeRows,
					worldItemRows,
					conceptRows,
					promptRows,
					noteRows,
					wildcardRows,
					propertyRows,
					groupRows,
				] = await Promise.all([
					db.select({ count: count() }).from(imageAlbums).where(eq(imageAlbums.A, imageId)),
					db.select({ count: count() }).from(imageCollections).where(eq(imageCollections.A, imageId)),
					db.select({ count: count() }).from(imageTags).where(eq(imageTags.A, imageId)),
					db.select({ count: count() }).from(imageCharacters).where(eq(imageCharacters.A, imageId)),
					db.select({ count: count() }).from(imagePlaces).where(eq(imagePlaces.A, imageId)),
					db.select({ count: count() }).from(imageWorldItems).where(eq(imageWorldItems.A, imageId)),
					db.select({ count: count() }).from(imageConcepts).where(eq(imageConcepts.A, imageId)),
					db.select({ count: count() }).from(imagePrompts).where(eq(imagePrompts.A, imageId)),
					db.select({ count: count() }).from(imageNotes).where(eq(imageNotes.A, imageId)),
					db.select({ count: count() }).from(imageWildcards).where(eq(imageWildcards.A, imageId)),
					db.select({ count: count() }).from(imageProperties).where(eq(imageProperties.A, imageId)),
					db.select({ count: count() }).from(groupImages).where(eq(groupImages.B, imageId)),
				]);

				return {
					albumCount: albumRows[0]?.count ?? 0,
					collectionCount: collectionRows[0]?.count ?? 0,
					tagCount: tagRows[0]?.count ?? 0,
					characterCount: characterRows[0]?.count ?? 0,
					placeCount: placeRows[0]?.count ?? 0,
					worldItemCount: worldItemRows[0]?.count ?? 0,
					conceptCount: conceptRows[0]?.count ?? 0,
					promptCount: promptRows[0]?.count ?? 0,
					noteCount: noteRows[0]?.count ?? 0,
					wildcardCount: wildcardRows[0]?.count ?? 0,
					propertyCount: propertyRows[0]?.count ?? 0,
					groupCount: groupRows[0]?.count ?? 0,
				};
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getRelationsCounts',
					originalError: error,
				}),
		});

		logger.debug('✅ Relation counts computed', { imageId, counts });
		return counts;
	});

/**
 * Check if image has any relations before deletion
 */
const checkRelations = (
	imageId: string
): Effect.Effect<
	{
		hasRelations: boolean;
		relationCounts: {
			albums: number;
			collections: number;
			tags: number;
			characters: number;
			places: number;
			worldItems: number;
			concepts: number;
			prompts: number;
			notes: number;
			wildcards: number;
			properties: number;
			groups: number;
		};
	},
	ImageError,
	never
> =>
	Effect.gen(function* () {
		logger.debug('🔗 Checking relations', { imageId });

		const counts = yield* getRelationsCounts(imageId);

		const relationCounts = {
			albums: counts.albumCount,
			collections: counts.collectionCount,
			tags: counts.tagCount,
			characters: counts.characterCount,
			places: counts.placeCount,
			worldItems: counts.worldItemCount,
			concepts: counts.conceptCount,
			prompts: counts.promptCount,
			notes: counts.noteCount,
			wildcards: counts.wildcardCount,
			properties: counts.propertyCount,
			groups: counts.groupCount,
		};

		const hasRelations = Object.values(relationCounts).some((count) => count > 0);

		logger.debug('✅ Relations checked', {
			imageId,
			hasRelations,
			totalRelations: Object.values(relationCounts).reduce((sum, count) => sum + count, 0),
		});

		return {
			hasRelations,
			relationCounts,
		};
	});

// ============================================================================
// PUBLIC API - CRUD OPERATIONS
// ============================================================================

/**
 * Create a new image
 *
 * VALIDATIONS:
 * - Input schema validation (ImageCreateInput)
 * - Trusted canonical source validation (rootId + relativePath)
 * - Folder existence check (folderId NOT NULL)
 *
 * ERROR CASES:
 * - ImageValidationError: Invalid input data
 * - ImageDatabaseError: Database operation failed
 */
export const create = (input: ImageCreateCommand): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('➕ Creating image', { name: input.name, hash: input.hash });
		const requestedIsFavorite = input.isFavorite;
		const sanitizedInput = stripLegacyFavoriteInput(input);
		const { source, ...legacyImageInput } = sanitizedInput;

		// Validate input
		const validated = yield* Effect.try({
			try: () => ImageCreateInput.make(legacyImageInput),
			catch: (error) =>
				new ImageValidationError({
					field: 'input',
					message: String(error),
					value: legacyImageInput,
				}),
		});
		yield* Effect.try({
			try: () => assertCanonicalImageCreateCommand({ hash: validated.hash, path: validated.path, source }),
			catch: (error) =>
				new ImageValidationError({
					field: 'source',
					message: error instanceof Error ? error.message : String(error),
					value: source,
				}),
		});

		const created = yield* Effect.tryPromise({
			try: () => createCanonicalImage({ ...validated, source, isFavorite: requestedIsFavorite }),
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'create',
					originalError: error,
				}),
		});

		if (created.favoriteWrite?.changed && requestedIsFavorite !== undefined) {
			yield* Effect.tryPromise({
				try: () =>
					emitCommittedFavoriteChange(
						created.favoriteWrite!.profileId,
						FavoriteEntityType.IMAGE,
						created.entity.id,
						requestedIsFavorite
					),
				catch: (error) => new ImageDatabaseError({ operation: 'create.favoriteEvent', originalError: error }),
			});
		}

		logger.info('✅ Image created', {
			id: created.entity.id,
			name: created.entity.name,
			hash: created.entity.hash,
		});

		return yield* getById(created.entity.id);
	});

/**
 * Get image by ID (without stats)
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageDatabaseError: Database operation failed
 */
export const getById = (id: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image by ID', { id });

		const [image, favoriteEntityIds] = yield* Effect.all([getByIdInternal(id), getImageFavoriteIds()]);
		const projectedImage = projectImage(image, favoriteEntityIds);

		logger.info('✅ Image retrieved', { id, name: projectedImage.name });
		return projectedImage;
	});

/**
 * Get image by ID with relation stats computed
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageDatabaseError: Database operation failed
 */
export const getByIdWithStats = (id: string): Effect.Effect<ImageWithStats, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image by ID with stats', { id });

		const [image, stats] = yield* Effect.all([getById(id), getRelationsCounts(id)]);

		const imageWithStats = ImageWithStats.make({
			...image,
			...stats,
		});

		logger.info('✅ Image with stats retrieved', {
			id,
			name: image.name,
			totalRelations:
				stats.albumCount +
				stats.collectionCount +
				stats.tagCount +
				stats.characterCount +
				stats.placeCount +
				stats.worldItemCount +
				stats.conceptCount +
				stats.promptCount +
				stats.noteCount +
				stats.wildcardCount +
				stats.propertyCount +
				stats.groupCount,
		});

		return imageWithStats;
	});

/**
 * Get all images with optional filtering and pagination
 *
 * FILTERS:
 * - folderId: Filter by folder
 * - isFavorite: Filter by favorite status
 * - search: Search in name (case-insensitive)
 *
 * PAGINATION:
 * - offset: Number of records to skip (default: 0)
 * - limit: Maximum records to return (default: 50, max: 500)
 *
 * SORTING:
 * - sortBy: Field to sort by (default: 'createdAt')
 * - sortOrder: Sort direction ('asc' | 'desc', default: 'desc')
 *
 * ERROR CASES:
 * - ImageDatabaseError: Database operation failed
 */
export const getAll = (options?: {
	folderId?: string;
	isFavorite?: boolean;
	search?: string;
	offset?: number;
	limit?: number;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height';
	orderDirection?: 'asc' | 'desc';
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	aiEngine?: string;
	aiModel?: string;
	aiOriginDetected?: boolean;
}): Effect.Effect<
	{
		images: Image[];
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	},
	ImageError,
	never
> =>
	Effect.gen(function* () {
		const offset = options?.offset ?? 0;
		const limit = Math.min(options?.limit ?? 50, 500);
		const orderBy = options?.orderBy ?? 'createdAt';
		const orderDirection = options?.orderDirection ?? 'desc';
		const favoriteEntityIds = yield* getImageFavoriteIds();

		logger.info('📋 Getting all images', {
			folderId: options?.folderId,
			isFavorite: options?.isFavorite,
			search: options?.search,
			offset,
			limit,
			orderBy,
			orderDirection,
		});

		// Build WHERE conditions
		const conditions = [visibleImageLifecycleCondition()];

		if (options?.folderId) {
			conditions.push(eq(images.folderId, options.folderId));
		}

		if (options?.isFavorite !== undefined) {
			if (options.isFavorite) {
				if (favoriteEntityIds.length === 0) {
					return {
						images: [],
						total: 0,
						limit,
						offset,
						hasMore: false,
					};
				}

				conditions.push(inArray(images.id, favoriteEntityIds));
			} else if (favoriteEntityIds.length > 0) {
				conditions.push(notInArray(images.id, favoriteEntityIds));
			}
		}

		if (options?.search) {
			const searchPattern = `%${options.search}%`;
			conditions.push(sql`lower(${images.name}) LIKE lower(${searchPattern})`);
		}

		const whereClause = and(...conditions);

		// Get total count
		const [{ count: total }] = yield* Effect.tryPromise({
			try: async () => {
				return await db.select({ count: count() }).from(images).where(whereClause);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getAll-count',
					originalError: error,
				}),
		});

		// Get data with pagination
		const sortColumn =
			orderBy === 'name'
				? images.name
				: orderBy === 'size'
					? images.size
					: orderBy === 'width'
						? images.width
						: orderBy === 'height'
							? images.height
							: orderBy === 'updatedAt'
								? images.updatedAt
								: images.createdAt;

		const orderByClause = orderDirection === 'asc' ? sortColumn : desc(sortColumn);

		const data = yield* Effect.tryPromise({
			try: async () => {
				const results = await db
					.select()
					.from(images)
					.where(whereClause)
					.orderBy(orderByClause, asc(images.id))
					.limit(limit)
					.offset(offset);

				return projectImages(
					(await projectCanonicalImages(results)).map((row) => Image.make(row)),
					favoriteEntityIds
				);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getAll-data',
					originalError: error,
				}),
		});

		logger.info('✅ Images retrieved', {
			total,
			returned: data.length,
			offset,
			limit,
		});

		return {
			images: data,
			total,
			limit,
			offset,
			hasMore: offset + data.length < total,
		};
	});

/**
 * Update image by ID
 *
 * VALIDATIONS:
 * - Input schema validation (ImageUpdateInput)
 * - Image existence check
 *
 * NOTE: Cannot update hash, path, folder placement, source, or size/dimensions. Placement changes use the
 * authorized asset move/rename operation so Image and SourceFile remain atomic.
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageValidationError: Invalid update data
 * - ImageDatabaseError: Database operation failed
 */
export const update = (id: string, input: ImageUpdateInput): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('📝 Updating image', { id, updates: Object.keys(input) });
		const requestedIsFavorite = input.isFavorite;
		const sanitizedInput = stripLegacyFavoriteInput(input);

		// Validate input
		const validated = yield* Effect.try({
			try: () => ImageUpdateInput.make(sanitizedInput),
			catch: (error) =>
				new ImageValidationError({
					field: 'input',
					message: String(error),
					value: sanitizedInput,
				}),
		});

		// Check if image exists
		const current = yield* getByIdInternal(id);

		// Update image
		const now = new Date();
		const favoriteWrite = yield* Effect.tryPromise<FavoriteWriteResult | null, ImageError>({
			try: async () => {
				return db.transaction(async (transaction: FavoriteWriteTransaction) => {
					const updated = await transaction
						.update(images)
						.set({
							...validated,
							updatedAt: now,
						})
						.where(eq(images.id, id))
						.returning();
					if (current.assetId) {
						if (validated.name !== undefined) {
							await transaction
								.update(assets)
								.set({ title: validated.name, updatedAt: now })
								.where(eq(assets.id, current.assetId));
						}
					}
					if (updated.length === 0) throw new Error('Image no devolvió la fila actualizada.');
					return requestedIsFavorite === undefined
						? null
						: setFavoriteStateForActiveProfile(transaction, FavoriteEntityType.IMAGE, id, requestedIsFavorite);
				});
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'update',
					originalError: error,
				}),
		});

		if (favoriteWrite?.changed && requestedIsFavorite !== undefined) {
			yield* Effect.tryPromise({
				try: () =>
					emitCommittedFavoriteChange(favoriteWrite.profileId, FavoriteEntityType.IMAGE, id, requestedIsFavorite),
				catch: (error) => new ImageDatabaseError({ operation: 'update.favoriteEvent', originalError: error }),
			});
		}

		logger.info('✅ Image updated', {
			id,
			updatedFields: Object.keys(validated),
		});

		return yield* getById(id);
	});

/**
 * Delete image by ID
 *
 * VALIDATIONS:
 * - Image existence check
 * - Legacy-only rows keep the historic relation guard.
 *
 * BEHAVIOR:
 * - Canonical rows transition Asset to the restorable `deleted` tombstone and preserve specialization/source/relations.
 * - Legacy-only rows are physically deleted; force=false fails if they have relations.
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageHasRelationsError: Image has relations and force=false
 * - ImageDatabaseError: Database operation failed
 */
export const deleteById = (
	id: string,
	options?: { force?: boolean }
): Effect.Effect<{ success: boolean }, ImageError, never> =>
	Effect.gen(function* () {
		const force = options?.force ?? false;

		logger.info('🗑️ Deleting image', { id, force });

		// Check if image exists
		const current = yield* getByIdInternal(id);

		if (current.assetId) {
			yield* Effect.tryPromise({
				try: async () => {
					const [asset] = await db
						.select({ status: assets.status })
						.from(assets)
						.where(eq(assets.id, current.assetId!))
						.limit(1);
					if (!(asset && (asset.status === 'active' || asset.status === 'archived'))) {
						throw new Error('El Asset canónico no tiene un lifecycle borrable.');
					}
					const now = new Date();
					const transitioned = await db
						.update(assets)
						.set({ deletedAt: now, status: 'deleted', statusBeforeDeletion: asset.status, updatedAt: now })
						.where(and(eq(assets.id, current.assetId!), eq(assets.status, asset.status)))
						.returning({ id: assets.id });
					if (transitioned.length !== 1) throw new Error('El lifecycle de Asset cambió durante el tombstone.');
				},
				catch: (error) => new ImageDatabaseError({ operation: 'delete-tombstone', originalError: error }),
			});
			logger.info('✅ Image moved to canonical tombstone', { id });
			return { success: true };
		}

		const relationsCheck = yield* checkRelations(id);

		if (relationsCheck.hasRelations && !force) {
			logger.warn('❌ Image has relations, cannot delete without force', {
				id,
				relationCounts: relationsCheck.relationCounts,
			});

			return yield* Effect.fail(
				new ImageHasRelationsError({
					imageId: id,
					relationCounts: relationsCheck.relationCounts,
				})
			);
		}

		// Legacy-only compatibility path. Canonical rows never reach physical deletion here.
		yield* Effect.tryPromise({
			try: () => db.delete(images).where(eq(images.id, id)),
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'delete',
					originalError: error,
				}),
		});

		logger.info('✅ Image deleted', { id, force, hadRelations: relationsCheck.hasRelations });
		return { success: true };
	});

export const restoreById = (id: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		yield* Effect.tryPromise({
			try: async () => {
				const [row] = await db
					.select({ assetId: images.assetId, status: assets.status, statusBeforeDeletion: assets.statusBeforeDeletion })
					.from(images)
					.leftJoin(assets, eq(assets.id, images.assetId))
					.where(eq(images.id, id))
					.limit(1);
				if (!(row?.assetId && row.status === 'deleted'))
					throw new Error('Image no es un tombstone canónico restaurable.');
				if (!(row.statusBeforeDeletion === 'active' || row.statusBeforeDeletion === 'archived')) {
					throw new Error('Image no conserva un estado previo restaurable.');
				}
				const now = new Date();
				const restored = await db
					.update(assets)
					.set({
						deletedAt: null,
						status: row.statusBeforeDeletion,
						statusBeforeDeletion: null,
						updatedAt: now,
					})
					.where(and(eq(assets.id, row.assetId), eq(assets.status, 'deleted')))
					.returning({ id: assets.id });
				if (restored.length !== 1) throw new Error('El lifecycle de Asset cambió durante la restauración.');
			},
			catch: (error) => new ImageDatabaseError({ operation: 'restore', originalError: error }),
		});
		return yield* getByIdInternal(id);
	});

/**
 * Delete multiple images by IDs (batch operation)
 *
 * VALIDATIONS:
 * - At least one ID required
 * - Relations check for each image (unless force=true)
 *
 * BEHAVIOR:
 * - Atomic transaction: all or nothing
 * - Returns count of deleted images
 *
 * ERROR CASES:
 * - ImageValidationError: Empty IDs array
 * - ImageHasRelationsError: Any image has relations and force=false
 * - ImageDatabaseError: Database operation failed
 */
export const deleteManyByIds = (
	ids: string[],
	options?: { force?: boolean }
): Effect.Effect<{ deletedCount: number }, ImageError, never> =>
	Effect.gen(function* () {
		const force = options?.force ?? false;

		if (ids.length === 0) {
			logger.warn('❌ No IDs provided for batch deletion');
			return yield* Effect.fail(
				new ImageValidationError({
					field: 'ids',
					message: 'At least one ID is required',
					value: ids,
				})
			);
		}

		logger.info('🗑️ Batch deleting images', {
			count: ids.length,
			force,
		});

		const targets = yield* Effect.tryPromise<Array<{ assetId: string | null; id: string }>, ImageDatabaseError>({
			try: () => db.select({ assetId: images.assetId, id: images.id }).from(images).where(inArray(images.id, ids)),
			catch: (error) => new ImageDatabaseError({ operation: 'deleteMany-targets', originalError: error }),
		});
		const legacyIds = targets.flatMap(({ assetId, id }) => (assetId ? [] : [id]));

		// Relation guards only apply to the legacy physical-delete compatibility path.
		if (!force) {
			const relationsChecks = yield* Effect.all(legacyIds.map(checkRelations));

			const imagesWithRelations = relationsChecks
				.map((check, index) => ({ id: legacyIds[index], check }))
				.filter((item) => item.check.hasRelations);

			if (imagesWithRelations.length > 0) {
				const firstWithRelations = imagesWithRelations[0];
				logger.warn('❌ Images have relations, cannot delete without force', {
					count: imagesWithRelations.length,
					firstImage: firstWithRelations.id,
					relationCounts: firstWithRelations.check.relationCounts,
				});

				return yield* Effect.fail(
					new ImageHasRelationsError({
						imageId: firstWithRelations.id,
						relationCounts: firstWithRelations.check.relationCounts,
					})
				);
			}
		}

		// Canonical rows become tombstones; only legacy-only rows are physically deleted.
		const result = yield* Effect.tryPromise<number, ImageDatabaseError>({
			try: async () => {
				return db.transaction(async (transaction: typeof db) => {
					let transitioned = 0;
					const canonicalIds = targets.flatMap(({ assetId }) => (assetId ? [assetId] : []));
					if (canonicalIds.length > 0) {
						const canonicalAssets = await transaction
							.select({ id: assets.id, status: assets.status })
							.from(assets)
							.where(inArray(assets.id, canonicalIds));
						const now = new Date();
						for (const asset of canonicalAssets) {
							if (!(asset.status === 'active' || asset.status === 'archived')) continue;
							const updated = await transaction
								.update(assets)
								.set({ deletedAt: now, status: 'deleted', statusBeforeDeletion: asset.status, updatedAt: now })
								.where(and(eq(assets.id, asset.id), eq(assets.status, asset.status)))
								.returning({ id: assets.id });
							if (updated.length !== 1) throw new Error(`Asset ${asset.id} cambió durante el batch tombstone.`);
							transitioned += 1;
						}
					}
					const deleted =
						legacyIds.length > 0
							? await transaction.delete(images).where(inArray(images.id, legacyIds)).returning({ id: images.id })
							: [];
					return transitioned + deleted.length;
				});
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'deleteMany',
					originalError: error,
				}),
		});

		logger.info('✅ Batch deletion complete', {
			requested: ids.length,
			deleted: result,
		});

		return { deletedCount: result };
	});

// ============================================================================
// PUBLIC API - QUERY OPERATIONS
// ============================================================================

/**
 * Get the first deterministic image candidate by content hash.
 *
 * ERROR CASES:
 * - ImageNotFound: No image with given hash exists
 * - ImageDatabaseError: Database operation failed
 */
export const getByHashCandidates = (hash: string): Effect.Effect<Image[], ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image candidates by hash', { hash });

		const [results, favoriteEntityIds] = yield* Effect.all([
			Effect.tryPromise({
				try: async () => {
					const candidates = await db
						.select()
						.from(images)
						.where(eq(images.hash, hash))
						.orderBy(asc(images.createdAt), asc(images.id));
					return (await projectCanonicalImages(candidates)).map((image) => Image.make(image));
				},
				catch: (error) =>
					new ImageDatabaseError({
						operation: 'getByHashCandidates',
						originalError: error,
					}),
			}),
			getImageFavoriteIds(),
		]);

		return projectImages(results, favoriteEntityIds);
	});

export const getByHash = (hash: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		const candidates = yield* getByHashCandidates(hash);
		const result = candidates[0];
		if (!result) return yield* Effect.fail(new ImageNotFound({ imageId: `hash:${hash}` }));
		return result;
	});

/**
 * Get image by path and folderId (for duplicate detection in same folder)
 *
 * ERROR CASES:
 * - ImageNotFound: No image with given path/folder combination exists
 * - ImageDatabaseError: Database operation failed
 */
export const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image by path and folder', { path, folderId });

		const [result, favoriteEntityIds] = yield* Effect.all([
			Effect.tryPromise({
				try: async () => {
					const image = await getFirstRow<typeof images.$inferSelect>(() =>
						db
							.select()
							.from(images)
							.where(and(eq(images.path, path), eq(images.folderId, folderId)))
							.limit(1)
					);
					if (!image) return null;
					const projected = await projectCanonicalImage(image);
					return projected ? Image.make(projected) : null;
				},
				catch: (error) =>
					new ImageDatabaseError({
						operation: 'getByPathAndFolder',
						originalError: error,
					}),
			}),
			getImageFavoriteIds(),
		]);

		if (!result) {
			logger.warn('❌ Image not found by path/folder', { path, folderId });
			return yield* Effect.fail(new ImageNotFound({ imageId: `path:${path}` }));
		}

		const projectedImage = projectImage(result, favoriteEntityIds);

		logger.info('✅ Image found by path/folder', {
			path,
			folderId,
			id: projectedImage.id,
			name: projectedImage.name,
		});

		return projectedImage;
	});

/**
 * Get all favorites images
 *
 * ERROR CASES:
 * - ImageDatabaseError: Database operation failed
 */
export const getAllFavorites = (): Effect.Effect<Image[], ImageError, never> =>
	Effect.gen(function* () {
		logger.info('⭐ Getting all favorite images');

		const favoriteEntityIds = yield* getImageFavoriteIds();

		if (favoriteEntityIds.length === 0) {
			logger.info('✅ Favorite images retrieved', { count: 0 });
			return [];
		}

		const results = yield* Effect.tryPromise({
			try: async () => {
				const favImages = await db
					.select()
					.from(images)
					.where(and(inArray(images.id, favoriteEntityIds), visibleImageLifecycleCondition()))
					.orderBy(desc(images.addedAt));
				return (await projectCanonicalImages(favImages)).map((image) =>
					projectImage(Image.make(image), favoriteEntityIds)
				);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getAllFavorites',
					originalError: error,
				}),
		});

		logger.info('✅ Favorite images retrieved', { count: results.length });
		return results;
	});

/**
 * Get images by folder ID
 *
 * ERROR CASES:
 * - ImageDatabaseError: Database operation failed
 */
export const getByFolder = (
	folderId: string,
	options?: { limit?: number; offset?: number }
): Effect.Effect<Image[], ImageError, never> =>
	Effect.gen(function* () {
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;

		logger.info('📁 Getting images by folder', {
			folderId,
			limit,
			offset,
		});

		const [results, favoriteEntityIds] = yield* Effect.all([
			Effect.tryPromise({
				try: async () => {
					const folderImages = await db
						.select()
						.from(images)
						.where(and(eq(images.folderId, folderId), visibleImageLifecycleCondition()))
						.orderBy(desc(images.addedAt))
						.limit(limit)
						.offset(offset);
					return (await projectCanonicalImages(folderImages)).map((image) => Image.make(image));
				},
				catch: (error) =>
					new ImageDatabaseError({
						operation: 'getByFolder',
						originalError: error,
					}),
			}),
			getImageFavoriteIds(),
		]);

		const projectedResults = projectImages(results, favoriteEntityIds);

		logger.info('✅ Folder images retrieved', {
			folderId,
			count: projectedResults.length,
		});

		return projectedResults;
	});

// ============================================================================
// PUBLIC API - TOGGLE OPERATIONS
// ============================================================================

/**
 * Toggle favorite status for an image
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageDatabaseError: Database operation failed
 */
export const toggleFavorite = (id: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('⭐ Toggling favorite for image', { id });

		// Check exists
		yield* getByIdInternal(id);

		const currentFavoriteStatus = yield* Effect.tryPromise({
			try: () => favoriteService.isFavorite(FavoriteEntityType.IMAGE, id),
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'toggleFavorite-isFavorite',
					originalError: error,
				}),
		});
		const newFavoriteStatus = !currentFavoriteStatus;

		yield* Effect.tryPromise({
			try: () => favoriteService.set(FavoriteEntityType.IMAGE, id, newFavoriteStatus),
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'toggleFavorite-set',
					originalError: error,
				}),
		});

		logger.info('✅ Favorite toggled', {
			id,
			wasFavorite: currentFavoriteStatus,
			nowFavorite: newFavoriteStatus,
		});

		return yield* getById(id);
	});

// ============================================================================
// PUBLIC API - BULK OPERATIONS
// ============================================================================

/**
 * Set favorite status for multiple images
 *
 * ERROR CASES:
 * - ImageValidationError: Empty IDs array
 * - ImageDatabaseError: Database operation failed
 */
export const setFavoriteMany = (
	ids: string[],
	isFavorite: boolean
): Effect.Effect<{ updatedCount: number }, ImageError, never> =>
	Effect.gen(function* () {
		if (ids.length === 0) {
			return yield* Effect.fail(
				new ImageValidationError({
					field: 'ids',
					message: 'At least one ID is required',
					value: ids,
				})
			);
		}

		logger.info('⭐ Setting favorite for multiple images', {
			count: ids.length,
			isFavorite,
		});

		const result = yield* Effect.tryPromise({
			try: () => favoriteService.setMany(FavoriteEntityType.IMAGE, ids, isFavorite),
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'setFavoriteMany-setMany',
					originalError: error,
				}),
		});

		logger.info('✅ Favorite status updated for multiple images', {
			requested: ids.length,
			updated: result,
		});

		return { updatedCount: result };
	});

/**
 * Count images by folder
 *
 * ERROR CASES:
 * - ImageDatabaseError: Database operation failed
 */
export const countByFolder = (folderId: string): Effect.Effect<number, ImageError, never> =>
	Effect.gen(function* () {
		logger.debug('📊 Counting images by folder', { folderId });

		const result = yield* Effect.tryPromise({
			try: async () => {
				const [{ count: total }] = await db
					.select({ count: count() })
					.from(images)
					.where(and(eq(images.folderId, folderId), visibleImageLifecycleCondition()));

				return total;
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'countByFolder',
					originalError: error,
				}),
		});

		logger.debug('✅ Image count retrieved', { folderId, count: result });
		return result;
	});

// ============================================================================
// THUMBNAIL OPERATIONS
// ============================================================================

/**
 * Generate thumbnail for an image
 *
 * ERROR CASES:
 * - ImageNotFound: Image does not exist
 * - ImageThumbnailError: Thumbnail generation failed
 * - ImageDatabaseError: Database operation failed
 */
export const generateThumbnail = (
	imageId: string,
	authorizedSourcePath?: string
): Effect.Effect<void, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🖼️ Generating thumbnail', { imageId });

		// Check image exists
		yield* getByIdInternal(imageId);

		// Generate thumbnail using legacy service
		yield* Effect.tryPromise({
			try: async () => {
				await thumbnailService.generateThumbnail(imageId, authorizedSourcePath);
			},
			catch: (error) =>
				new ImageThumbnailError({
					imageId,
					operation: 'generate',
					reason: error instanceof Error ? error.message : String(error),
					originalError: error,
				}),
		});

		logger.info('✅ Thumbnail generated', { imageId });
	});

/**
 * Get thumbnail buffer for an image (generates if not exists)
 *
 * ERROR CASES:
 * - ImageNotFound: Image does not exist
 * - ImageThumbnailError: Thumbnail retrieval/generation failed
 * - ImageDatabaseError: Database operation failed
 */
export const getThumbnail = (
	imageId: string,
	authorizedSourcePath?: string
): Effect.Effect<Buffer, ImageError, never> =>
	Effect.gen(function* () {
		logger.debug('📥 Getting thumbnail', { imageId });

		// Helper to get image by ID for thumbnail service
		const getImageById = async (id: string) => {
			const img = await getFirstRow<typeof images.$inferSelect>(() =>
				db.select().from(images).where(eq(images.id, id)).limit(1)
			);
			return img || null;
		};

		const buffer = yield* Effect.tryPromise({
			try: async () => {
				return await thumbnailService.getThumbnail(imageId, getImageById as any, authorizedSourcePath);
			},
			catch: (error) =>
				new ImageThumbnailError({
					imageId,
					operation: 'retrieve',
					reason: error instanceof Error ? error.message : String(error),
					originalError: error,
				}),
		});

		logger.debug('✅ Thumbnail retrieved', {
			imageId,
			sizeKB: (buffer.length / 1024).toFixed(2),
		});

		return buffer;
	});

/**
 * Get original image buffer
 *
 * ERROR CASES:
 * - ImageNotFound: Image does not exist
 * - ImageThumbnailError: File read failed (reusing error type for file operations)
 * - ImageDatabaseError: Database operation failed
 */
export const getOriginalImage = (imageId: string): Effect.Effect<Buffer, ImageError, never> =>
	Effect.gen(function* () {
		logger.debug('📥 Getting original image', { imageId });

		// Helper to get image by ID for thumbnail service
		const getImageById = async (id: string) => {
			const img = await getFirstRow<typeof images.$inferSelect>(() =>
				db.select().from(images).where(eq(images.id, id)).limit(1)
			);
			return img || null;
		};

		const buffer = yield* Effect.tryPromise({
			try: async () => {
				return await thumbnailService.getOriginalImage(imageId, getImageById as any);
			},
			catch: (error) =>
				new ImageThumbnailError({
					imageId,
					operation: 'retrieve',
					reason: error instanceof Error ? error.message : String(error),
					originalError: error,
				}),
		});

		logger.debug('✅ Original image retrieved', {
			imageId,
			sizeMB: (buffer.length / 1024 / 1024).toFixed(2),
		});

		return buffer;
	});

// ============================================================================
// CONTEXT TAG & LAYER
// ============================================================================


/**
 * Interface for ImageService
 */
export interface ImageServiceInterface {
	readonly countByFolder: (folderId: string) => Effect.Effect<number, ImageError, never>;
	readonly create: (input: ImageCreateCommand) => Effect.Effect<Image, ImageError, never>;
	readonly deleteById: (
		id: string,
		options?: { force?: boolean }
	) => Effect.Effect<{ success: boolean }, ImageError, never>;
	readonly deleteManyByIds: (
		ids: string[],
		options?: { force?: boolean }
	) => Effect.Effect<{ deletedCount: number }, ImageError, never>;
	readonly generateThumbnail: (
		imageId: string,
		authorizedSourcePath?: string
	) => Effect.Effect<void, ImageError, never>;
	readonly getAll: (options?: {
		limit?: number;
		offset?: number;
		orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height';
		orderDirection?: 'asc' | 'desc';
		search?: string;
		folderId?: string;
		isFavorite?: boolean;
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
		minSize?: number;
		maxSize?: number;
		aiEngine?: string;
		aiModel?: string;
		aiOriginDetected?: boolean;
	}) => Effect.Effect<
		{
			images: Image[];
			total: number;
			limit: number;
			offset: number;
			hasMore: boolean;
		},
		ImageError,
		never
	>;
	readonly getAllFavorites: () => Effect.Effect<Image[], ImageError, never>;
	readonly getByFolder: (
		folderId: string,
		options?: { limit?: number; offset?: number }
	) => Effect.Effect<Image[], ImageError, never>;
	readonly getByHash: (hash: string) => Effect.Effect<Image, ImageError, never>;
	readonly getByHashCandidates: (hash: string) => Effect.Effect<Image[], ImageError, never>;
	readonly getById: (id: string) => Effect.Effect<Image, ImageError, never>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<ImageWithStats, ImageError, never>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Image, ImageError, never>;
	readonly getOriginalImage: (imageId: string) => Effect.Effect<Buffer, ImageError, never>;
	readonly restoreById: (id: string) => Effect.Effect<Image, ImageError, never>;
	readonly getThumbnail: (imageId: string, authorizedSourcePath?: string) => Effect.Effect<Buffer, ImageError, never>;
	readonly setFavoriteMany: (
		ids: string[],
		isFavorite: boolean
	) => Effect.Effect<{ updatedCount: number }, ImageError, never>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Image, ImageError, never>;
	readonly update: (id: string, input: typeof ImageUpdateInput.Type) => Effect.Effect<Image, ImageError, never>;
}

/**
 * Context.Tag for ImageService
 */
export class ImageService extends Context.Tag('ImageService')<ImageService, ImageServiceInterface>() {}

/**
 * Implementation constructor
 */
const make = (): ImageServiceInterface => ({
	create,
	getById,
	getByIdWithStats,
	getAll,
	update,
	deleteById,
	deleteManyByIds,
	restoreById,
	getByHash,
	getByHashCandidates,
	getByPathAndFolder,
	getAllFavorites,
	getByFolder,
	toggleFavorite,
	setFavoriteMany,
	countByFolder,
	generateThumbnail,
	getThumbnail,
	getOriginalImage,
});

/**
 * Layer providing ImageService implementation
 */
export const ImageServiceLive = Layer.succeed(ImageService, make());
