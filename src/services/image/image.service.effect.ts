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
 * - UNIQUE (hash) with index
 */

import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import {
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
import {
	ImageDatabaseError,
	type ImageError,
	ImageHashConflict,
	ImageHasRelationsError,
	ImageNotFound,
	ImageThumbnailError,
	ImageValidationError,
} from './image-errors.effect';
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
				const image = await db.query.images.findFirst({
					where: eq(images.id, id),
				});
				if (!image) return null;
				return Image.make(image);
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
				// Note: Many-to-many tables use columns A (imageId) and B (relatedEntityId)
				const [results] = await db
					.select({
						albumCount: count(imageAlbums.B),
						collectionCount: count(imageCollections.B),
						tagCount: count(imageTags.B),
						characterCount: count(imageCharacters.B),
						placeCount: count(imagePlaces.B),
						worldItemCount: count(imageWorldItems.B),
						conceptCount: count(imageConcepts.B),
						promptCount: count(imagePrompts.B),
						noteCount: count(imageNotes.B),
						wildcardCount: count(imageWildcards.B),
						propertyCount: count(imageProperties.B),
						groupCount: count(groupImages.B),
					})
					.from(images)
					.leftJoin(imageAlbums, eq(imageAlbums.A, images.id))
					.leftJoin(imageCollections, eq(imageCollections.A, images.id))
					.leftJoin(imageTags, eq(imageTags.A, images.id))
					.leftJoin(imageCharacters, eq(imageCharacters.A, images.id))
					.leftJoin(imagePlaces, eq(imagePlaces.A, images.id))
					.leftJoin(imageWorldItems, eq(imageWorldItems.A, images.id))
					.leftJoin(imageConcepts, eq(imageConcepts.A, images.id))
					.leftJoin(imagePrompts, eq(imagePrompts.A, images.id))
					.leftJoin(imageNotes, eq(imageNotes.A, images.id))
					.leftJoin(imageWildcards, eq(imageWildcards.A, images.id))
					.leftJoin(imageProperties, eq(imageProperties.A, images.id))
					.leftJoin(groupImages, eq(groupImages.B, images.id))
					.where(eq(images.id, imageId));

				return {
					albumCount: results.albumCount,
					collectionCount: results.collectionCount,
					tagCount: results.tagCount,
					characterCount: results.characterCount,
					placeCount: results.placeCount,
					worldItemCount: results.worldItemCount,
					conceptCount: results.conceptCount,
					promptCount: results.promptCount,
					noteCount: results.noteCount,
					wildcardCount: results.wildcardCount,
					propertyCount: results.propertyCount,
					groupCount: results.groupCount,
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
 * - Duplicate hash check (UNIQUE constraint)
 * - Folder existence check (folderId NOT NULL)
 *
 * ERROR CASES:
 * - ImageValidationError: Invalid input data
 * - ImageHashConflict: Image with same hash already exists
 * - ImageDatabaseError: Database operation failed
 */
export const create = (input: ImageCreateInput): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('➕ Creating image', { name: input.name, hash: input.hash });

		// Validate input
		const validated = yield* Effect.try({
			try: () => ImageCreateInput.make(input),
			catch: (error) =>
				new ImageValidationError({
					field: 'input',
					message: String(error),
					value: input,
				}),
		});

		// Check for duplicate hash (UNIQUE constraint)
		const existing = yield* Effect.tryPromise({
			try: async () => {
				return await db.query.images.findFirst({
					where: eq(images.hash, validated.hash),
				});
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'create-check-duplicate',
					originalError: error,
				}),
		});

		if (existing) {
			logger.warn('❌ Image with hash already exists', {
				hash: validated.hash,
				existingId: existing.id,
			});
			return yield* Effect.fail(
				new ImageHashConflict({
					hash: validated.hash,
					existingImageId: existing.id,
				})
			);
		}

		// Create image
		const now = new Date();
		const [created] = yield* Effect.tryPromise({
			try: async () => {
				return await db
					.insert(images)
					.values({
						id: crypto.randomUUID(),
						name: validated.name,
						description: validated.description ?? null,
						path: validated.path,
						hash: validated.hash,
						size: validated.size,
						width: validated.width,
						height: validated.height,
						metadata: validated.metadata ?? null,
						thumbnail: validated.thumbnail ?? null,
						thumbnailSize: validated.thumbnailSize ?? null,
						thumbnailWidth: validated.thumbnailWidth ?? null,
						thumbnailHeight: validated.thumbnailHeight ?? null,
						thumbnailMimeType: validated.thumbnailMimeType ?? null,
						thumbnailError: null,
						thumbnailErrorAt: null,
						thumbnailOptimizedAt: null,
						aiEngine: validated.aiEngine ?? null,
						aiModel: validated.aiModel ?? null,
						aiOriginDetected: validated.aiOriginDetected ?? false,
						isFavorite: validated.isFavorite ?? false,
						folderId: validated.folderId,
						noteId: validated.noteId ?? null,
						createdAt: now,
						updatedAt: now,
						addedAt: now,
					})
					.returning();
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'create',
					originalError: error,
				}),
		});

		logger.info('✅ Image created', {
			id: created.id,
			name: created.name,
			hash: created.hash,
		});

		return Image.make(created);
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

		const image = yield* getByIdInternal(id);

		logger.info('✅ Image retrieved', { id, name: image.name });
		return image;
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

		const [image, stats] = yield* Effect.all([getByIdInternal(id), getRelationsCounts(id)]);

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
		const conditions = [];

		if (options?.folderId) {
			conditions.push(eq(images.folderId, options.folderId));
		}

		if (options?.isFavorite !== undefined) {
			conditions.push(eq(images.isFavorite, options.isFavorite));
		}

		if (options?.search) {
			const searchPattern = `%${options.search}%`;
			conditions.push(sql`lower(${images.name}) LIKE lower(${searchPattern})`);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
					.orderBy(orderByClause)
					.limit(limit)
					.offset(offset);

				return results.map((r: typeof images.$inferSelect) => Image.make(r));
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
 * NOTE: Cannot update hash (immutable), path, or size/dimensions (file system properties)
 *
 * ERROR CASES:
 * - ImageNotFound: Image with given ID does not exist
 * - ImageValidationError: Invalid update data
 * - ImageDatabaseError: Database operation failed
 */
export const update = (id: string, input: ImageUpdateInput): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('📝 Updating image', { id, updates: Object.keys(input) });

		// Validate input
		const validated = yield* Effect.try({
			try: () => ImageUpdateInput.make(input),
			catch: (error) =>
				new ImageValidationError({
					field: 'input',
					message: String(error),
					value: input,
				}),
		});

		// Check if image exists
		yield* getByIdInternal(id);

		// Update image
		const now = new Date();
		const [updated] = yield* Effect.tryPromise({
			try: async () => {
				return await db
					.update(images)
					.set({
						...validated,
						updatedAt: now,
					})
					.where(eq(images.id, id))
					.returning();
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'update',
					originalError: error,
				}),
		});

		logger.info('✅ Image updated', {
			id,
			name: updated.name,
			updatedFields: Object.keys(validated),
		});

		return Image.make(updated);
	});

