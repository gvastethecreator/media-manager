/**
 * =================================================================================
 * DOCUMENT SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de documentos con Effect-TS para operaciones CRUD.
 * =================================================================================
 */

import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { documents, folders } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	deleteFavoriteRecordsForEntities,
	emitCommittedFavoriteChange,
	setFavoriteForActiveProfile,
	setFavoriteStateForActiveProfile,
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
	DocumentDatabaseError,
	DocumentError,
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
	source: CanonicalMediaSourceInput;
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

export interface DocumentServiceInterface {
	readonly create: (input: CreateDocumentInput) => Effect.Effect<DocumentRow, DocumentError>;
	readonly delete: (id: string) => Effect.Effect<void, DocumentError>;
	readonly getAll: (filters?: DocumentFilters) => Effect.Effect<PaginatedResult<DocumentRow>, DocumentError>;
	readonly getByHash: (hash: string) => Effect.Effect<DocumentRow | null, DocumentError>;
	readonly getById: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly getImages: (id: string) => Effect.Effect<unknown[], DocumentError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<DocumentRow | null, DocumentError>;
	readonly restoreById: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
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
		throw new DocumentValidationError({ field: 'name', value: input.name, reason: 'The name is required' });
	}
	if (!input.path || input.path.trim().length === 0) {
		throw new DocumentValidationError({ field: 'path', value: input.path, reason: 'El path es requerido' });
	}
	if (!/^[0-9a-f]{64}$/.test(input.hash)) {
		throw new DocumentValidationError({
			field: 'hash',
			value: input.hash,
			reason: 'El hash debe ser SHA-256 lowercase',
		});
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

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'document'),
						catch: (error) => toDocumentError('getById:canonicalProjection', error),
					})
				: null;

			if (!projected) {
				return yield* Effect.fail(new DocumentNotFound({ id, message: `Documento con ID ${id} no encontrado` }));
			}

			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.DOCUMENT, projected as DocumentRow),
				catch: (error) => toDocumentError('getById:favoriteProjection', error),
			});
		});

	const getByHash = (hash: string): Effect.Effect<DocumentRow | null, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Buscando documento por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(documents)
						.where(and(eq(documents.hash, hash), visibleAssetLifecycleCondition(documents.assetId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('getByHash', error),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'document'),
						catch: (error) => toDocumentError('getByHash:canonicalProjection', error),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.DOCUMENT, projected as DocumentRow),
				catch: (error) => toDocumentError('getByHash:favoriteProjection', error),
			});
		});

	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<DocumentRow | null, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Buscando documento por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select()
						.from(documents)
						.where(
							and(
								eq(documents.path, path),
								eq(documents.folderId, folderId),
								visibleAssetLifecycleCondition(documents.assetId)
							)
						)
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toDocumentError('getByPathAndFolder', error),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'document'),
						catch: (error) => toDocumentError('getByPathAndFolder:canonicalProjection', error),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.DOCUMENT, projected as DocumentRow),
				catch: (error) => toDocumentError('getByPathAndFolder:favoriteProjection', error),
			});
		});

	const getAll = (filters: DocumentFilters = {}): Effect.Effect<PaginatedResult<DocumentRow>, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Obteniendo lista de documentos con filtros:', filters);

			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.DOCUMENT),
				catch: (error) => toDocumentError('getAll:favoriteIds', error),
			});

			if (filters.isFavorite === true && favoriteEntityIds.length === 0) {
				return { data: [], total: 0, limit, offset };
			}

			const conditions: any[] = [visibleAssetLifecycleCondition(documents.assetId)];

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
				if (filters.isFavorite) {
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
							.orderBy(orderByClause, orderFn(documents.id))
							.limit(limit)
							.offset(offset),
						db.select({ count: count() }).from(documents).where(whereClause),
					]),
				catch: (error) => toDocumentError('getAll', error),
			});

			const total = totalResult[0]?.count ?? 0;
			const projectedRows = yield* Effect.tryPromise<PaginatedResult<DocumentRow>['data'], DocumentError>({
				try: async () => (await projectCanonicalMediaRows(rows, 'document')) as DocumentRow[],
				catch: (error) => toDocumentError('getAll:canonicalProjection', error),
			});

			return {
				data: favoriteService.applyFavoriteProjectionMany(projectedRows, favoriteEntityIds),
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
				assertCanonicalMediaCreateCommand({
					assetType: 'document',
					folderId: input.folderId,
					hash: input.hash,
					name: input.name,
					path: input.path,
					size: input.size,
					source: input.source,
				});
			} catch (error) {
				return yield* Effect.fail(error as DocumentError);
			}

			const requestedIsFavorite = input.isFavorite === true;

			let committedFavoriteProfileId: string | null = null;
			const result = yield* Effect.tryPromise({
				try: () =>
					createCanonicalMedia(
						{
							assetType: 'document',
							folderId: input.folderId,
							hash: input.hash,
							name: input.name,
							path: input.path,
							size: input.size,
							source: input.source,
						},
						async ({ assetId, now, transaction }) => {
							const inserted = await transaction
								.insert(documents)
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
									isFavorite: false,
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
									createdAt: now,
									updatedAt: now,
								})
								.returning();
							const created = inserted[0];
							if (created && requestedIsFavorite) {
								committedFavoriteProfileId = await setFavoriteForActiveProfile(
									transaction,
									FavoriteEntityType.DOCUMENT,
									created.id,
									true
								);
							}
							return created;
						}
					),
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

			if (committedFavoriteProfileId) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(committedFavoriteProfileId!, FavoriteEntityType.DOCUMENT, result.id, true)
				);
			}

			documentLogger.info('Documento creado exitosamente:', result.id);
			return yield* getById(result.id);
		});

	const update = (id: string, input: UpdateDocumentInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Actualizando documento:', id);

			const current = yield* getById(id);
			if (input.hash !== undefined && !/^[0-9a-f]{64}$/.test(input.hash)) {
				return yield* Effect.fail(
					new DocumentValidationError({
						field: 'hash',
						value: input.hash,
						reason: 'El hash debe ser SHA-256 lowercase',
					})
				);
			}
			if (current.assetId && (input.path !== undefined || input.folderId !== undefined) && !input.source) {
				return yield* Effect.fail(
					new DocumentValidationError({
						field: 'source',
						value: input.source,
						reason: 'Mover un Document canónico requiere una source autorizada',
					})
				);
			}
			if (current.assetId && input.source) {
				try {
					assertCanonicalMediaCreateCommand({
						assetType: 'document',
						folderId: input.folderId ?? current.folderId,
						hash: input.hash ?? current.hash,
						name: input.name ?? current.name,
						path: input.path ?? current.path,
						size: input.size ?? current.size,
						source: input.source,
					});
				} catch (error) {
					return yield* Effect.fail(
						new DocumentValidationError({ field: 'source', value: input.source, reason: String(error) })
					);
				}
			}

			const requestedIsFavorite = typeof input.isFavorite === 'boolean' ? input.isFavorite : undefined;

			const updateData: Record<string, unknown> = { updatedAt: new Date() };

			if (input.name !== undefined) updateData.name = input.name;
			if (input.path !== undefined) updateData.path = input.path;
			if (input.size !== undefined) updateData.size = input.size;
			if (input.hash !== undefined) updateData.hash = input.hash;
			if (input.mimeType !== undefined) updateData.mimeType = input.mimeType;
			if (input.extension !== undefined) updateData.extension = input.extension;
			if (input.folderId !== undefined) updateData.folderId = input.folderId;
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

			const committed = yield* Effect.tryPromise({
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
						const updated = await transaction.update(documents).set(updateData).where(eq(documents.id, id)).returning();
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
						const favoriteWrite =
							entity && requestedIsFavorite !== undefined
								? await setFavoriteStateForActiveProfile(
										transaction,
										FavoriteEntityType.DOCUMENT,
										id,
										requestedIsFavorite
									)
								: null;
						return { entity, favoriteWrite };
					});
				},
				catch: (error) => toDocumentError('update', error),
			});

			if (!committed.entity) {
				return yield* Effect.fail(
					new DocumentDatabaseError({
						operation: 'update',
						reason: 'No se pudo actualizar el documento',
					})
				);
			}
			if (committed.favoriteWrite?.changed && requestedIsFavorite !== undefined) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(
						committed.favoriteWrite!.profileId,
						FavoriteEntityType.DOCUMENT,
						id,
						requestedIsFavorite
					)
				);
			}

			documentLogger.info('Documento actualizado exitosamente:', committed.entity.id);
			return yield* getById(committed.entity.id);
		});

	const deleteDocument = (id: string): Effect.Effect<void, DocumentError> =>
		Effect.gen(function* () {
			documentLogger.info('Eliminando documento:', id);

			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, DocumentError>({
				try: () => db.select({ assetId: documents.assetId }).from(documents).where(eq(documents.id, id)).limit(1),
				catch: (error) => toDocumentError('delete:lookup', error),
			});
			if (!current) {
				return yield* Effect.fail(new DocumentNotFound({ id, message: `Documento con ID ${id} no encontrado` }));
			}
			if (current.assetId) {
				yield* Effect.tryPromise({
					try: () => tombstoneCanonicalAsset(current.assetId!),
					catch: (error) => toDocumentError('delete:tombstone', error),
				});
				return;
			}

			yield* Effect.tryPromise({
				try: () =>
					db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.DOCUMENT, [id]);
						await transaction.delete(documents).where(eq(documents.id, id));
					}),
				catch: (error) => toDocumentError('delete', error),
			});

			documentLogger.info('Documento eliminado exitosamente:', id);
		});

	const restoreById = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, DocumentError>({
				try: () => db.select({ assetId: documents.assetId }).from(documents).where(eq(documents.id, id)).limit(1),
				catch: (error) => toDocumentError('restoreById:lookup', error),
			});
			if (!current?.assetId) {
				return yield* Effect.fail(new DocumentNotFound({ id, message: `Documento canónico ${id} no encontrado` }));
			}
			yield* Effect.tryPromise({
				try: () => restoreCanonicalAsset(current.assetId!),
				catch: (error) => toDocumentError('restoreById', error),
			});
			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrThrow(FavoriteEntityType.DOCUMENT),
				catch: (error) => toDocumentError('toggleFavorite.scope', error),
			});
			const next = !favoriteEntityIds.includes(id);
			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.DOCUMENT, id, next),
				catch: (error) => toDocumentError('toggleFavorite.canonical', error),
			});
			return yield* getById(id);
		});

	const getImages = (_id: string): Effect.Effect<unknown[], DocumentError> => Effect.succeed([]);

	return {
		getById,
		getByHash,
		getByPathAndFolder,
		getAll,
		create,
		update,
		delete: deleteDocument,
		restoreById,
		toggleFavorite,
		getImages,
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

export const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<DocumentRow | null, DocumentError> =>
	make().getByPathAndFolder(path, folderId);

export const getAll = (filters?: DocumentFilters): Effect.Effect<PaginatedResult<DocumentRow>, DocumentError> =>
	make().getAll(filters);

export const update = (id: string, input: UpdateDocumentInput): Effect.Effect<DocumentRow, DocumentError> =>
	make().update(id, input);

const docDelete = (id: string): Effect.Effect<void, DocumentError> => make().delete(id);
export { docDelete as delete };

export const restoreById = (id: string): Effect.Effect<DocumentRow, DocumentError> => make().restoreById(id);
