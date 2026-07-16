/**
 * =================================================================================
 * JSON FILE SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de archivos JSON con Effect-TS para operaciones CRUD.
 * =================================================================================
 */

import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { folders, jsonFiles } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	deleteFavoriteRecordsForEntities,
	emitCommittedFavoriteChange,
	setFavoriteForActiveProfile,
} from '@/services/favorite/favorite-write-transaction';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import {
	assertCanonicalMediaCreateCommand,
	createCanonicalMedia,
	projectCanonicalMediaRow,
	projectCanonicalMediaRows,
	restoreCanonicalAsset,
	tombstoneCanonicalAsset,
	updateCanonicalMediaProjection,
	visibleAssetLifecycleCondition,
	type CanonicalMediaSourceInput,
	type CanonicalMediaState,
} from '@/services/media-core/canonical-media-persistence';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	JsonFileDatabaseError,
	JsonFileError,
	JsonFileNotFound,
	JsonFileValidationError,
} from './json-file-errors.effect';

// =================================================================================
// TYPES & INTERFACES
// =================================================================================

const SERVICE_NAME = 'JsonFileServiceEffect';
const jsonFileLogger = serverLogger.withContext(SERVICE_NAME);

export interface CreateJsonFileInput {
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	content?: string | null;
	schema?: string | null;
	isValid?: boolean;
	validationErrors?: string | null;
	keyCount?: number | null;
	depth?: number | null;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	shortcut?: string | null;
	category?: string | null;
	filePath?: string | null;
	fileName?: string | null;
	fileSize?: number | null;
	tags?: string | null;
	metadata?: string | null;
	sortBy?: string | null;
	filters?: string | null;
	featuredImage?: string | null;
	validJson?: boolean;
	schemaVersion?: string | null;
	keys?: string | null;
	values?: string | null;
	hasArrays?: boolean;
	hasObjects?: boolean;
	encoding?: string | null;
	compressed?: boolean;
	minified?: boolean;
	prettyPrinted?: boolean;
	parsedContent?: string | null;
	source: CanonicalMediaSourceInput;
}

export type UpdateJsonFileInput = Partial<CreateJsonFileInput>;