/**
 * Delete image by ID
 *
 * VALIDATIONS:
 * - Image existence check
 * - Relations check (prevents cascade deletion unless force=true)
 *
 * BEHAVIOR:
 * - force=false (default): Fails if image has relations (ImageHasRelationsError)
 * - force=true: Deletes image and ALL relations (cascade)
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
		yield* getByIdInternal(id);

		// Check relations
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

		// Delete image (cascade if force=true)
		yield* Effect.tryPromise({
			try: async () => {
				await db.delete(images).where(eq(images.id, id));
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'delete',
					originalError: error,
				}),
		});

		logger.info('✅ Image deleted', { id, force, hadRelations: relationsCheck.hasRelations });
		return { success: true };
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

		// Check relations for all images if not force
		if (!force) {
			const relationsChecks = yield* Effect.all(ids.map(checkRelations));

			const imagesWithRelations = relationsChecks
				.map((check, index) => ({ id: ids[index], check }))
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

		// Delete all images
		const result = yield* Effect.tryPromise({
			try: async () => {
				const deleted = await db.delete(images).where(inArray(images.id, ids)).returning({ id: images.id });
				return deleted.length;
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
 * Get image by hash (for duplicate detection)
 *
 * ERROR CASES:
 * - ImageNotFound: No image with given hash exists
 * - ImageDatabaseError: Database operation failed
 */
