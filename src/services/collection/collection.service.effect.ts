/**
 * @file CollectionService implementado con Effect
 * @module services/collection/collection.service.effect
 * @description Servicio Collection con manejo funcional de errores usando Effect-TS
 * @created 2025-10-11 - Phase 5: Collection Migration
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, inArray, isNull, like, ne, or } from 'drizzle-orm';
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
import { favoriteService } from '@/services/favorite/favorite.service';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import type { CollectionError } from './collection-errors.effect';
import {
	CollectionDatabaseError,
	CollectionHasContentError,
	CollectionNotFound,
	CollectionValidationError,
} from './collection-errors.effect';

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

// Logger específico
const logger = createSafeLogger('CollectionService.Effect');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSqliteBusyError = (error: unknown) => {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.message.includes('SQLITE_BUSY') || error.message.includes('database is locked');
};

const isUniqueConstraintError = (error: unknown) => {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.message.includes('SQLITE_CONSTRAINT') || error.message.includes('UNIQUE constraint failed');
};

const withSqliteBusyRetry = async <T>(operation: () => Promise<T>, retries = 20): Promise<T> => {
	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (!isSqliteBusyError(error) || attempt === retries) {
				throw error;
			}

			await wait(50 * (attempt + 1));
		}
	}

	throw lastError;
};

const normalizeCollectionRow = (row: Partial<typeof collections.$inferSelect> | null | undefined) => {
	if (!row) {
		return null;
	}

	const createdAt = row.createdAt ?? new Date();

	return {
		...row,
		color: row.color ?? null,
		createdAt,
		description: row.description ?? null,
		emoji: row.emoji ?? null,
		featuredImage: row.featuredImage ?? null,
		isFavorite: row.isFavorite ?? false,
		lastImageAddedAt: row.lastImageAddedAt ?? null,
		lastVideoAddedAt: row.lastVideoAddedAt ?? null,
		parentId: row.parentId ?? null,
		updatedAt: row.updatedAt ?? createdAt,
	};
};

const decodeCollectionRow = (row: Partial<typeof collections.$inferSelect> | null | undefined) =>
	Schema.decodeUnknownSync(Collection)(normalizeCollectionRow(row));

const toRowArray = <TRow>(value: TRow | TRow[] | null | undefined): TRow[] => {
	if (Array.isArray(value)) {
		return value;
	}

	return value == null ? [] : [value];
};

const stripLegacyFavoriteInput = <TInput>(input: TInput): TInput => {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return input;
	}

	const { isFavorite: _legacyIsFavorite, ...rest } = input as Record<string, unknown>;
	return rest as TInput;
};

const getCollectionFavoriteIds = (): Effect.Effect<string[], CollectionDatabaseError> =>
	Effect.tryPromise({
		try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.COLLECTION),
		catch: (error) =>
			new CollectionDatabaseError({
				operation: 'getCollectionFavoriteIds',
				originalError: error,
			}),
	});

const applyCollectionFavoriteProjection = (collection: Collection, favoriteEntityIds: readonly string[]): Collection =>
	favoriteService.applyFavoriteProjection(collection, favoriteEntityIds);

const applyCollectionFavoriteProjectionMany = (
	collections: Collection[],
	favoriteEntityIds: readonly string[]
): Collection[] => favoriteService.applyFavoriteProjectionMany(collections, favoriteEntityIds);

/**
 * Opciones para obtener colecciones
 */
export interface GetCollectionsOptions {
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	parentId?: string | null;
	search?: string;
}

/**
 * Resultado de obtener colecciones con paginación
 */
export interface GetCollectionsResult {
	collections: CollectionWithStats[];
	limit: number;
	offset: number;
	total: number;
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
	errors: Array<{ id: string; error: string }>;
	failed: number;
	successful: number;
}

/**
 * Interface para el servicio CollectionService
 */
export interface CollectionServiceInterface {
	// Relation Operations
	readonly addImages: (collectionId: string, imageIds: string[]) => Effect.Effect<{ added: number }, CollectionError>;
	readonly create: (
		input: Schema.Schema.Type<typeof CollectionCreateInput>
	) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly delete: (id: string, force?: boolean) => Effect.Effect<void, CollectionError>;
	readonly getAll: (options?: GetCollectionsOptions) => Effect.Effect<GetCollectionsResult, CollectionError>;
	// CRUD Operations
	readonly getById: (id: string) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly getImages: (
		collectionId: string,
		options?: { limit?: number; offset?: number }
	) => Effect.Effect<any[], CollectionError>;
	readonly removeImage: (collectionId: string, imageId: string) => Effect.Effect<void, CollectionError>;

