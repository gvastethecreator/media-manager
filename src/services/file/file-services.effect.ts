/**
 * @file File Services implementados con Effect
 * @module services/file/file-services.effect
 * @description Servicios File3D, Document, JsonFile, UploadedImages con Effect-TS
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import * as crypto from 'node:crypto';
import { desc, eq, inArray } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { documents, file3Ds, jsonFiles, uploadedImages } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	type DocumentError,
	DocumentNotFound,
	type File3DError,
	File3DNotFound,
	fromUnknownDocumentError,
	fromUnknownFile3DError,
	fromUnknownJsonFileError,
	fromUnknownUploadedImagesError,
	type JsonFileError,
	JsonFileNotFound,
	type UploadedImagesError,
	UploadedImagesErrorNotFound,
} from './file-services-errors.effect';

const logger = serverLogger.withContext('FileServices.Effect');

type File3DRow = typeof file3Ds.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;
type JsonFileRow = typeof jsonFiles.$inferSelect;
type UploadedImageRow = typeof uploadedImages.$inferSelect;
interface ListOptions {
	limit?: number;
	onlyFavorites?: boolean;
	offset?: number;
}
type MutableInput = Record<string, unknown>;
type FavoriteCapableRow = { id: string; isFavorite?: boolean | null };

function normalizeFavoriteRow<TEntity extends FavoriteCapableRow>(
	entity: TEntity,
	favoriteEntityIds: string[] | null
): TEntity & { isFavorite: boolean } {
	const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;

	return {
		...entity,
		isFavorite: favoriteIdSet ? favoriteIdSet.has(entity.id) : Boolean(entity.isFavorite),
	};
}

function normalizeFavoriteRows<TEntity extends FavoriteCapableRow>(
	entities: TEntity[],
	favoriteEntityIds: string[] | null
): Array<TEntity & { isFavorite: boolean }> {
	const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;

	return entities.map((entity) => ({
		...entity,
		isFavorite: favoriteIdSet ? favoriteIdSet.has(entity.id) : Boolean(entity.isFavorite),
	}));
}

// ============= File3D Service =============

export class File3DService extends Context.Tag('File3DService')<File3DService, File3DServiceInterface>() {}

export interface File3DServiceInterface {
	readonly create: (input: MutableInput) => Effect.Effect<File3DRow, File3DError>;
	readonly delete: (id: string) => Effect.Effect<void, File3DError>;
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: File3DRow[]; total: number }, File3DError>;
	readonly getById: (id: string) => Effect.Effect<File3DRow, File3DError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<File3DRow, File3DError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<File3DRow, File3DError>;
}

const makeFile3DService = (): File3DServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: File3DRow[]; total: number }, File3DError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, File3DError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D),
				catch: (error) => fromUnknownFile3DError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () => {
					let query = db.select().from(file3Ds).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(file3Ds.isFavorite, true))
								: query.where(inArray(file3Ds.id, favoriteEntityIds));
					}

					return query.orderBy(desc(file3Ds.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownFile3DError('getAll', error),
			});
			return { data: normalizeFavoriteRows(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () => db.select().from(file3Ds).where(eq(file3Ds.id, id)).limit(1),
				catch: (error) => fromUnknownFile3DError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new File3DNotFound({ fileId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, File3DError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D),
				catch: (error) => fromUnknownFile3DError('getById.favoriteIds', error),
			});

			return normalizeFavoriteRow(result[0], favoriteEntityIds);
		});

	const create = (input: MutableInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, File3DError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D)) !== null,
						catch: (error) => fromUnknownFile3DError('create.favoriteScope', error),
					})
					: false;

			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () =>
					db
						.insert(file3Ds)
						.values({
							id,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownFile3DError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.FILE_3D, id, true);
						} catch (error) {
							await db.delete(file3Ds).where(eq(file3Ds.id, id));
							throw error;
						}
					},
					catch: (error) => fromUnknownFile3DError('create.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const update = (id: string, input: MutableInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, File3DError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D)) !== null,
						catch: (error) => fromUnknownFile3DError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.FILE_3D, id, requestedIsFavorite),
					catch: (error) => fromUnknownFile3DError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () =>
					db
						.update(file3Ds)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
							updatedAt: new Date(),
						})
						.where(eq(file3Ds.id, id))
						.returning(),
				catch: (error) => fromUnknownFile3DError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new File3DNotFound({ fileId: id }));
			}

			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const file3D = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, File3DError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.FILE_3D),
				catch: (error) => fromUnknownFile3DError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? file3D.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(file3Ds)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(file3Ds.id, id)),
					catch: (error) => fromUnknownFile3DError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.FILE_3D, id, newFavoriteStatus),
					catch: (error) => fromUnknownFile3DError('toggleFavorite.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, File3DError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(file3Ds).where(eq(file3Ds.id, id));
			},
			catch: (error) => fromUnknownFile3DError('delete', error),
		});

	return { getAll, getById, create, update, delete: delete_, toggleFavorite };
};

export const File3DServiceLive = Layer.effect(File3DService, Effect.succeed(makeFile3DService()));

// ============= Document Service =============

export class DocumentService extends Context.Tag('DocumentService')<DocumentService, DocumentServiceInterface>() {}

export interface DocumentServiceInterface {
	readonly create: (input: MutableInput) => Effect.Effect<DocumentRow, DocumentError>;
	readonly delete: (id: string) => Effect.Effect<void, DocumentError>;
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: DocumentRow[]; total: number }, DocumentError>;
	readonly getById: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly getImages: (id: string) => Effect.Effect<any[], DocumentError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<DocumentRow, DocumentError>;
}

const makeDocumentService = (): DocumentServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: DocumentRow[]; total: number }, DocumentError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, DocumentError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT),
				catch: (error) => fromUnknownDocumentError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () => {
					let query = db.select().from(documents).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(documents.isFavorite, true))
								: query.where(inArray(documents.id, favoriteEntityIds));
					}

					return query.orderBy(desc(documents.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownDocumentError('getAll', error),
			});
			return { data: normalizeFavoriteRows(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () => db.select().from(documents).where(eq(documents.id, id)).limit(1),
				catch: (error) => fromUnknownDocumentError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new DocumentNotFound({ documentId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, DocumentError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT),
				catch: (error) => fromUnknownDocumentError('getById.favoriteIds', error),
			});

			return normalizeFavoriteRow(result[0], favoriteEntityIds);
		});

	const create = (input: MutableInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, DocumentError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT)) !== null,
						catch: (error) => fromUnknownDocumentError('create.favoriteScope', error),
					})
					: false;

			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () =>
					db
						.insert(documents)
						.values({
							id,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownDocumentError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.DOCUMENT, id, true);
						} catch (error) {
							await db.delete(documents).where(eq(documents.id, id));
							throw error;
						}
					},
					catch: (error) => fromUnknownDocumentError('create.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const update = (id: string, input: MutableInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, DocumentError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT)) !== null,
						catch: (error) => fromUnknownDocumentError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.DOCUMENT, id, requestedIsFavorite),
					catch: (error) => fromUnknownDocumentError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () =>
					db
						.update(documents)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
							updatedAt: new Date(),
						})
						.where(eq(documents.id, id))
						.returning(),
				catch: (error) => fromUnknownDocumentError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new DocumentNotFound({ documentId: id }));
			}

			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const document = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, DocumentError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.DOCUMENT),
				catch: (error) => fromUnknownDocumentError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? document.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(documents)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(documents.id, id)),
					catch: (error) => fromUnknownDocumentError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.DOCUMENT, id, newFavoriteStatus),
					catch: (error) => fromUnknownDocumentError('toggleFavorite.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, DocumentError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(documents).where(eq(documents.id, id));
			},
			catch: (error) => fromUnknownDocumentError('delete', error),
		});

	const getImages = (id: string): Effect.Effect<any[], DocumentError> => Effect.succeed([] as any[]);

	return { getAll, getById, create, update, delete: delete_, getImages, toggleFavorite };
};

export const DocumentServiceLive = Layer.effect(DocumentService, Effect.succeed(makeDocumentService()));

// ============= JsonFile Service =============

export class JsonFileService extends Context.Tag('JsonFileService')<JsonFileService, JsonFileServiceInterface>() {}

export interface JsonFileServiceInterface {
	readonly create: (input: MutableInput) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly delete: (id: string) => Effect.Effect<void, JsonFileError>;
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: JsonFileRow[]; total: number }, JsonFileError>;
	readonly getById: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly getImages: (id: string) => Effect.Effect<any[], JsonFileError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<JsonFileRow, JsonFileError>;
}

const makeJsonFileService = (): JsonFileServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: JsonFileRow[]; total: number }, JsonFileError> =>
		Effect.gen(function* () {
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, JsonFileError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
				catch: (error) => fromUnknownJsonFileError('getAll.favoriteIds', error),
			});

			if (options.onlyFavorites && favoriteEntityIds !== null && favoriteEntityIds.length === 0) {
				return { data: [], total: 0 };
			}

			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () => {
					let query = db.select().from(jsonFiles).$dynamic();

					if (options.onlyFavorites) {
						query =
							favoriteEntityIds === null
								? query.where(eq(jsonFiles.isFavorite, true))
								: query.where(inArray(jsonFiles.id, favoriteEntityIds));
					}

					return query.orderBy(desc(jsonFiles.createdAt)).limit(options.limit || 50).offset(options.offset || 0);
				},
				catch: (error) => fromUnknownJsonFileError('getAll', error),
			});
			return { data: normalizeFavoriteRows(result, favoriteEntityIds), total: result.length };
		});

	const getById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () => db.select().from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1),
				catch: (error) => fromUnknownJsonFileError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new JsonFileNotFound({ fileId: id }));

			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, JsonFileError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
				catch: (error) => fromUnknownJsonFileError('getById.favoriteIds', error),
			});

			return normalizeFavoriteRow(result[0], favoriteEntityIds);
		});

	const create = (input: MutableInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite = requestedIsFavoriteValue === true;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite
					? yield* Effect.tryPromise<boolean, JsonFileError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
						catch: (error) => fromUnknownJsonFileError('create.favoriteScope', error),
					})
					: false;

			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () =>
					db
						.insert(jsonFiles)
						.values({
							id,
							...restInput,
							isFavorite: requestedIsFavorite && !useCanonicalFavoriteBridge,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownJsonFileError('create', error),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: async () => {
						try {
							await favoriteService.set(FavoriteEntityType.JSON_FILE, id, true);
						} catch (error) {
							await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
							throw error;
						}
					},
					catch: (error) => fromUnknownJsonFileError('create.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const update = (id: string, input: MutableInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			yield* getById(id);

			const { isFavorite: requestedIsFavoriteValue, ...restInput } = input;
			const requestedIsFavorite =
				typeof requestedIsFavoriteValue === 'boolean' ? requestedIsFavoriteValue : undefined;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise<boolean, JsonFileError>({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE)) !== null,
						catch: (error) => fromUnknownJsonFileError('update.favoriteScope', error),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.JSON_FILE, id, requestedIsFavorite),
					catch: (error) => fromUnknownJsonFileError('update.favoriteBridge', error),
				});
			}

			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () =>
					db
						.update(jsonFiles)
						.set({
							...restInput,
							...(requestedIsFavorite !== undefined && !useCanonicalFavoriteBridge
								? { isFavorite: requestedIsFavorite }
								: {}),
							updatedAt: new Date(),
						})
						.where(eq(jsonFiles.id, id))
						.returning(),
				catch: (error) => fromUnknownJsonFileError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new JsonFileNotFound({ fileId: id }));
			}

			return yield* getById(id);
		});

	const toggleFavorite = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const jsonFile = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise<string[] | null, JsonFileError>({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.JSON_FILE),
				catch: (error) => fromUnknownJsonFileError('toggleFavorite.scope', error),
			});
			const currentFavoriteStatus = favoriteEntityIds?.includes(id) ?? jsonFile.isFavorite;
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds === null) {
				yield* Effect.tryPromise({
					try: () =>
						db
							.update(jsonFiles)
							.set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
							.where(eq(jsonFiles.id, id)),
					catch: (error) => fromUnknownJsonFileError('toggleFavorite', error),
				});
			} else {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.JSON_FILE, id, newFavoriteStatus),
					catch: (error) => fromUnknownJsonFileError('toggleFavorite.favoriteBridge', error),
				});
			}

			return yield* getById(id);
		});

	const delete_ = (id: string): Effect.Effect<void, JsonFileError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
			},
			catch: (error) => fromUnknownJsonFileError('delete', error),
		});

	const getImages = (id: string): Effect.Effect<any[], JsonFileError> => Effect.succeed([] as any[]);

	return { getAll, getById, create, update, delete: delete_, getImages, toggleFavorite };
};

export const JsonFileServiceLive = Layer.effect(JsonFileService, Effect.succeed(makeJsonFileService()));

// ============= UploadedImages Service =============

export class UploadedImagesService extends Context.Tag('UploadedImagesService')<
	UploadedImagesService,
	UploadedImagesServiceInterface
>() {}

export interface UploadedImagesServiceInterface {
	readonly create: (input: MutableInput) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
	readonly delete: (id: string) => Effect.Effect<void, UploadedImagesError>;
	readonly getAll: (
		options?: ListOptions
	) => Effect.Effect<{ data: UploadedImageRow[]; total: number }, UploadedImagesError>;
	readonly getById: (id: string) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
}

const makeUploadedImagesService = (): UploadedImagesServiceInterface => {
	const getAll = (
		options: ListOptions = {}
	): Effect.Effect<{ data: UploadedImageRow[]; total: number }, UploadedImagesError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<UploadedImageRow[], UploadedImagesError>({
				try: () =>
					db
						.select()
						.from(uploadedImages)
						.orderBy(desc(uploadedImages.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownUploadedImagesError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<UploadedImageRow, UploadedImagesError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<UploadedImageRow[], UploadedImagesError>({
				try: () => db.select().from(uploadedImages).where(eq(uploadedImages.id, id)).limit(1),
				catch: (error) => fromUnknownUploadedImagesError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new UploadedImagesErrorNotFound({ imageId: id }));
			return result[0];
		});

	const create = (input: MutableInput): Effect.Effect<UploadedImageRow, UploadedImagesError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const result = yield* Effect.tryPromise<UploadedImageRow[], UploadedImagesError>({
				try: () =>
					db
						.insert(uploadedImages)
						.values({ id, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownUploadedImagesError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: MutableInput): Effect.Effect<UploadedImageRow, UploadedImagesError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<UploadedImageRow[], UploadedImagesError>({
				try: () =>
					db
						.update(uploadedImages)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(uploadedImages.id, id))
						.returning(),
				catch: (error) => fromUnknownUploadedImagesError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, UploadedImagesError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(uploadedImages).where(eq(uploadedImages.id, id));
			},
			catch: (error) => fromUnknownUploadedImagesError('delete', error),
		});

	return { getAll, getById, create, update, delete: delete_ };
};

export const UploadedImagesServiceLive = Layer.effect(
	UploadedImagesService,
	Effect.succeed(makeUploadedImagesService())
);