export const getByHash = (hash: string): Effect.Effect<Image, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🔍 Getting image by hash', { hash });

		const result = yield* Effect.tryPromise({
			try: async () => {
				const image = await db.query.images.findFirst({
					where: eq(images.hash, hash),
				});
				if (!image) return null;
				return Image.make(image);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getByHash',
					originalError: error,
				}),
		});

		if (!result) {
			logger.warn('❌ Image not found by hash', { hash });
			return yield* Effect.fail(new ImageNotFound({ imageId: `hash:${hash}` }));
		}

		logger.info('✅ Image found by hash', {
			hash,
			id: result.id,
			name: result.name,
		});

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

		const result = yield* Effect.tryPromise({
			try: async () => {
				const image = await db.query.images.findFirst({
					where: and(eq(images.path, path), eq(images.folderId, folderId)),
				});
				if (!image) return null;
				return Image.make(image);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getByPathAndFolder',
					originalError: error,
				}),
		});

		if (!result) {
			logger.warn('❌ Image not found by path/folder', { path, folderId });
			return yield* Effect.fail(new ImageNotFound({ imageId: `path:${path}` }));
		}

		logger.info('✅ Image found by path/folder', {
			path,
			folderId,
			id: result.id,
			name: result.name,
		});

		return result;
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

		const results = yield* Effect.tryPromise({
			try: async () => {
				const favImages = await db.query.images.findMany({
					where: eq(images.isFavorite, true),
					orderBy: [desc(images.addedAt)],
				});
				return favImages.map((img: typeof images.$inferSelect) => Image.make(img));
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

		const results = yield* Effect.tryPromise({
			try: async () => {
				const folderImages = await db.query.images.findMany({
					where: eq(images.folderId, folderId),
					orderBy: [desc(images.addedAt)],
					limit,
					offset,
				});
				return folderImages.map((img: typeof images.$inferSelect) => Image.make(img));
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'getByFolder',
					originalError: error,
				}),
		});

		logger.info('✅ Folder images retrieved', {
			folderId,
			count: results.length,
		});

		return results;
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

		// Get current image
		const currentImage = yield* getByIdInternal(id);

		// Toggle favorite
		const newFavoriteStatus = !currentImage.isFavorite;

		const updated = yield* Effect.tryPromise({
			try: async () => {
				const [result] = await db
					.update(images)
					.set({
						isFavorite: newFavoriteStatus,
						updatedAt: new Date(),
					})
					.where(eq(images.id, id))
					.returning();

				return Image.make(result);
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'toggleFavorite',
					originalError: error,
				}),
		});

		logger.info('✅ Favorite toggled', {
			id,
			wasFavorite: currentImage.isFavorite,
			nowFavorite: newFavoriteStatus,
		});

		return updated;
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
			try: async () => {
				const updated = await db
					.update(images)
					.set({
						isFavorite,
						updatedAt: new Date(),
					})
					.where(inArray(images.id, ids))
					.returning({ id: images.id });

				return updated.length;
			},
			catch: (error) =>
				new ImageDatabaseError({
					operation: 'setFavoriteMany',
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
					.where(eq(images.folderId, folderId));

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
export const generateThumbnail = (imageId: string): Effect.Effect<void, ImageError, never> =>
	Effect.gen(function* () {
		logger.info('🖼️ Generating thumbnail', { imageId });

		// Check image exists
		yield* getByIdInternal(imageId);

		// Generate thumbnail using legacy service
		yield* Effect.tryPromise({
			try: async () => {
				await thumbnailService.generateThumbnail(imageId);
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
export const getThumbnail = (imageId: string): Effect.Effect<Buffer, ImageError, never> =>
	Effect.gen(function* () {
		logger.debug('📥 Getting thumbnail', { imageId });

		// Helper to get image by ID for thumbnail service
		const getImageById = async (id: string) => {
			const img = await db.query.images.findFirst({
				where: eq(images.id, id),
			});
			return img || null;
		};

		const buffer = yield* Effect.tryPromise({
			try: async () => {
				return await thumbnailService.getThumbnail(imageId, getImageById as any);
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
			const img = await db.query.images.findFirst({
				where: eq(images.id, id),
			});
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

import { Context, Layer } from 'effect';

/**
 * Interface for ImageService
 */
export interface ImageServiceInterface {
	readonly create: (input: typeof ImageCreateInput.Type) => Effect.Effect<Image, ImageError, never>;
	readonly getById: (id: string) => Effect.Effect<Image, ImageError, never>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<ImageWithStats, ImageError, never>;
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
	readonly update: (id: string, input: typeof ImageUpdateInput.Type) => Effect.Effect<Image, ImageError, never>;
	readonly deleteById: (
		id: string,
		options?: { force?: boolean }
	) => Effect.Effect<{ success: boolean }, ImageError, never>;
	readonly deleteManyByIds: (
		ids: string[],
		options?: { force?: boolean }
	) => Effect.Effect<{ deletedCount: number }, ImageError, never>;
	readonly getByHash: (hash: string) => Effect.Effect<Image | null, ImageError, never>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Image | null, ImageError, never>;
	readonly getAllFavorites: () => Effect.Effect<Image[], ImageError, never>;
	readonly getByFolder: (
		folderId: string,
		options?: { limit?: number; offset?: number }
	) => Effect.Effect<Image[], ImageError, never>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Image, ImageError, never>;
	readonly setFavoriteMany: (
		ids: string[],
		isFavorite: boolean
	) => Effect.Effect<{ updatedCount: number }, ImageError, never>;
	readonly countByFolder: (folderId: string) => Effect.Effect<number, ImageError, never>;
	readonly generateThumbnail: (imageId: string) => Effect.Effect<void, ImageError, never>;
	readonly getThumbnail: (imageId: string) => Effect.Effect<Buffer, ImageError, never>;
	readonly getOriginalImage: (imageId: string) => Effect.Effect<Buffer, ImageError, never>;
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
	getByHash,
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