	// Search Operations
	readonly search: (query: string) => Effect.Effect<CollectionWithStats[], CollectionError>;

	// Stats Operations
	readonly toggleFavorite: (id: string) => Effect.Effect<CollectionWithStats, CollectionError>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof CollectionUpdateInput>
	) => Effect.Effect<CollectionWithStats, CollectionError>;
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

		const imageCountRows = toRowArray(
			(yield* Effect.tryPromise({
				try: async () =>
					await withSqliteBusyRetry(
						async () =>
							await db
								.select({ count: count() })
								.from(imageCollections)
								.innerJoin(images, eq(imageCollections.A, images.id))
								.where(and(eq(imageCollections.B, id), visibleImageLifecycleCondition()))
								.execute()
					), // B = collectionId
				catch: (error) =>
					new CollectionDatabaseError({
						operation: 'getRelationsCounts:images',
						originalError: error,
					}),
			})) as Array<{ count: number }> | { count: number }
		);
		const [imagesCountResult] = imageCountRows;

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

		const parent = toRowArray(
			yield* Effect.tryPromise({
				try: async () =>
					await withSqliteBusyRetry(
						async () =>
							await db.select({ id: collections.id }).from(collections).where(eq(collections.id, parentId)).execute()
					),
				catch: (error) =>
					new CollectionDatabaseError({
						operation: 'validateParentExists',
						originalError: error,
					}),
			})
		);

		if (parent.length === 0) {
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
		const existing = toRowArray(
			yield* Effect.tryPromise({
				try: async () => {
					if (excludeId) {
						// Check for other collections with same name
						const result = await withSqliteBusyRetry(
							async () =>
								await db
									.select({ id: collections.id, name: collections.name })
									.from(collections)
									.where(and(eq(collections.name, name), ne(collections.id, excludeId)))
									.execute()
						);
						return result;
					}
					// Check for any collection with same name
					return await withSqliteBusyRetry(
						async () =>
							await db
								.select({ id: collections.id, name: collections.name })
								.from(collections)
								.where(eq(collections.name, name))
								.execute()
					);
				},
				catch: (error) =>
					new CollectionDatabaseError({
						operation: 'checkNameUnique',
						originalError: error,
					}),
			})
		);

		if (existing.length > 0) {
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

		const result = toRowArray(
			yield* Effect.tryPromise({
				try: async () =>
					await withSqliteBusyRetry(
						async () => await db.select().from(collections).where(eq(collections.id, id)).limit(1).execute()
					),
				catch: (error) =>
					new CollectionDatabaseError({
						operation: 'getByIdInternal',
						originalError: error,
					}),
			})
		);

		if (result.length === 0) {
			logger.warn('❌ Collection no encontrada', { id });
			yield* new CollectionNotFound({ collectionId: id });
		}

		// Validate with schema
		const validated = yield* Effect.try({
			try: () => decodeCollectionRow(result[0]),
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
				const favoriteEntityIds = yield* getCollectionFavoriteIds();
				return yield* enrichCollectionWithCounts(applyCollectionFavoriteProjection(collection, favoriteEntityIds));
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

				const favoriteEntityIds = yield* getCollectionFavoriteIds();

				// Build conditions
				const conditions = [];
				if (search) {
					conditions.push(or(like(collections.name, `%${search}%`), like(collections.description, `%${search}%`)));
				}
				if (parentId !== undefined) {
					conditions.push(parentId === null ? isNull(collections.parentId) : eq(collections.parentId, parentId));
				}
				if (onlyFavorites) {
					if (favoriteEntityIds.length === 0) {
						return {
							collections: [],
							total: 0,
							limit,
							offset,
						};
					} else {
						conditions.push(inArray(collections.id, favoriteEntityIds));
					}
				}

				const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

				// Get total count
				const countRows = toRowArray(
					(yield* Effect.tryPromise({
						try: async () => {
							const result = await withSqliteBusyRetry(
								async () => await db.select({ count: count() }).from(collections).where(whereClause).execute()
							);
							return result;
						},
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'getAll:count',
								originalError: error,
							}),
					})) as Array<{ count: number }> | { count: number }
				);
				const [countResult] = countRows;

				const total = countResult?.count ?? 0;

				// Get collections
				const orderColumn =
					orderBy === 'name'
						? collections.name
						: orderBy === 'updatedAt'
							? collections.updatedAt
							: collections.createdAt;
				const orderFn = orderDirection === 'asc' ? asc : desc;

				const results = toRowArray(
					(yield* Effect.tryPromise({
						try: async () =>
							await withSqliteBusyRetry(
								async () =>
									await db
										.select()
										.from(collections)
										.where(whereClause)
										.orderBy(orderFn(orderColumn))
										.limit(limit)
										.offset(offset)
										.execute()
							),
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'getAll:query',
								originalError: error,
							}),
					})) as Array<typeof collections.$inferSelect> | typeof collections.$inferSelect
				);

				// Validate and enrich
				const validated: Collection[] = yield* Effect.try({
					try: () => results.map((r) => decodeCollectionRow(r)),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'getAll:validation',
							originalError: error,
						}),
				});

				const normalizedCollections = applyCollectionFavoriteProjectionMany(validated, favoriteEntityIds);

				const enriched = yield* Effect.forEach(normalizedCollections, (c) => enrichCollectionWithCounts(c), {
					concurrency: 1,
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
				const sanitizedInput = stripLegacyFavoriteInput(input);

				// Validate input
				const validated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(CollectionCreateInput)(sanitizedInput),
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
				const createdRows = (yield* Effect.tryPromise({
					try: async () =>
						await withSqliteBusyRetry(
							async () =>
								await db
									.insert(collections)
									.values({
										id: readableId,
										name: validated.name,
										emoji: validated.emoji ?? null,
										color: validated.color ?? null,
										description: validated.description ?? null,
										featuredImage: validated.featuredImage ?? null,
										parentId: validated.parentId ?? null,
										createdAt: now,
										updatedAt: now,
									})
									.returning()
									.execute()
						),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'create',
							originalError: error,
						}),
				})) as Array<typeof collections.$inferSelect>;
				const [result] = createdRows;

				// Validate returned data
				const created = yield* Effect.try({
					try: () => decodeCollectionRow(result),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'create:validation',
							originalError: error,
						}),
				});

				logger.info('✅ Collection creada', { id: created.id, name: created.name });

				const favoriteEntityIds = yield* getCollectionFavoriteIds();
				return yield* enrichCollectionWithCounts(applyCollectionFavoriteProjection(created, favoriteEntityIds));
			}),

		update: (id, input) =>
			Effect.gen(function* () {
				logger.info('🔧 Actualizando collection', { id });
				const sanitizedInput = stripLegacyFavoriteInput(input);

				// Check exists
				const existing = yield* getByIdInternal(id);

				// Validate input
				const validated = yield* Effect.try({
					try: () => Schema.decodeUnknownSync(CollectionUpdateInput)(sanitizedInput),
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
				const updatedRows = (yield* Effect.tryPromise({
					try: async () =>
						await withSqliteBusyRetry(
							async () =>
								await db
									.update(collections)
									.set({
										...validated,
										updatedAt: new Date(),
									})
									.where(eq(collections.id, id))
									.returning()
									.execute()
						),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'update',
							originalError: error,
						}),
				})) as Array<typeof collections.$inferSelect>;
				const [result] = updatedRows;

				// Validate returned data
				const updated = yield* Effect.try({
					try: () => decodeCollectionRow(result),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'update:validation',
							originalError: error,
						}),
				});

				logger.info('✅ Collection actualizada', { id, name: updated.name });

				const favoriteEntityIds = yield* getCollectionFavoriteIds();
				return yield* enrichCollectionWithCounts(applyCollectionFavoriteProjection(updated, favoriteEntityIds));
			}),

		delete: (id, force = false) =>
			Effect.gen(function* () {
				logger.info('🗑️ Eliminando collection', { id, force });

				// Check exists
				yield* getByIdInternal(id);

				// Check for content unless force
				if (!force) {
					const storedImageCounts = toRowArray(
						(yield* Effect.tryPromise({
							try: () => db.select({ count: count() }).from(imageCollections).where(eq(imageCollections.B, id)),
							catch: (error) =>
								new CollectionDatabaseError({ operation: 'delete:stored-relations', originalError: error }),
						})) as Array<{ count: number }> | { count: number }
					);
					const storedImages = storedImageCounts[0]?.count ?? 0;
					if (storedImages > 0) {
						yield* new CollectionHasContentError({
							collectionId: id,
							imagesCount: storedImages,
							videosCount: 0,
						});
					}
				}

				if (force) {
					yield* Effect.tryPromise({
						try: async () =>
							await withSqliteBusyRetry(
								async () => await db.delete(imageCollections).where(eq(imageCollections.B, id)).execute()
							),
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'delete:relations',
								originalError: error,
							}),
					});
				}

				// Delete from DB
				yield* Effect.tryPromise({
					try: async () =>
						await withSqliteBusyRetry(async () => await db.delete(collections).where(eq(collections.id, id)).execute()),
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

				const uniqueImageIds = [...new Set(imageIds)];

				if (uniqueImageIds.length === 0) return { added: 0 };

				// El INSERT múltiple es una frontera atómica y evita la carrera read-then-write.
				const inserted = (yield* Effect.tryPromise({
					try: () =>
						withSqliteBusyRetry(() =>
							db
								.insert(imageCollections)
								.values(uniqueImageIds.map((imageId) => ({ A: imageId, B: collectionId })))
								.onConflictDoNothing()
								.returning({ imageId: imageCollections.A })
						),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'addImages:atomicInsert',
							originalError: error,
						}),
				})) as Array<{ imageId: string }>;

				logger.info('✅ Imágenes agregadas atómicamente', { added: inserted.length });
				return { added: inserted.length };
			}),

		removeImage: (collectionId, imageId) =>
			Effect.gen(function* () {
				logger.info('✂️ Removiendo imagen de collection', { collectionId, imageId });

				yield* Effect.tryPromise({
					try: async () =>
						await withSqliteBusyRetry(
							async () =>
								await db
									.delete(imageCollections)
									.where(and(eq(imageCollections.A, imageId), eq(imageCollections.B, collectionId)))
									.execute()
						),
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
				const results = toRowArray(
					(yield* Effect.tryPromise({
						try: async () =>
							await withSqliteBusyRetry(
								async () =>
									await db
										.select({
											image: images,
										})
										.from(imageCollections)
										.innerJoin(images, eq(imageCollections.A, images.id))
										.where(and(eq(imageCollections.B, collectionId), visibleImageLifecycleCondition()))
										.orderBy(desc(images.updatedAt), asc(images.id))
										.limit(limit)
										.offset(offset)
										.execute()
							),
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'getImages',
								originalError: error,
							}),
					})) as Array<{ image: typeof images.$inferSelect }> | { image: typeof images.$inferSelect }
				);

				logger.info('✅ Imágenes obtenidas', { count: results.length });

				return results.map((r: { image: any }) => r.image);
			}),

		// ============= Stats Operations =============

		toggleFavorite: (id) =>
			Effect.gen(function* () {
				logger.info('⭐ Toggle favorite collection', { id });

				yield* getByIdInternal(id);
				const currentFavoriteStatus = yield* Effect.tryPromise({
					try: () => favoriteService.isFavorite(FavoriteEntityType.COLLECTION, id),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'toggleFavorite:isFavorite',
							originalError: error,
						}),
				});
				const newFavoriteStatus = !currentFavoriteStatus;

				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.COLLECTION, id, newFavoriteStatus),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'toggleFavorite:set',
							originalError: error,
						}),
				});

				const refreshed = yield* getByIdInternal(id);
				const favoriteEntityIds = yield* getCollectionFavoriteIds();
				const updated = applyCollectionFavoriteProjection(refreshed, favoriteEntityIds);

				logger.info('✅ Favorite toggled', { id, isFavorite: updated.isFavorite });

				return yield* enrichCollectionWithCounts(updated);
			}),

		// ============= Search Operations =============

		search: (query): Effect.Effect<CollectionWithStats[], CollectionError> =>
			Effect.gen(function* () {
				logger.info('🔍 Buscando collections', { query });

				const results = toRowArray(
					(yield* Effect.tryPromise({
						try: async () =>
							await withSqliteBusyRetry(
								async () =>
									await db
										.select()
										.from(collections)
										.where(or(like(collections.name, `%${query}%`), like(collections.description, `%${query}%`)))
										.limit(50)
										.execute()
							),
						catch: (error) =>
							new CollectionDatabaseError({
								operation: 'search',
								originalError: error,
							}),
					})) as Array<typeof collections.$inferSelect> | typeof collections.$inferSelect
				);

				const validated: Collection[] = yield* Effect.try({
					try: () => results.map((r) => decodeCollectionRow(r)),
					catch: (error) =>
						new CollectionDatabaseError({
							operation: 'search:validation',
							originalError: error,
						}),
				});

				const favoriteEntityIds = yield* getCollectionFavoriteIds();
				const normalizedCollections = applyCollectionFavoriteProjectionMany(validated, favoriteEntityIds);

				const enriched = yield* Effect.forEach(normalizedCollections, (c) => enrichCollectionWithCounts(c), {
					concurrency: 1,
				}).pipe(Effect.mapError((error) => error as CollectionError));

				logger.info('✅ Collections encontradas', { count: enriched.length });

				return enriched;
			}),
	})
);
