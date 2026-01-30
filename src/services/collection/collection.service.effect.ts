/**
 * @file CollectionService implementado con Effect
 * @module services/collection/collection.service.effect
 * @description Servicio Collection con manejo funcional de errores usando Effect-TS
 * @created 2025-10-11 - Phase 5: Collection Migration
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, isNull, like, ne, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { collections, imageCollections, images } from '@/lib/drizzle/schema';
import {
	Collection,
	CollectionCreateInput,
	CollectionUpdateInput,
	CollectionWithStats,
} from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import type { CollectionError } from './collection-errors.effect';
import {
	CollectionDatabaseError,
	CollectionHasContentError,
	CollectionNotFound,
	CollectionValidationError,
} from './collection-errors.effect';

// Logger específico
const logger = serverLogger.withContext('CollectionService.Effect');

/**
 * Opciones para obtener colecciones
 */
export interface GetCollectionsOptions {
	search?: string;
	parentId?: string | null;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

/**
 * Resultado de obtener colecciones con paginación
 */
export interface GetCollectionsResult {
	collections: CollectionWithStats[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * Contadores de relaciones de una colección
 */
export interface CollectionCounts {
	images: number;
	videos: number;
}

/**
 * Resultado de operación bulk
 */
export interface BulkOperationResult {
	successful: number;
	failed: number;
	errors: Array<{ id: string; error: string }>;
}

/**
 * Interface para el servicio CollectionService
 */
export interface CollectionServiceInterface {
	// CRUD Operations
	readonly getById: (id: string) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly getAll: (options?: GetCollectionsOptions) => Effect.Effect<GetCollectionsResult, CollectionError>;
	readonly create: (
		input: Schema.Schema.Type<typeof CollectionCreateInput>
	) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof CollectionUpdateInput>
	) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly delete: (id: string, force?: boolean) => Effect.Effect<void, CollectionError>;

	// Relation Operations
	readonly addImages: (collectionId: string, imageIds: string[]) => Effect.Effect<{ added: number }, CollectionError>;
	readonly removeImage: (collectionId: string, imageId: string) => Effect.Effect<void, CollectionError>;
	readonly getImages: (
		collectionId: string,
		options?: { limit?: number; offset?: number }
	) => Effect.Effect<any[], CollectionError>;

	// Stats Operations
	readonly toggleFavorite: (id: string) => Effect.Effect<CollectionWithStats, CollectionError>;

	// Search Operations
	readonly search: (query: string) => Effect.Effect<CollectionWithStats[], CollectionError>;
}

/**
 * Context.Tag para CollectionService
 */
export class CollectionService extends Context.Tag('CollectionService')<
	CollectionService,
	CollectionServiceInterface
>() {}

// ============= Helper Functions =============

/**
 * Obtiene conteos de relaciones para una colección
 */
const getRelationsCounts = (id: string): Effect.Effect<CollectionCounts, CollectionDatabaseError> =>
	Effect.gen(function* () {
		logger.info('📊 Obteniendo conteos para colección', { id });

		const [imagesCountResult] = yield* Effect.tryPromise({
			try: async () => await db.select({ count: count() }).from(imageCollections).where(eq(imageCollections.B, id)), // B = collectionId
			catch: (error) =>
				new CollectionDatabaseError({
					operation: 'getRelationsCounts:images',
					originalError: error,
				}),
		});

		const imagesCount = imagesCountResult?.count ?? 0;

		logger.info('✅ Conteos obtenidos', { imagesCount });

		return {
			images: imagesCount,
			videos: 0, // TODO: implement when video relations exist
		};
	});

/**
 * Enriquece una colección con conteos y stats
 */
const enrichCollectionWithCounts = (
	collection: Collection
): Effect.Effect<CollectionWithStats, CollectionDatabaseError> =>
	Effect.gen(function* () {
		const counts = yield* getRelationsCounts(collection.id);

		return {
			...collection,
			totalImages: counts.images,
			totalVideos: counts.videos,
			totalSize: 0, // TODO: calculate from aggregates
		};
	});

/**
 * Valida que el parent existe (si se proporciona)
 */
const validateParentExists = (
	parentId: string | null | undefined
): Effect.Effect<void, CollectionNotFound | CollectionDatabaseError> =>
	Effect.gen(function* () {
		if (!parentId) return;

		const parent = yield* Effect.tryPromise({
			try: async () =>
				await db.query.collections.findFirst({
					where: eq(collections.id, parentId),
					columns: { id: true },
				}),
			catch: (error) =>
				new CollectionDatabaseError({
					operation: 'validateParentExists',
					originalError: error,
				}),
		});

		if (!parent) {
			yield* new CollectionNotFound({ collectionId: parentId });
		}
	});

/**
 * Verifica unicidad del nombre (globalmente)
 */
const checkNameUnique = (
	name: string,
	excludeId?: string
): Effect.Effect<void, CollectionValidationError | CollectionDatabaseError> =>
	Effect.gen(function* () {
		const existing = yield* Effect.tryPromise({
			try: async () => {
				if (excludeId) {
					// Check for other collections with same name
					const result = await db.query.collections.findFirst({
						where: and(eq(collections.name, name), ne(collections.id, excludeId)),
						columns: { id: true, name: true },
					});
					return result;
				}
				// Check for any collection with same name
				return await db.query.collections.findFirst({
					where: eq(collections.name, name),
					columns: { id: true, name: true },
				});
			},
			catch: (error) =>
				new CollectionDatabaseError({
					operation: 'checkNameUnique',
					originalError: error,
				}),
		});

		if (existing) {
			yield* new CollectionValidationError({
				field: 'name',
				message: `Ya existe una collection con el nombre: ${name}`,
			});
		}
	});

/**
 * Obtiene una colección por ID (interno, sin enriquecimiento)
 */
const getByIdInternal = (id: string): Effect.Effect<Collection, CollectionNotFound | CollectionDatabaseError> =>
	Effect.gen(function* () {
		logger.info('🔍 Obteniendo collection por ID', { id });

		const result = yield* Effect.tryPromise({
			try: async () =>
				await db.query.collections.findFirst({
					where: eq(collections.id, id),
				}),
			catch: (error) =>
				new CollectionDatabaseError({
					operation: 'getByIdInternal',
					originalError: error,
				}),
		});

		if (!result) {
			logger.warn('❌ Collection no encontrada', { id });
			yield* new CollectionNotFound({ collectionId: id });
		}

		// Validate with schema
		const validated = yield* Effect.try({
			try: () => Schema.decodeUnknownSync(Collection)(result),
			catch: (error) =>
				new CollectionDatabaseError({
					operation: 'getByIdInternal:validation',
					originalError: error,
				}),
		});

		logger.info('✅ Collection encontrada', { id, name: validated.name });
		return validated;
	});

// ============= Service Implementation =============

/**
 * Implementación del servicio CollectionService
 */
export const CollectionServiceLive = Layer.succeed(
	CollectionService,
	CollectionService.of({
		// ============= CRUD Operations =============

		getById: (id: string) =>
			Effect.gen(function* () {
				const collection = yield* getByIdInternal(id);
				return yield* enrichCollectionWithCounts(collection);
			}),

		getAll: (options: GetCollectionsOptions = {}) =>
			Effect.gen(function* () {
				const {
					search,
					parentId,
					onlyFavorites = false,
					orderBy = 'createdAt',
					orderDirection = 'desc',
					limit = 50,
					offset = 0,
				} = options;

				logger.info('📋 Obteniendo collections', {
					search,
					parentId,
					onlyFavorites,
					limit,
					offset,
				});

				// Build conditions
				const conditions = [];
				if (search) {
					conditions.push(or(like(collections.name, `%${search}%`), like(collections.description, `%${search}%`)));
				}
				if (parentId !== undefined) {
					conditions.push(parentId === null ? isNull(collections.parentId) : eq(collections.parentId, parentId));
				}
				if (onlyFavorites) {
					conditions.push(eq(collections.isFavorite, true));
				}

				const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

				// Get total count
				const [countResult] = yield* Effect.tryPromise({
					try: async () => {
						const result = await db.select({ count: count() }).from(collections).where(whereClause);
						return result;
					},
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'getAll:count',
							originalError: error,
						}),
				});

				const total = countResult?.count ?? 0;

				// Get collections
				const orderColumn =
					orderBy === 'name'
						? collections.name
						: orderBy === 'updatedAt'
							? collections.updatedAt
							: collections.createdAt;
				const orderFn = orderDirection === 'asc' ? asc : desc;

				const results = yield* Effect.tryPromise({
					try: async () =>
						await db.query.collections.findMany({
							where: whereClause,
							orderBy: [orderFn(orderColumn)],
							limit,
							offset,
						}),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'getAll:query',
							originalError: error,
						}),
				});

				// Validate and enrich
				const validated: Collection[] = yield* Effect.try({
					try: () => results.map((r: any) => Schema.decodeUnknownSync(Collection)(r)),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'getAll:validation',
							originalError: error,
						}),
				});

