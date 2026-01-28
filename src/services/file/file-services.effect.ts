/**
 * @file File Services implementados con Effect
 * @module services/file/file-services.effect
 * @description Servicios File3D, Document, JsonFile, UploadedImages con Effect-TS
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import * as crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { documents, file3Ds, jsonFiles, uploadedImages } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
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
type ListOptions = { limit?: number; offset?: number };
type MutableInput = Record<string, unknown>;

// ============= File3D Service =============

export class File3DService extends Context.Tag('File3DService')<File3DService, File3DServiceInterface>() {}

export interface File3DServiceInterface {
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: File3DRow[]; total: number }, File3DError>;
	readonly getById: (id: string) => Effect.Effect<File3DRow, File3DError>;
	readonly create: (input: MutableInput) => Effect.Effect<File3DRow, File3DError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<File3DRow, File3DError>;
	readonly delete: (id: string) => Effect.Effect<void, File3DError>;
}

const makeFile3DService = (): File3DServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: File3DRow[]; total: number }, File3DError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () =>
					db
						.select()
						.from(file3Ds)
						.orderBy(desc(file3Ds.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownFile3DError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () => db.select().from(file3Ds).where(eq(file3Ds.id, id)).limit(1),
				catch: (error) => fromUnknownFile3DError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new File3DNotFound({ fileId: id }));
			return result[0];
		});

	const create = (input: MutableInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () =>
					db
						.insert(file3Ds)
						.values({ id, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownFile3DError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: MutableInput): Effect.Effect<File3DRow, File3DError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<File3DRow[], File3DError>({
				try: () =>
					db
						.update(file3Ds)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(file3Ds.id, id))
						.returning(),
				catch: (error) => fromUnknownFile3DError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, File3DError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(file3Ds).where(eq(file3Ds.id, id));
			},
			catch: (error) => fromUnknownFile3DError('delete', error),
		});

	return { getAll, getById, create, update, delete: delete_ };
};

export const File3DServiceLive = Layer.effect(File3DService, Effect.succeed(makeFile3DService()));

// ============= Document Service =============

export class DocumentService extends Context.Tag('DocumentService')<DocumentService, DocumentServiceInterface>() {}

export interface DocumentServiceInterface {
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: DocumentRow[]; total: number }, DocumentError>;
	readonly getById: (id: string) => Effect.Effect<DocumentRow, DocumentError>;
	readonly create: (input: MutableInput) => Effect.Effect<DocumentRow, DocumentError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<DocumentRow, DocumentError>;
	readonly delete: (id: string) => Effect.Effect<void, DocumentError>;
	readonly getImages: (id: string) => Effect.Effect<any[], DocumentError>;
}

const makeDocumentService = (): DocumentServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: DocumentRow[]; total: number }, DocumentError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () =>
					db
						.select()
						.from(documents)
						.orderBy(desc(documents.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownDocumentError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () => db.select().from(documents).where(eq(documents.id, id)).limit(1),
				catch: (error) => fromUnknownDocumentError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new DocumentNotFound({ documentId: id }));
			return result[0];
		});

	const create = (input: MutableInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () =>
					db
						.insert(documents)
						.values({ id, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownDocumentError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: MutableInput): Effect.Effect<DocumentRow, DocumentError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<DocumentRow[], DocumentError>({
				try: () =>
					db
						.update(documents)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(documents.id, id))
						.returning(),
				catch: (error) => fromUnknownDocumentError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, DocumentError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(documents).where(eq(documents.id, id));
			},
			catch: (error) => fromUnknownDocumentError('delete', error),
		});

	const getImages = (id: string): Effect.Effect<any[], DocumentError> =>
		Effect.gen(function* () {
			// Relación genérica a través de la carpeta o similar - Implementación simplificada
			return [] as any[];
		});

	return { getAll, getById, create, update, delete: delete_, getImages };
};

export const DocumentServiceLive = Layer.effect(DocumentService, Effect.succeed(makeDocumentService()));

// ============= JsonFile Service =============

export class JsonFileService extends Context.Tag('JsonFileService')<JsonFileService, JsonFileServiceInterface>() {}

export interface JsonFileServiceInterface {
	readonly getAll: (options?: ListOptions) => Effect.Effect<{ data: JsonFileRow[]; total: number }, JsonFileError>;
	readonly getById: (id: string) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly create: (input: MutableInput) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<JsonFileRow, JsonFileError>;
	readonly delete: (id: string) => Effect.Effect<void, JsonFileError>;
	readonly getImages: (id: string) => Effect.Effect<any[], JsonFileError>;
}

const makeJsonFileService = (): JsonFileServiceInterface => {
	const getAll = (options: ListOptions = {}): Effect.Effect<{ data: JsonFileRow[]; total: number }, JsonFileError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () =>
					db
						.select()
						.from(jsonFiles)
						.orderBy(desc(jsonFiles.createdAt))
						.limit(options.limit || 50),
				catch: (error) => fromUnknownJsonFileError('getAll', error),
			});
			return { data: result, total: result.length };
		});

	const getById = (id: string): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () => db.select().from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1),
				catch: (error) => fromUnknownJsonFileError('getById', error),
			});
			if (result.length === 0) return yield* Effect.fail(new JsonFileNotFound({ fileId: id }));
			return result[0];
		});

	const create = (input: MutableInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const id = crypto.randomUUID();
			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () =>
					db
						.insert(jsonFiles)
						.values({ id, ...input, createdAt: new Date(), updatedAt: new Date() })
						.returning(),
				catch: (error) => fromUnknownJsonFileError('create', error),
			});
			return result[0];
		});

	const update = (id: string, input: MutableInput): Effect.Effect<JsonFileRow, JsonFileError> =>
		Effect.gen(function* () {
			const result = yield* Effect.tryPromise<JsonFileRow[], JsonFileError>({
				try: () =>
					db
						.update(jsonFiles)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(jsonFiles.id, id))
						.returning(),
				catch: (error) => fromUnknownJsonFileError('update', error),
			});
			return result[0];
		});

	const delete_ = (id: string): Effect.Effect<void, JsonFileError> =>
		Effect.tryPromise({
			try: async () => {
				await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
			},
			catch: (error) => fromUnknownJsonFileError('delete', error),
		});

	const getImages = (id: string): Effect.Effect<any[], JsonFileError> =>
		Effect.gen(function* () {
			return [] as any[];
		});

	return { getAll, getById, create, update, delete: delete_, getImages };
};

export const JsonFileServiceLive = Layer.effect(JsonFileService, Effect.succeed(makeJsonFileService()));

// ============= UploadedImages Service =============

export class UploadedImagesService extends Context.Tag('UploadedImagesService')<
	UploadedImagesService,
	UploadedImagesServiceInterface
>() {}

export interface UploadedImagesServiceInterface {
	readonly getAll: (
		options?: ListOptions
	) => Effect.Effect<{ data: UploadedImageRow[]; total: number }, UploadedImagesError>;
	readonly getById: (id: string) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
	readonly create: (input: MutableInput) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
	readonly update: (id: string, input: MutableInput) => Effect.Effect<UploadedImageRow, UploadedImagesError>;
	readonly delete: (id: string) => Effect.Effect<void, UploadedImagesError>;
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