export interface JsonFileFilters {
	folderId?: string;
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	mimeType?: string;
	extension?: string;
	isValid?: boolean;
	category?: string;
	minSize?: number;
	maxSize?: number;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface JsonFileRow {
	assetId: string | null;
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite: boolean;
	isArchived: boolean;
	content: string | null;
	schema: string | null;
	isValid: boolean | null;
	validationErrors: string | null;
	keyCount: number | null;
	depth: number | null;
	description: string | null;
	emoji: string | null;
	color: string | null;
	shortcut: string | null;
	category: string | null;
	filePath: string | null;
	fileName: string | null;
	fileSize: number | null;
	tags: string | null;
	metadata: string | null;
	sortBy: string | null;
	filters: string | null;
	featuredImage: string | null;
	validJson: boolean | null;
	schemaVersion: string | null;
	keys: string | null;
	values: string | null;
	hasArrays: boolean | null;
	hasObjects: boolean | null;
	encoding: string | null;
	compressed: boolean | null;
	minified: boolean | null;
	prettyPrinted: boolean | null;
	parsedContent: string | null;
	createdAt: Date;
	updatedAt: Date;
	canonicalDivergences: string[];
	canonicalState: CanonicalMediaState;
	legacyId: string;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}

// =================================================================================
// SERVICE INTERFACE & TAG
// =================================================================================

export interface JsonFileServiceInterface {
	readonly create: (input: CreateJsonFileInput) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly delete: (id: string) => Effect.Effect<void, JsonFileError>;
	readonly getAll: (filters?: JsonFileFilters) => Effect.Effect<PaginatedResult<JsonFileRow>, JsonFileError>;
	readonly getByHash: (hash: string) => Effect.Effect<JsonFileRow | null, JsonFileError>;
	readonly getById: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly getImages: (id: string) => Effect.Effect<unknown[], JsonFileError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<JsonFileRow | null, JsonFileError>;
	readonly update: (id: string, input: UpdateJsonFileInput) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly restoreById: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
}

export class JsonFileService extends Context.Tag('JsonFileService')<JsonFileService, JsonFileServiceInterface>() {}

// =================================================================================
// HELPERS
// =================================================================================

function toJsonFileError(operation: string, error: unknown): JsonFileError {
	jsonFileLogger.error(`Error en operación ${operation}:`, error);

	if (error && typeof error === 'object' && '_tag' in error) {
		return error as JsonFileError;
	}

	const message = error instanceof Error ? error.message : String(error);
	return new JsonFileDatabaseError({ operation, reason: message, originalError: error });
}

function validateCreateInput(input: CreateJsonFileInput): void {
	if (!input.name || input.name.trim().length === 0) {
		throw new JsonFileValidationError({ field: 'name', value: input.name, reason: 'El nombre es requerido' });
	}
	if (!input.path || input.path.trim().length === 0) {
		throw new JsonFileValidationError({ field: 'path', value: input.path, reason: 'El path es requerido' });
	}
	if (!/^[0-9a-f]{64}$/.test(input.hash)) {
		throw new JsonFileValidationError({
			field: 'hash',
			value: input.hash,
			reason: 'El hash debe ser SHA-256 lowercase',
		});
	}
	if (input.size < 0) {
		throw new JsonFileValidationError({ field: 'size', value: input.size, reason: 'El size no puede ser negativo' });
	}
	if (!input.mimeType) {
		throw new JsonFileValidationError({
			field: 'mimeType',
			value: input.mimeType,
			reason: 'El mimeType es requerido',
		});
	}
	if (!input.extension) {
		throw new JsonFileValidationError({
			field: 'extension',
			value: input.extension,
			reason: 'La extensión es requerida',
		});
	}
}

// =================================================================================
// IMPLEMENTATION
// =================================================================================

const make = (): JsonFileServiceInterface => {
	const getById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Obteniendo jsonFile por ID:', id);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('getById', error),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'json'),
						catch: (error) => toJsonFileError('getById:canonicalProjection', error),
					})
				: null;
			if (!projected) {
				return yield* Effect.fail(new JsonFileNotFound({ id, message: `Archivo JSON con ID ${id} no encontrado` }));
			}

			return yield* Effect.tryPromise({
				try: () =>
					favoriteService.projectEntityWithLegacyFallback(FavoriteEntityType.JSON_FILE, projected as JsonFileRow),
				catch: (error) => toJsonFileError('getById:favoriteProjection', error),
			});
		});

	const getByHash = (hash: string): Effect.Effect<JsonFileRow | null, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Buscando jsonFile por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(jsonFiles)
						.where(and(eq(jsonFiles.hash, hash), visibleAssetLifecycleCondition(jsonFiles.assetId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('getByHash', error),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'json'),
						catch: (error) => toJsonFileError('getByHash:canonicalProjection', error),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () =>
					favoriteService.projectEntityWithLegacyFallback(FavoriteEntityType.JSON_FILE, projected as JsonFileRow),
				catch: (error) => toJsonFileError('getByHash:favoriteProjection', error),
			});
		});

	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<JsonFileRow | null, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Buscando jsonFile por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(jsonFiles)
						.where(
							and(
								eq(jsonFiles.path, path),
								eq(jsonFiles.folderId, folderId),
								visibleAssetLifecycleCondition(jsonFiles.assetId)
							)
						)
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('getByPathAndFolder', error),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'json'),
						catch: (error) => toJsonFileError('getByPathAndFolder:canonicalProjection', error),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () =>
					favoriteService.projectEntityWithLegacyFallback(FavoriteEntityType.JSON_FILE, projected as JsonFileRow),
				catch: (error) => toJsonFileError('getByPathAndFolder:favoriteProjection', error),
			});
		});

	const getAll = (filters: JsonFileFilters = {}): Effect.Effect<PaginatedResult<JsonFileRow>, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Obteniendo lista de jsonFiles con filtros:', filters);

			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			const favoriteEntityIds: string[] | null = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
				catch: (error) => toJsonFileError('getAll:favoriteIds', error),
			});

			if (filters.isFavorite === true && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0, limit, offset };
			}

			const conditions: any[] = [visibleAssetLifecycleCondition(jsonFiles.assetId)];

			if (filters.folderId) {
				conditions.push(eq(jsonFiles.folderId, filters.folderId));
			}
			if (filters.search) {
				conditions.push(
					or(
						like(jsonFiles.name, `%${filters.search}%`),
						like(jsonFiles.description, `%${filters.search}%`),
						like(jsonFiles.content, `%${filters.search}%`)
					)
				);
			}
			if (filters.isFavorite !== undefined) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(jsonFiles.isFavorite, filters.isFavorite));
				} else if (filters.isFavorite) {
					conditions.push(inArray(jsonFiles.id, favoriteEntityIds));
				} else if (favoriteEntityIds.length > 0) {
					conditions.push(notInArray(jsonFiles.id, favoriteEntityIds));
				}
			}
			if (filters.isArchived !== undefined) {
				conditions.push(eq(jsonFiles.isArchived, filters.isArchived));
			}
			if (filters.mimeType) {
				conditions.push(eq(jsonFiles.mimeType, filters.mimeType));
			}
			if (filters.extension) {
				conditions.push(eq(jsonFiles.extension, filters.extension));
			}
			if (filters.isValid !== undefined) {
				conditions.push(eq(jsonFiles.isValid, filters.isValid));
			}
			if (filters.category) {
				conditions.push(eq(jsonFiles.category, filters.category));
			}
			if (filters.minSize) {
				conditions.push(gte(jsonFiles.size, filters.minSize));
			}
			if (filters.maxSize) {
				conditions.push(lte(jsonFiles.size, filters.maxSize));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const sortBy = filters.sortBy || 'name';
			const orderFn = filters.sortOrder === 'desc' ? desc : asc;
			let orderByClause: any;
			switch (sortBy) {
				case 'createdAt':
					orderByClause = orderFn(jsonFiles.createdAt);
					break;
				case 'updatedAt':
					orderByClause = orderFn(jsonFiles.updatedAt);
					break;
				case 'size':
					orderByClause = orderFn(jsonFiles.size);
					break;
				default:
					orderByClause = orderFn(jsonFiles.name);
			}

			const [rows, totalResult] = yield* Effect.tryPromise({
				try: () =>
					Promise.all([
						db
							.select()
							.from(jsonFiles)
							.where(whereClause)
							.orderBy(orderByClause, orderFn(jsonFiles.id))
							.limit(limit)
							.offset(offset),
						db.select({ count: count() }).from(jsonFiles).where(whereClause),
					]),
				catch: (error) => toJsonFileError('getAll', error),
			});

			const total = totalResult[0]?.count ?? 0;
			const projectedRows = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: async () => (await projectCanonicalMediaRows(rows, 'json')) as JsonFileRow[],
				catch: (error) => toJsonFileError('getAll:canonicalProjection', error),
			});

			return {
				data:
					favoriteEntityIds === null
						? projectedRows
						: favoriteService.applyFavoriteProjectionMany(projectedRows, favoriteEntityIds),
				total,
				limit,
				offset,
			};
		});

	const create = (input: CreateJsonFileInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Creando jsonFile:', input.name);

			try {
				validateCreateInput(input);
				assertCanonicalMediaCreateCommand({
					assetType: 'json',
					folderId: input.folderId,
					hash: input.hash,
					name: input.name,
					path: input.path,
					size: input.size,
					source: input.source,
				});
			} catch (error) {
				return yield* Effect.fail(error as JsonFileError);
			}

			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite === true
					? yield* Effect.tryPromise({
							try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
							catch: (error) => toJsonFileError('create:favoriteScope', error),
						})
					: false;

			let committedFavoriteProfileId: string | null = null;
			const result = yield* Effect.tryPromise({
				try: () =>
					createCanonicalMedia(
						{
							assetType: 'json',
							folderId: input.folderId,
							hash: input.hash,
							name: input.name,
							path: input.path,
							size: input.size,
							source: input.source,
						},
						async ({ assetId, now, transaction }) => {
							const inserted = await transaction
								.insert(jsonFiles)
								.values({
									id: assetId,
									assetId,
									name: input.name,
									path: input.path,
									size: input.size,
									hash: input.hash,
									mimeType: input.mimeType,
									extension: input.extension,
									folderId: input.folderId,
									isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
									isArchived: input.isArchived ?? false,
									content: input.content ?? null,
									schema: input.schema ?? null,
									isValid: input.isValid ?? true,
									validationErrors: input.validationErrors ?? null,
									keyCount: input.keyCount ?? 0,
									depth: input.depth ?? 0,
									description: input.description ?? null,
									emoji: input.emoji ?? null,
									color: input.color ?? null,
									shortcut: input.shortcut ?? null,
									category: input.category ?? null,
									filePath: input.filePath ?? null,
									fileName: input.fileName ?? null,
									fileSize: input.fileSize ?? null,
									tags: input.tags ?? null,
									metadata: input.metadata ?? null,
									sortBy: input.sortBy ?? null,
									filters: input.filters ?? null,
									featuredImage: input.featuredImage ?? null,
									validJson: input.validJson ?? false,
									schemaVersion: input.schemaVersion ?? null,
									keys: input.keys ?? null,
									values: input.values ?? null,
									hasArrays: input.hasArrays ?? false,
									hasObjects: input.hasObjects ?? false,
									encoding: input.encoding ?? null,
									compressed: input.compressed ?? false,
									minified: input.minified ?? false,
									prettyPrinted: input.prettyPrinted ?? false,
									parsedContent: input.parsedContent ?? null,
									createdAt: now,
									updatedAt: now,
								})
								.returning();
							const created = inserted[0];
							if (created && requestedIsFavorite && useCanonicalFavoriteBridge) {
								committedFavoriteProfileId = await setFavoriteForActiveProfile(
									transaction,
									FavoriteEntityType.JSON_FILE,
									created.id,
									true
								);
							}
							return created;
						}
					),
				catch: (error) => toJsonFileError('create:insert', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new JsonFileDatabaseError({
						operation: 'create',
						reason: 'No se pudo crear el archivo JSON',
					})
				);
			}

			if (committedFavoriteProfileId) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(committedFavoriteProfileId!, FavoriteEntityType.JSON_FILE, result.id, true)
				);
			}

			jsonFileLogger.info('JsonFile creado exitosamente:', result.id);
			return yield* getById(result.id);
		});

	const update = (id: string, input: UpdateJsonFileInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Actualizando jsonFile:', id);

			const current = yield* getById(id);
			if (input.hash !== undefined && !/^[0-9a-f]{64}$/.test(input.hash)) {
				return yield* Effect.fail(
					new JsonFileValidationError({
						field: 'hash',
						value: input.hash,
						reason: 'El hash debe ser SHA-256 lowercase',
					})
				);
			}
			if (current.assetId && (input.path !== undefined || input.folderId !== undefined) && !input.source) {
				return yield* Effect.fail(
					new JsonFileValidationError({
						field: 'source',
						value: input.source,
						reason: 'Mover un JsonFile canónico requiere una source autorizada',
					})
				);
			}
			if (current.assetId && input.source) {
				try {
					assertCanonicalMediaCreateCommand({
						assetType: 'json',
						folderId: input.folderId ?? current.folderId,
						hash: input.hash ?? current.hash,
						name: input.name ?? current.name,
						path: input.path ?? current.path,
						size: input.size ?? current.size,
						source: input.source,
					});
				} catch (error) {
					return yield* Effect.fail(
						new JsonFileValidationError({ field: 'source', value: input.source, reason: String(error) })
					);
				}
			}

			const requestedIsFavorite = typeof input.isFavorite === 'boolean' ? input.isFavorite : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
							try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
							catch: (error) => toJsonFileError('update:favoriteScope', error),
						})
					: false;

			const updateData: Record<string, unknown> = { updatedAt: new Date() };
			if (requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge) {
				updateData.isFavorite = requestedIsFavorite;
			}

			if (input.name !== undefined) updateData.name = input.name;
			if (input.path !== undefined) updateData.path = input.path;
			if (input.size !== undefined) updateData.size = input.size;
			if (input.hash !== undefined) updateData.hash = input.hash;
			if (input.mimeType !== undefined) updateData.mimeType = input.mimeType;
			if (input.extension !== undefined) updateData.extension = input.extension;
			if (input.folderId !== undefined) updateData.folderId = input.folderId;
			if (input.isArchived !== undefined) updateData.isArchived = Boolean(input.isArchived);
			if (input.content !== undefined) updateData.content = input.content;
			if (input.schema !== undefined) updateData.schema = input.schema;
			if (input.isValid !== undefined) updateData.isValid = Boolean(input.isValid);
			if (input.validationErrors !== undefined) updateData.validationErrors = input.validationErrors;
			if (input.keyCount !== undefined) updateData.keyCount = input.keyCount;
			if (input.depth !== undefined) updateData.depth = input.depth;
			if (input.description !== undefined) updateData.description = input.description;
			if (input.emoji !== undefined) updateData.emoji = input.emoji;
			if (input.color !== undefined) updateData.color = input.color;
			if (input.shortcut !== undefined) updateData.shortcut = input.shortcut;
			if (input.category !== undefined) updateData.category = input.category;
			if (input.filePath !== undefined) updateData.filePath = input.filePath;
			if (input.fileName !== undefined) updateData.fileName = input.fileName;
			if (input.fileSize !== undefined) updateData.fileSize = input.fileSize;
			if (input.tags !== undefined) updateData.tags = input.tags;
			if (input.metadata !== undefined) updateData.metadata = input.metadata;
			if (input.sortBy !== undefined) updateData.sortBy = input.sortBy;
			if (input.filters !== undefined) updateData.filters = input.filters;
			if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
			if (input.validJson !== undefined) updateData.validJson = Boolean(input.validJson);
			if (input.schemaVersion !== undefined) updateData.schemaVersion = input.schemaVersion;
			if (input.keys !== undefined) updateData.keys = input.keys;
			if (input.values !== undefined) updateData.values = input.values;
			if (input.hasArrays !== undefined) updateData.hasArrays = Boolean(input.hasArrays);
			if (input.hasObjects !== undefined) updateData.hasObjects = Boolean(input.hasObjects);
			if (input.encoding !== undefined) updateData.encoding = input.encoding;
			if (input.compressed !== undefined) updateData.compressed = Boolean(input.compressed);
			if (input.minified !== undefined) updateData.minified = Boolean(input.minified);
			if (input.prettyPrinted !== undefined) updateData.prettyPrinted = Boolean(input.prettyPrinted);
			if (input.parsedContent !== undefined) updateData.parsedContent = input.parsedContent;

			let committedFavoriteProfileId: string | null = null;
			const result = yield* Effect.tryPromise({
				try: async () => {
					return db.transaction(async (transaction: FavoriteWriteTransaction) => {
						if (current.assetId && input.source) {
							const targetFolderId = input.folderId ?? current.folderId;
							const targetPath = input.path ?? current.path;
							const [targetFolder] = await transaction
								.select({ path: folders.path })
								.from(folders)
								.where(eq(folders.id, targetFolderId))
								.limit(1);
							if (!targetFolder || !isPathInsideDirectory(targetFolder.path, targetPath)) {
								throw new Error('La ubicación física no pertenece al Folder declarado.');
							}
						}
						const updated = await transaction.update(jsonFiles).set(updateData).where(eq(jsonFiles.id, id)).returning();
						const entity = updated[0];
						if (entity && current.assetId) {
							await updateCanonicalMediaProjection(
								{
									assetId: current.assetId,
									folderId: input.folderId,
									hash: input.hash,
									name: input.name,
									size: input.size,
									source: input.source,
								},
								transaction as typeof db
							);
						}
						if (entity && requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
							committedFavoriteProfileId = await setFavoriteForActiveProfile(
								transaction,
								FavoriteEntityType.JSON_FILE,
								id,
								requestedIsFavorite
							);
						}
						return entity;
					});
				},
				catch: (error) => toJsonFileError('update', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new JsonFileDatabaseError({
						operation: 'update',
						reason: 'No se pudo actualizar el archivo JSON',
					})
				);
			}
			if (committedFavoriteProfileId && requestedIsFavorite !== undefined) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(
						committedFavoriteProfileId!,
						FavoriteEntityType.JSON_FILE,
						id,
						requestedIsFavorite
					)
				);
			}

			jsonFileLogger.info('JsonFile actualizado exitosamente:', result.id);
			return yield* getById(result.id);
		});

	const deleteJsonFile = (id: string): Effect.Effect<void, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Eliminando jsonFile:', id);

			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, JsonFileError>({
				try: () => db.select({ assetId: jsonFiles.assetId }).from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1),
				catch: (error) => toJsonFileError('delete:lookup', error),
			});
			if (!current) {
				return yield* Effect.fail(new JsonFileNotFound({ id, message: `Archivo JSON con ID ${id} no encontrado` }));
			}
			if (current.assetId) {
				yield* Effect.tryPromise({
					try: () => tombstoneCanonicalAsset(current.assetId!),
					catch: (error) => toJsonFileError('delete:tombstone', error),
				});
				return;
			}

			yield* Effect.tryPromise({
				try: () =>
					db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.JSON_FILE, [id]);
						await transaction.delete(jsonFiles).where(eq(jsonFiles.id, id));
					}),
				catch: (error) => toJsonFileError('delete', error),
			});

			jsonFileLogger.info('JsonFile eliminado exitosamente:', id);
		});

	const restoreById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, JsonFileError>({
				try: () => db.select({ assetId: jsonFiles.assetId }).from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1),
				catch: (error) => toJsonFileError('restoreById:lookup', error),
			});
			if (!current?.assetId) {
				return yield* Effect.fail(new JsonFileNotFound({ id, message: `Archivo JSON canónico ${id} no encontrado` }));
			}
			yield* Effect.tryPromise({
				try: () => restoreCanonicalAsset(current.assetId!),
				catch: (error) => toJsonFileError('restoreById', error),
			});
			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const entity = yield* getById(id);
			const favoriteIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
				catch: (error) => toJsonFileError('toggleFavorite.scope', error),
			});
			const next = !(favoriteIds?.includes(id) ?? entity.isFavorite);
			if (favoriteIds === null) {
				yield* Effect.tryPromise({
					try: () => db.update(jsonFiles).set({ isFavorite: next, updatedAt: new Date() }).where(eq(jsonFiles.id, id)),
					catch: (error) => toJsonFileError('toggleFavorite.legacy', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.JSON_FILE, id, next),
					catch: (error) => toJsonFileError('toggleFavorite.canonical', error),
				});
			}
			return yield* getById(id);
		});

	const getImages = (_id: string): Effect.Effect<unknown[], JsonFileError> => Effect.succeed([]);

	return {
		getById,
		getByHash,
		getByPathAndFolder,
		getAll,
		create,
		update,
		delete: deleteJsonFile,
		restoreById,
		toggleFavorite,
		getImages,
	};
};

// =================================================================================
// LAYER
// =================================================================================

export const JsonFileServiceLive = Layer.succeed(JsonFileService, make());

// =================================================================================
// INDIVIDUAL FUNCTION EXPORTS
// =================================================================================

export const create = (input: CreateJsonFileInput): Effect.Effect<JsonFileRow, JsonFileError> => make().create(input);

export const getById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> => make().getById(id);

export const getByHash = (hash: string): Effect.Effect<JsonFileRow | null, JsonFileError> => make().getByHash(hash);

export const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<JsonFileRow | null, JsonFileError> =>
	make().getByPathAndFolder(path, folderId);

export const getAll = (filters?: JsonFileFilters): Effect.Effect<PaginatedResult<JsonFileRow>, JsonFileError> =>
	make().getAll(filters);

export const update = (id: string, input: UpdateJsonFileInput): Effect.Effect<JsonFileRow, JsonFileError> =>
	make().update(id, input);

const jfDelete = (id: string): Effect.Effect<void, JsonFileError> => make().delete(id);
export { jfDelete as delete };

export const restoreById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> => make().restoreById(id);
