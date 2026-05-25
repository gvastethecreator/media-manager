/**
 * =================================================================================
 * DOCUMENT SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de documentos con Effect-TS para operaciones CRUD.
 * =================================================================================
 */

import * as crypto from 'node:crypto';
import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { documents } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { normalizeCounts, sumCounts } from '@/transformers/common/counts';
import type { DocumentWithStats } from '@/types/entities/document';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	DocumentDatabaseError,
	DocumentError,
	DocumentHashConflict,
	DocumentNotFound,
	DocumentValidationError,
} from './document-errors.effect';

// =================================================================================
// TYPES & INTERFACES
// =================================================================================

const SERVICE_NAME = 'DocumentServiceEffect';
const documentLogger = serverLogger.withContext(SERVICE_NAME);

export interface CreateDocumentInput {
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	pageCount?: number | null;
	wordCount?: number | null;
	language?: string | null;
	title?: string | null;
	author?: string | null;
	subject?: string | null;
	keywords?: string | null;
	creator?: string | null;
	producer?: string | null;
	creationDate?: Date | null;
	modificationDate?: Date | null;
	encrypted?: boolean;
	version?: string | null;
	content?: string | null;
	summary?: string | null;
}

export type UpdateDocumentInput = Partial<CreateDocumentInput>;

export interface DocumentFilters {
	folderId?: string;
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	mimeType?: string;
	extension?: string;
	minSize?: number;
	maxSize?: number;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface DocumentRow {
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
	pageCount: number | null;
	wordCount: number | null;
	language: string | null;
	title: string | null;
	author: string | null;
	subject: string | null;
	keywords: string | null;
	creator: string | null;
	producer: string | null;
	creationDate: Date | null;
	modificationDate: Date | null;
	encrypted: boolean | null;
	version: string | null;
	content: string | null;
	summary: string | null;
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

export interface DocumentServiceInterface {
	readonly create: (input: CreateDocumentInput) => Effect.Effect<DocumentRow, DocumentError>;
	readonly delete: (id: string) => Effect.Effect<void, DocumentError>;
	readonly getAll: (filters?: DocumentFilters) => Effect.Effect<PaginatedResult<DocumentRow>, DocumentError>;
	readonly getByHash: (hash: string) => Effect.Effect<DocumentRow | null, DocumentError>;
	readonly getById: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<DocumentRow | null, DocumentError>;
	readonly update: (id: string, input: UpdateDocumentInput) => Effect.Effect<DocumentRow, DocumentError>;
}

export class DocumentService extends Context.Tag('DocumentService')<DocumentService, DocumentServiceInterface>() {}

// =================================================================================
// HELPERS
// =================================================================================

function toDocumentError(operation: string, error: unknown): DocumentError {
	documentLogger.error(`Error en operación ${operation}:`, error);

	if (error && typeof error === 'object' && '_tag' in error) {
		return error as DocumentError;
	}

	const message = error instanceof Error ? error.message : String(error);
	return new DocumentDatabaseError({ operation, reason: message, originalError: error });
}

function validateCreateInput(input: CreateDocumentInput): void {
	if (!input.name || input.name.trim().length === 0) {
		throw new DocumentValidationError({ field: 'name', value: input.name, reason: 'El nombre es requerido' });
	}
	if (!input.path || input.path.trim().length === 0) {
		throw new DocumentValidationError({ field: 'path', value: input.path, reason: 'El path es requerido' });
	}
	if (!input.hash || input.hash.trim().length === 0) {
		throw new DocumentValidationError({ field: 'hash', value: input.hash, reason: 'El hash es requerido' });
	}
	if (input.size < 0) {
		throw new DocumentValidationError({ field: 'size', value: input.size, reason: 'El size no puede ser negativo' });
	}
	if (!input.mimeType) {
		throw new DocumentValidationError({
			field: 'mimeType',
			value: input.mimeType,
			reason: 'El mimeType es requerido',
		});
	}
	if (!input.extension) {
		throw new DocumentValidationError({
			field: 'extension',
			value: input.extension,
			reason: 'La extensión es requerida',
		});
	}
}

// =================================================================================
// IMPLEMENTATION
// =================================================================================

const make = (): DocumentServiceInterface => {
	const getById = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Obteniendo documento por ID:', id);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('getById', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new DocumentNotFound({ id, message: `Documento con ID ${id} no encontrado` })
				);
			}

