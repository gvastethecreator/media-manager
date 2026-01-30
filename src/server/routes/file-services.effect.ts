/**
 * @file Express Routes para servicios de archivos usando Effect
 * @module server/routes/file-services.effect
 * @description Rutas REST para File3D, Document, JsonFile, UploadedImages
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/index.js';
import { file3Ds, jsonFiles } from '@/lib/drizzle/schema/index.js';
import { metadatas } from '@/lib/drizzle/schema/core/metadatas.js';
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
file3dsEffectRouter.get('/:id/thumbnail', async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 300,
			backgroundColor: `#${(req.query.backgroundColor as string) || 'ffffff'}`,
		};

		// Obtener modelo 3D de la base de datos
		const model3DRecords = await db.select({ metadata: file3Ds.metadata }).from(file3Ds).where(eq(file3Ds.id, id));

		if (model3DRecords.length === 0) {
			res.status(404).json({ error: '3D model not found' });
			return;
		}

		const model3D = model3DRecords[0];
		let metadata: any = null;

		// Parsear metadata si existe
		if (model3D.metadata) {
			try {
				metadata = JSON.parse(model3D.metadata);
			} catch (e) {
				console.warn(`Error parsing metadata for 3D model ${id}:`, e);
			}
		}

		// Si ya tiene thumbnail generado en metadata
		if (metadata?.thumbnail) {
			const thumbnailSvg = metadata.thumbnail;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(thumbnailSvg);
			return;
		}

		// Fallback: generar placeholder
		const errorSVG = `
<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
  <g transform="translate(${options.width / 2},${options.height / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">
      🎨 3D Model
    </text>
  </g>
</svg>`;

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.send(errorSVG);
	} catch (error) {
		console.error('Error generando thumbnail 3D:', error);
		res.status(500).json({ error: 'Error generating 3D thumbnail' });
	}
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
documentsEffectRouter.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 212,
			height: Number.parseInt(req.query.height as string, 10) || 300,
		};

		// Obtener thumbnail de la tabla metadatas
		const thumbnailId = `${id}-thumbnail`;
		const metadataRecords = await db
			.select({ value: metadatas.value })
			.from(metadatas)
			.where(eq(metadatas.id, thumbnailId));

		if (metadataRecords.length > 0) {
			const thumbnailSvg = metadataRecords[0].value;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(thumbnailSvg);
			return;
		}

		// Fallback: generar placeholder
		const errorSVG = `
<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(${options.width / 2},${options.height / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">
      📄 Document
    </text>
  </g>
</svg>`;

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.send(errorSVG);
	} catch (error) {
		console.error('Error generando preview de documento:', error);
		res.status(500).json({ error: 'Error generating document preview' });
	}
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
jsonFilesEffectRouter.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 400,
		};

		// Obtener JSON file de la base de datos
		const jsonFileRecords = await db.select({ metadata: jsonFiles.metadata }).from(jsonFiles).where(eq(jsonFiles.id, id));

		if (jsonFileRecords.length === 0) {
			res.status(404).json({ error: 'JSON file not found' });
			return;
		}

		const jsonFile = jsonFileRecords[0];
		let metadata: any = null;

		// Parsear metadata si existe
		if (jsonFile.metadata) {
			try {
				metadata = JSON.parse(jsonFile.metadata);
			} catch (e) {
				console.warn(`Error parsing metadata for JSON file ${id}:`, e);
			}
		}

		// Si ya tiene thumbnail generado en metadata
		if (metadata?.thumbnail) {
			const thumbnailSvg = metadata.thumbnail;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(thumbnailSvg);
			return;
		}

		// Fallback: generar placeholder
		const errorSVG = `
<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(${options.width / 2},${options.height / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">
      📋 JSON File
    </text>
  </g>
</svg>`;

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.send(errorSVG);
	} catch (error) {
		console.error('Error generando preview JSON:', error);
		res.status(500).json({ error: 'Error generating JSON preview' });
	}
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
