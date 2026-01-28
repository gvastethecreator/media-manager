/**
 * @file Express Routes para servicios de archivos usando Effect
 * @module server/routes/file-services.effect
 * @description Rutas REST para File3D, Document, JsonFile, UploadedImages
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import {
	deleteUploadedImage,
	getUploadedImage,
	getUploadedImageStats,
	getUploadedImages,
	uploadImages,
} from '@/server/services/uploaded-images.api.service';
import {
	DocumentService,
	DocumentServiceLive,
	File3DService,
	File3DServiceLive,
	JsonFileService,
	JsonFileServiceLive,
	UploadedImagesService,
	UploadedImagesServiceLive,
} from '@/services/file/file-services.effect';

// File3D
const file3dsEffectRouter = express.Router();
file3dsEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(File3DServiceLive)), res);
});
file3dsEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(File3DServiceLive)), res);
});
file3dsEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(File3DServiceLive)), res, { successStatus: 201 });
});
file3dsEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(File3DServiceLive)), res);
});
file3dsEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* File3DService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(File3DServiceLive)), res, { successStatus: 204 });
});

// Documents
const documentsEffectRouter = express.Router();
documentsEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res);
});
documentsEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res);
});
documentsEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res, { successStatus: 201 });
});
documentsEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res);
});
documentsEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res, { successStatus: 204 });
});
documentsEffectRouter.get('/:id/images', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.getImages(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(DocumentServiceLive)), res);
});

// JsonFiles
const jsonFilesEffectRouter = express.Router();
jsonFilesEffectRouter.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.getAll({ limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 });
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res);
});
jsonFilesEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.getById(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res);
});
jsonFilesEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res, { successStatus: 201 });
});
jsonFilesEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res);
});
jsonFilesEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		yield* service.delete(req.params.id);
		return { success: true };
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res, { successStatus: 204 });
});
jsonFilesEffectRouter.get('/:id/images', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.getImages(req.params.id);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(JsonFileServiceLive)), res);
});

// UploadedImages
const uploadedImagesEffectRouter = express.Router();
uploadedImagesEffectRouter.get('/stats', async (_req, res) => {
	const effect = Effect.tryPromise({
		try: () => getUploadedImageStats(),
		catch: (error) => error,
	});
	await runEffectForExpress(effect, res, {
		onSuccess: (result) => {
			if (!result.success) {
				return { error: result.error };
			}
			return result.stats;
		},
	});
});
uploadedImagesEffectRouter.get('/', async (req, res) => {
	const effect = Effect.tryPromise({
		try: () =>
			getUploadedImages({
				pageSize: req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined,
				page: req.query.offset
					? Math.floor(
							Number.parseInt(req.query.offset as string, 10) /
								(Number.parseInt((req.query.limit as string) || '20', 10) || 20)
						) + 1
					: undefined,
				category: req.query.category as string,
				search: req.query.searchTerm as string,
				sortBy: req.query.orderBy as any,
				sortOrder: req.query.orderDir as any,
			}),
		catch: (error) => error,
	});
	await runEffectForExpress(effect, res, {
		onSuccess: (result) => {
			if (!result.success) {
				return { error: result.error };
			}
			return {
				data: result.items,
				pagination: {
					total: result.total,
					limit: result.pageSize,
					offset: result.page ? (result.page - 1) * result.pageSize : 0,
					hasNext: result.page ? result.page * result.pageSize < result.total : false,
					hasPrev: result.page ? result.page > 1 : false,
				},
				stats: result.stats,
			};
		},
	});
});
uploadedImagesEffectRouter.get('/:id', async (req, res) => {
	const effect = Effect.tryPromise({
		try: () => getUploadedImage(req.params.id),
		catch: (error) => error,
	});
	await runEffectForExpress(effect, res, {
		onSuccess: (result) => {
			if (!result.success) {
				return { error: result.error };
			}
			return result.item;
		},
	});
});
uploadedImagesEffectRouter.post('/upload', async (req, res) => {
	const effect = Effect.tryPromise({
		try: () => uploadImages(req.body),
		catch: (error) => error,
	});
	await runEffectForExpress(effect, res, {
		successStatus: 201,
		onSuccess: (result) => {
			if (!result.success) {
				return { error: result.error };
			}
			return result.items;
		},
	});
});
uploadedImagesEffectRouter.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* UploadedImagesService;
		return yield* service.create(req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(UploadedImagesServiceLive)), res, { successStatus: 201 });
});
uploadedImagesEffectRouter.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const service = yield* UploadedImagesService;
		return yield* service.update(req.params.id, req.body);
	});
	await runEffectForExpress(effect.pipe(Effect.provide(UploadedImagesServiceLive)), res);
});
uploadedImagesEffectRouter.delete('/:id', async (req, res) => {
	const effect = Effect.tryPromise({
		try: () => deleteUploadedImage(req.params.id),
		catch: (error) => error,
	});
	await runEffectForExpress(effect, res, {
		successStatus: 204,
		onSuccess: (result) => {
			if (!result.success) {
				return { error: result.error };
			}
			return { success: true };
		},
	});
});

export { file3dsEffectRouter, documentsEffectRouter, jsonFilesEffectRouter, uploadedImagesEffectRouter };