			return result as DocumentRow;
		});

	const getByHash = (hash: string): Effect.Effect<DocumentRow | null, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Buscando documento por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select().from(documents).where(eq(documents.hash, hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('getByHash', error),
			});

			return (result as DocumentRow) ?? null;
		});

	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<DocumentRow | null, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Buscando documento por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(documents)
						.where(and(eq(documents.path, path), eq(documents.folderId, folderId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('getByPathAndFolder', error),
			});

			return (result as DocumentRow) ?? null;
		});

	const getAll = (filters: DocumentFilters = {}): Effect.Effect<PaginatedResult<DocumentRow>, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Obteniendo lista de documentos con filtros:', filters);

			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			const favoriteEntityIds: string[] | null =
				filters.isFavorite !== undefined
					? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT),
						catch: (error) => toDocumentError('getAll:favoriteIds', error),
					})
					: null;

			if (filters.isFavorite === true && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0, limit, offset };
			}

			const conditions: any[] = [];

			if (filters.folderId) {
				conditions.push(eq(documents.folderId, filters.folderId));
			}
			if (filters.search) {
				conditions.push(
					or(
						like(documents.name, `%${filters.search}%`),
						like(documents.title, `%${filters.search}%`),
						like(documents.content, `%${filters.search}%`)
					)
				);
			}
			if (filters.isFavorite !== undefined) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(documents.isFavorite, filters.isFavorite));
				} else if (filters.isFavorite) {
					conditions.push(inArray(documents.id, favoriteEntityIds));
				} else if (favoriteEntityIds.length > 0) {
					conditions.push(notInArray(documents.id, favoriteEntityIds));
				}
			}
			if (filters.isArchived !== undefined) {
				conditions.push(eq(documents.isArchived, filters.isArchived));
			}
			if (filters.mimeType) {
				conditions.push(eq(documents.mimeType, filters.mimeType));
			}
			if (filters.extension) {
				conditions.push(eq(documents.extension, filters.extension));
			}
			if (filters.minSize) {
				conditions.push(gte(documents.size, filters.minSize));
			}
			if (filters.maxSize) {
				conditions.push(lte(documents.size, filters.maxSize));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const sortBy = filters.sortBy || 'name';
			const orderFn = filters.sortOrder === 'desc' ? desc : asc;
			let orderByClause: any;
			switch (sortBy) {
				case 'createdAt':
					orderByClause = orderFn(documents.createdAt);
					break;
				case 'updatedAt':
					orderByClause = orderFn(documents.updatedAt);
					break;
				case 'size':
					orderByClause = orderFn(documents.size);
					break;
				default:
					orderByClause = orderFn(documents.name);
			}

			const [rows, totalResult] = yield* Effect.tryPromise({
				try: () =>
					Promise.all([
						db
							.select()
							.from(documents)
							.where(whereClause)
							.orderBy(orderByClause)
							.limit(limit)
							.offset(offset),
						db
							.select({ count: count() })
							.from(documents)
							.where(whereClause),
					]),
				catch: (error) => toDocumentError('getAll', error),
			});

			const total = totalResult[0]?.count ?? 0;

			return {
				data: rows as DocumentRow[],
				total,
				limit,
				offset,
			};
		});

	const create = (input: CreateDocumentInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Creando documento:', input.name);

			try {
				validateCreateInput(input);
			} catch (error) {
				return yield* Effect.fail(error as DocumentError);
			}

			const requestedIsFavorite = input.isFavorite === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite === true
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT)) !== null,
						catch: (error) => toDocumentError('create:favoriteScope', error),
					})
					: false;

			const existing = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ id: documents.id }).from(documents).where(eq(documents.hash, input.hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('create:checkHash', error),
			});

			if (existing) {
				return yield* Effect.fail(
					new DocumentHashConflict({
						hash: input.hash,
						existingId: existing.id,
						message: `Ya existe un documento con hash ${input.hash} (id: ${existing.id})`,
					})
				);
			}

			const result = yield* Effect.tryPromise({
				try: async () => {
					const inserted = await db
						.insert(documents)
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
							pageCount: input.pageCount ?? null,
							wordCount: input.wordCount ?? null,
							language: input.language ?? null,
							title: input.title ?? null,
							author: input.author ?? null,
							subject: input.subject ?? null,
							keywords: input.keywords ?? null,
							creator: input.creator ?? null,
							producer: input.producer ?? null,
							creationDate: input.creationDate ?? null,
							modificationDate: input.modificationDate ?? null,
							encrypted: input.encrypted ?? false,
							version: input.version ?? null,
							content: input.content ?? null,
							summary: input.summary ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning();
					return inserted[0];
				},
				catch: (error) => toDocumentError('create:insert', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new DocumentDatabaseError({
						operation: 'create',
						reason: 'No se pudo crear el documento',
					})
				);
			}

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.DOCUMENT, result.id, true),
					catch: (error) => toDocumentError('create:favoriteBridge', error),
				});
			}

			documentLogger.info('Documento creado exitosamente:', result.id);
			return result as DocumentRow;
		});

	const update = (id: string, input: UpdateDocumentInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Actualizando documento:', id);

			yield* getById(id);

			const requestedIsFavorite =
				typeof input.isFavorite === 'boolean' ? input.isFavorite : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
						try: async () =>
							(await favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT)) !== null,
						catch: (error) => toDocumentError('update:favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.DOCUMENT, id, requestedIsFavorite),
					catch: (error) => toDocumentError('update:favoriteBridge', error),
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
			if (input.pageCount !== undefined) updateData.pageCount = input.pageCount;
			if (input.wordCount !== undefined) updateData.wordCount = input.wordCount;
			if (input.language !== undefined) updateData.language = input.language;
			if (input.title !== undefined) updateData.title = input.title;
			if (input.author !== undefined) updateData.author = input.author;
			if (input.subject !== undefined) updateData.subject = input.subject;
			if (input.keywords !== undefined) updateData.keywords = input.keywords;
			if (input.creator !== undefined) updateData.creator = input.creator;
			if (input.producer !== undefined) updateData.producer = input.producer;
			if (input.creationDate !== undefined) updateData.creationDate = input.creationDate;
			if (input.modificationDate !== undefined) updateData.modificationDate = input.modificationDate;
			if (input.encrypted !== undefined) updateData.encrypted = Boolean(input.encrypted);
			if (input.version !== undefined) updateData.version = input.version;
			if (input.content !== undefined) updateData.content = input.content;
			if (input.summary !== undefined) updateData.summary = input.summary;

			const result = yield* Effect.tryPromise({
				try: async () => {
					const updated = await db
						.update(documents)
						.set(updateData)
						.where(eq(documents.id, id))
						.returning();
					return updated[0];
				},
				catch: (error) => toDocumentError('update', error),
			});

			if (!result) {
				return yield* Effect.fail(
					new DocumentDatabaseError({
						operation: 'update',
						reason: 'No se pudo actualizar el documento',
					})
				);
			}

			documentLogger.info('Documento actualizado exitosamente:', result.id);
			return result as DocumentRow;
		});

	const deleteDocument = (id: string): Effect.Effect<void, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Eliminando documento:', id);

			yield* getById(id);

			yield* Effect.tryPromise({
				try: () => db.delete(documents).where(eq(documents.id, id)),
				catch: (error) => toDocumentError('delete', error),
			});

			documentLogger.info('Documento eliminado exitosamente:', id);
		});

	return {
		getById,
		getByHash,
		getByPathAndFolder,
		getAll,
		create,
		update,
		delete: deleteDocument,
	};
};

// =================================================================================
// LAYER
// =================================================================================

export const DocumentServiceLive = Layer.succeed(DocumentService, make());

// =================================================================================
// INDIVIDUAL FUNCTION EXPORTS
// =================================================================================

export const create = (input: CreateDocumentInput): Effect.Effect<DocumentRow, DocumentError> => make().create(input);

export const getById = (id: string): Effect.Effect<DocumentRow, DocumentError> => make().getById(id);

export const getByHash = (hash: string): Effect.Effect<DocumentRow | null, DocumentError> => make().getByHash(hash);

export const getByPathAndFolder = (
	path: string,
	folderId: string
): Effect.Effect<DocumentRow | null, DocumentError> => make().getByPathAndFolder(path, folderId);

export const getAll = (
	filters?: DocumentFilters
): Effect.Effect<PaginatedResult<DocumentRow>, DocumentError> => make().getAll(filters);

export const update = (
	id: string,
	input: UpdateDocumentInput
): Effect.Effect<DocumentRow, DocumentError> => make().update(id, input);

const docDelete = (id: string): Effect.Effect<void, DocumentError> => make().delete(id);
export { docDelete as delete };
