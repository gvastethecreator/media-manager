/**
 * @file Effect service for UploadedImage compatibility records.
 * @module services/file/file-services.effect
 * @description The former Document/JsonFile/File3D duplicates were retired after their dedicated canonical cutover.
 */

import * as crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { uploadedImages } from '@/lib/drizzle/schema';
import {
	fromUnknownUploadedImagesError,
	type UploadedImagesError,
	UploadedImagesErrorNotFound,
} from './file-services-errors.effect';

type UploadedImageRow = typeof uploadedImages.$inferSelect;
type MutableInput = Record<string, unknown>;

interface ListOptions {
	limit?: number;
	offset?: number;
}

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
			const limit = options.limit ?? 50;
			const offset = options.offset ?? 0;
			const result = yield* Effect.tryPromise<UploadedImageRow[], UploadedImagesError>({
				try: () => db.select().from(uploadedImages).orderBy(desc(uploadedImages.createdAt)).limit(limit).offset(offset),
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

	return { create, delete: delete_, getAll, getById, update };
};

export const UploadedImagesServiceLive = Layer.effect(
	UploadedImagesService,
	Effect.succeed(makeUploadedImagesService())
);
