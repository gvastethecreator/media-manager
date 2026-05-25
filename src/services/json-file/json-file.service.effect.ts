/**
 * =================================================================================
 * JSON FILE SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de archivos JSON con Effect-TS para operaciones CRUD.
 * =================================================================================
 */

import * as crypto from 'node:crypto';
import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { jsonFiles } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import type { JsonFileWithStats } from '@/types/entities/json-file/base';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	JsonFileDatabaseError,
	JsonFileError,
	JsonFileHashConflict,
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
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<JsonFileRow | null, JsonFileError>;
	readonly update: (id: string, input: UpdateJsonFileInput) => Effect.Effect<JsonFileRow, JsonFileError>;
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
	if (!input.hash || input.hash.trim().length === 0) {
		throw new JsonFileValidationError({ field: 'hash', value: input.hash, reason: 'El hash es requerido' });
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

			if (!result) {
				return yield* Effect.fail(
					new JsonFileNotFound({ id, message: `Archivo JSON con ID ${id} no encontrado` })
				);
			}

			return result as JsonFileRow;
		});

	const getByHash = (hash: string): Effect.Effect<JsonFileRow | null, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Buscando jsonFile por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(jsonFiles).where(eq(jsonFiles.hash, hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('getByHash', error),
			});

			return (result as JsonFileRow) ?? null;
		});

	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<JsonFileRow | null, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Buscando jsonFile por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(jsonFiles)
						.where(and(eq(jsonFiles.path, path), eq(jsonFiles.folderId, folderId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('getByPathAndFolder', error),
			});

			return (result as JsonFileRow) ?? null;
		});

	const getAll = (filters: JsonFileFilters = {}): Effect.Effect<PaginatedResult<JsonFileRow>, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Obteniendo lista de jsonFiles con filtros:', filters);

			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			const favoriteEntityIds: string[] | null =
				filters.isFavorite !== undefined
					? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
						catch: (error) => toJsonFileError('getAll:favoriteIds', error),
					})
					: null;

			if (filters.isFavorite === true && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0, limit, offset };
			}

			const conditions: any[] = [];

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
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
						db
							.select({ count: count() })
							.from(jsonFiles)
							.where(whereClause),
					]),
				catch: (error) => toJsonFileError('getAll', error),
			});

			const total = totalResult[0]?.count ?? 0;

			return {
				data: rows as JsonFileRow[],
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
			} catch (error) {
				return yield* Effect.fail(error as JsonFileError);
			}

			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite === true
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
						catch: (error) => toJsonFileError('create:favoriteScope', error),
					})
					: false;

			const existing = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ id: jsonFiles.id }).from(jsonFiles).where(eq(jsonFiles.hash, input.hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toJsonFileError('create:checkHash', error),
			});

			if (existing) {
				return yield* Effect.fail(
					new JsonFileHashConflict({
						hash: input.hash,
						existingId: existing.id,
						message: `Ya existe un archivo JSON con hash ${input.hash} (id: ${existing.id})`,
					})
				);
			}

			const result = yield* Effect.tryPromise({
				try: async () => {
					const inserted = await db
						.insert(jsonFiles)
						.values({
							id: crypto.randomUUID(),
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
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning();
					return inserted[0];
				},
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

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.JSON_FILE, result.id, true),
					catch: (error) => toJsonFileError('create:favoriteBridge', error),
				});
			}

			jsonFileLogger.info('JsonFile creado exitosamente:', result.id);
			return result as JsonFileRow;
		});

	const update = (id: string, input: UpdateJsonFileInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Actualizando jsonFile:', id);

			yield* getById(id);

			const requestedIsFavorite =
				typeof input.isFavorite === 'boolean' ? input.isFavorite : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
						catch: (error) => toJsonFileError('update:favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.JSON_FILE, id, requestedIsFavorite),
					catch: (error) => toJsonFileError('update:favoriteBridge', error),
				});
			}

			const updateData: Record<string, unknown> = { updatedAt: new Date() };

			if (input.name !== undefined) updateData.name = input.name;
			if (input.path !== undefined) updateData.path = input.path;
			if (input.size !== undefined) updateData.size = input.size;
			if (input.hash !== undefined) updateData.hash = input.hash;
			if (input.mimeType !== undefined) updateData.mimeType = input.mimeType;
			if (input.extension !== undefined) updateData.extension = input.extension;
			if (input.folderId !== undefined) updateData.folderId = input.folderId;
			if (input.isFavorite !== undefined && !useCanonicalFavoriteBridge) updateData.isFavorite = Boolean(input.isFavorite);
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

			const result = yield* Effect.tryPromise({
				try: async () => {
					const updated = await db
						.update(jsonFiles)
						.set(updateData)
						.where(eq(jsonFiles.id, id))
						.returning();
					return updated[0];
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

			jsonFileLogger.info('JsonFile actualizado exitosamente:', result.id);
			return result as JsonFileRow;
		});

	const deleteJsonFile = (id: string): Effect.Effect<void, JsonFileError> =>
		Effect.gen(function* () {
			jsonFileLogger.info('Eliminando jsonFile:', id);

			yield* getById(id);

			yield* Effect.tryPromise({
				try: () => db.delete(jsonFiles).where(eq(jsonFiles.id, id)),
				catch: (error) => toJsonFileError('delete', error),
			});

			jsonFileLogger.info('JsonFile eliminado exitosamente:', id);
		});

	return {
		getById,
		getByHash,
		getByPathAndFolder,
		getAll,
		create,
		update,
		delete: deleteJsonFile,
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

export const getByPathAndFolder = (
	path: string,
	folderId: string
): Effect.Effect<JsonFileRow | null, JsonFileError> => make().getByPathAndFolder(path, folderId);

export const getAll = (
	filters?: JsonFileFilters
): Effect.Effect<PaginatedResult<JsonFileRow>, JsonFileError> => make().getAll(filters);

export const update = (
	id: string,
	input: UpdateJsonFileInput
): Effect.Effect<JsonFileRow, JsonFileError> => make().update(id, input);

const jfDelete = (id: string): Effect.Effect<void, JsonFileError> => make().delete(id);
export { jfDelete as delete };