				const enriched = yield* Effect.forEach(validated, (c) => enrichCollectionWithCounts(c), {
					concurrency: 'unbounded',
				}).pipe(Effect.mapError((error) => error as CollectionError));

				logger.info('✅ Collections obtenidas', { count: enriched.length, total });

				return {
					collections: enriched,
					total,
					limit,
					offset,
				};
			}),
		create: (input) =>
			Effect.gen(function* () {
				logger.info('➕ Creando collection', { name: input.name });

				// Validate input
				const validated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(CollectionCreateInput)(input),
					catch: (error) =>
						new CollectionValidationError({
							field: 'input',
							message: 'Datos de entrada inválidos',
						}),
				});

				// Check name uniqueness
				yield* checkNameUnique(validated.name);

				// Validate parent if provided
				yield* validateParentExists(validated.parentId);

				// Generate readable ID
				const readableId = generateReadableId('collection', validated.name, 1);

				// Insert to DB
				const now = new Date();
				const [result] = yield* Effect.tryPromise({
					try: async () =>
						await db
							.insert(collections)
							.values({
								id: readableId,
								name: validated.name,
								emoji: validated.emoji ?? null,
								color: validated.color ?? null,
								description: validated.description ?? null,
								featuredImage: validated.featuredImage ?? null,
								isFavorite: validated.isFavorite ?? false,
								parentId: validated.parentId ?? null,
								createdAt: now,
								updatedAt: now,
							})
							.returning(),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'create',
							originalError: error,
						}),
				});

				// Validate returned data
				const created = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Collection)(result),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'create:validation',
							originalError: error,
						}),
				});

				logger.info('✅ Collection creada', { id: created.id, name: created.name });

				return yield* enrichCollectionWithCounts(created);
			}),

		update: (id, input) =>
			Effect.gen(function* () {
				logger.info('🔧 Actualizando collection', { id });

				// Check exists
				const existing = yield* getByIdInternal(id);

				// Validate input
				const validated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(CollectionUpdateInput)(input),
					catch: (error) =>
						new CollectionValidationError({
							field: 'input',
							message: 'Datos de entrada inválidos',
						}),
				});

				// Check name uniqueness if changing name
				if (validated.name && validated.name !== existing.name) {
					yield* checkNameUnique(validated.name, id);
				}

				// Validate parent if provided
				if (validated.parentId !== undefined) {
					yield* validateParentExists(validated.parentId);
				}

				// Update in DB
				const [result] = yield* Effect.tryPromise({
					try: async () =>
						await db
							.update(collections)
							.set({
								...validated,
								updatedAt: new Date(),
							})
							.where(eq(collections.id, id))
							.returning(),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'update',
							originalError: error,
						}),
				});

				// Validate returned data
				const updated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Collection)(result),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'update:validation',
							originalError: error,
						}),
				});

				logger.info('✅ Collection actualizada', { id, name: updated.name });

				return yield* enrichCollectionWithCounts(updated);
			}),

		delete: (id, force = false) =>
			Effect.gen(function* () {
				logger.info('🗑️ Eliminando collection', { id, force });

				// Check exists
				yield* getByIdInternal(id);

				// Check for content unless force
				if (!force) {
					const counts = yield* getRelationsCounts(id);
					if (counts.images > 0 || counts.videos > 0) {
						yield* new CollectionHasContentError({
							collectionId: id,
							imagesCount: counts.images,
							videosCount: counts.videos,
						});
					}
				}

				// Delete from DB
				yield* Effect.tryPromise({
					try: async () => await db.delete(collections).where(eq(collections.id, id)),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'delete',
							originalError: error,
						}),
				});

				logger.info('✅ Collection eliminada', { id });
			}),

		// ============= Relation Operations =============

		addImages: (collectionId, imageIds): Effect.Effect<{ added: number }, CollectionError> =>
			Effect.gen(function* () {
				logger.info('📎 Agregando imágenes a collection', {
					collectionId,
					count: imageIds.length,
				});

				// Verify collection exists
				yield* getByIdInternal(collectionId);

				let added = 0;

				for (const imageId of imageIds) {
					// Try to insert, if fails (duplicate), skip and continue
					const result = yield* Effect.tryPromise({
						try: async () => {
							await db.insert(imageCollections).values({
								A: imageId, // A = imageId
								B: collectionId, // B = collectionId
							});
							return true;
						},
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'addImages',
								originalError: error,
							}),
					}).pipe(
						Effect.catchTag('CollectionDatabaseError', () => Effect.succeed(false)) // Skip duplicates
					);

					if (result) added++;
				}

				logger.info('✅ Imágenes agregadas', { added });
				return { added };
			}),

		removeImage: (collectionId, imageId) =>
			Effect.gen(function* () {
				logger.info('✂️ Removiendo imagen de collection', { collectionId, imageId });

				yield* Effect.tryPromise({
					try: async () =>
						await db
							.delete(imageCollections)
							.where(and(eq(imageCollections.A, imageId), eq(imageCollections.B, collectionId))),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'removeImage',
							originalError: error,
						}),
				});

				logger.info('✅ Imagen removida');
			}),

		getImages: (collectionId, options = {}) =>
			Effect.gen(function* () {
				logger.info('🖼️ Obteniendo imágenes de collection', { collectionId });

				const { limit = 50, offset = 0 } = options;
				const results = yield* Effect.tryPromise({
					try: async () =>
						await db
							.select({
								image: images,
							})
							.from(imageCollections)
							.innerJoin(images, eq(imageCollections.A, images.id))
							.where(eq(imageCollections.B, collectionId))
							.limit(limit)
							.offset(offset),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'getImages',
							originalError: error,
						}),
				});

				logger.info('✅ Imágenes obtenidas', { count: results.length });

				return results.map((r: { image: any }) => r.image);
			}),

		// ============= Stats Operations =============

		toggleFavorite: (id) =>
			Effect.gen(function* () {
				logger.info('⭐ Toggle favorite collection', { id });

				const collection = yield* getByIdInternal(id);
				const newValue = !collection.isFavorite;

				const [result] = yield* Effect.tryPromise({
					try: async () =>
						await db
							.update(collections)
							.set({
								isFavorite: newValue,
								updatedAt: new Date(),
							})
							.where(eq(collections.id, id))
							.returning(),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'toggleFavorite',
							originalError: error,
						}),
				});

				const updated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(Collection)(result),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'toggleFavorite:validation',
							originalError: error,
						}),
				});

				logger.info('✅ Favorite toggled', { id, isFavorite: newValue });

				return yield* enrichCollectionWithCounts(updated);
			}),

		// ============= Search Operations =============

		search: (query): Effect.Effect<CollectionWithStats[], CollectionError> =>
			Effect.gen(function* () {
				logger.info('🔍 Buscando collections', { query });

				const results = yield* Effect.tryPromise({
					try: async () =>
						await db.query.collections.findMany({
							where: or(like(collections.name, `%${query}%`), like(collections.description, `%${query}%`)),
							limit: 50,
						}),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'search',
							originalError: error,
						}),
				});

				const validated: Collection[] = yield* Effect.try({
					try: () => results.map((r: any) => Schema.decodeUnknownSync(Collection)(r)),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'search:validation',
							originalError: error,
						}),
				});

				const enriched = yield* Effect.forEach(validated, (c) => enrichCollectionWithCounts(c), {
					concurrency: 'unbounded',
				}).pipe(Effect.mapError((error) => error as CollectionError));

				logger.info('✅ Collections encontradas', { count: enriched.length });

				return enriched;
			}),
	})
);
