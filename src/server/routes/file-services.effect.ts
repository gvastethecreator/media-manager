/**
 * @file Express Routes para servicios de archivos usando Effect
 * @module server/routes/file-services.effect
 * @description Rutas REST para File3D, Document, JsonFile, UploadedImages
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { metadatas } from '@/lib/drizzle/schema/core/metadatas.js';
import { file3Ds, jsonFiles } from '@/lib/drizzle/schema/index.js';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
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
import { FavoriteEntityType } from '@/types/entities/favorite';
import { markFavoriteToggleFacadeDeprecated } from '../utils/favorite-facade-deprecation';

// File3D
const file3dsEffectRouter = express.Router();
file3dsEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* File3DService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		const result = yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			onlyFavorites,
			offset: Number(req.query.offset) || 0,
		});
		return result.data.map((file3d) => ({
			...file3d,
			entityType: 'file3d' as const,
			thumbnailUrl: `/api/thumbnails/unified/3d/${file3d.id}`,
		}));
	}).pipe(Effect.provide(File3DServiceLive))
));
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
file3dsEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(File3DServiceLive))
));
file3dsEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* File3DService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(File3DServiceLive))
));
file3dsEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* File3DService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(File3DServiceLive))
));
file3dsEffectRouter.post('/:id/favorite', effectHandler((req, res) =>
	Effect.gen(function* () {
		markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.FILE_3D);
		const service = yield* File3DService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(File3DServiceLive))
));
file3dsEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* File3DService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(File3DServiceLive))
));

// Documents
const documentsEffectRouter = express.Router();
documentsEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		const result = yield* service.getAll({
			limit: Number(req.query.limit) || 50,
			onlyFavorites,
			offset: Number(req.query.offset) || 0,
		});
		return result.data.map((document) => ({
			...document,
			entityType: 'document' as const,
			thumbnailUrl: `/api/thumbnails/unified/document/${document.id}`,
		}));
	}).pipe(Effect.provide(DocumentServiceLive))
));
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
documentsEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(DocumentServiceLive))
));
documentsEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(DocumentServiceLive))
));
documentsEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(DocumentServiceLive))
));
documentsEffectRouter.post('/:id/favorite', effectHandler((req, res) =>
	Effect.gen(function* () {
		markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.DOCUMENT);
		const service = yield* DocumentService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(DocumentServiceLive))
));
documentsEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(DocumentServiceLive))
));
documentsEffectRouter.get('/:id/images', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* DocumentService;
		return yield* service.getImages(req.params.id);
	}).pipe(Effect.provide(DocumentServiceLive))
));

// JsonFiles
const jsonFilesEffectRouter = express.Router();
jsonFilesEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		const limit = Number(req.query.limit) || 50;
		const offset = Number(req.query.offset) || 0;
		const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
		const result = yield* service.getAll({ limit, offset, onlyFavorites });
		const data = result.data.map((jsonFile) => ({
			...jsonFile,
			entityType: 'jsonFile' as const,
			thumbnailUrl: `/api/thumbnails/unified/json/${jsonFile.id}`,
		}));

		return {
			data,
			pagination: {
				total: result.total,
				limit,
				offset,
				hasNext: data.length >= limit,
				hasPrev: offset > 0,
			},
		};
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 400,
		};

		// Obtener JSON file de la base de datos
		const jsonFileRecords = await db
			.select({ metadata: jsonFiles.metadata })
			.from(jsonFiles)
			.where(eq(jsonFiles.id, id));

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
jsonFilesEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.getById(req.params.id);
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.post('/:id/favorite', effectHandler((req, res) =>
	Effect.gen(function* () {
		markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.JSON_FILE);
		const service = yield* JsonFileService;
		return yield* service.toggleFavorite(req.params.id);
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		yield* service.delete(req.params.id);
		res.status(204);
		return undefined;
	}).pipe(Effect.provide(JsonFileServiceLive))
));
jsonFilesEffectRouter.get('/:id/images', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* JsonFileService;
		return yield* service.getImages(req.params.id);
	}).pipe(Effect.provide(JsonFileServiceLive))
));

// UploadedImages
const uploadedImagesEffectRouter = express.Router();
uploadedImagesEffectRouter.get('/stats', effectHandler((_req) =>
	Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
			try: () => getUploadedImageStats(),
			catch: (error) => error,
		});
		if (!result.success) {
			return { error: result.error };
		}
		return result.stats;
	})
));

uploadedImagesEffectRouter.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
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
	})
));

uploadedImagesEffectRouter.get('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
			try: () => getUploadedImage(req.params.id),
			catch: (error) => error,
		});
		if (!result.success) {
			return { error: result.error };
		}
		return result.item;
	})
));

uploadedImagesEffectRouter.post('/upload', effectHandler((req, res) =>
	Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
			try: () => uploadImages(req.body),
			catch: (error) => error,
		});
		res.status(201);
		if (!result.success) {
			return { error: result.error };
		}
		return result.items;
	})
));

uploadedImagesEffectRouter.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const service = yield* UploadedImagesService;
		const result = yield* service.create(req.body);
		res.status(201);
		return result;
	}).pipe(Effect.provide(UploadedImagesServiceLive))
));

uploadedImagesEffectRouter.put('/:id', effectHandler((req) =>
	Effect.gen(function* () {
		const service = yield* UploadedImagesService;
		return yield* service.update(req.params.id, req.body);
	}).pipe(Effect.provide(UploadedImagesServiceLive))
));

uploadedImagesEffectRouter.delete('/:id', effectHandler((req, res) =>
	Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
			try: () => deleteUploadedImage(req.params.id),
			catch: (error) => error,
		});
		res.status(204);
		if (!result.success) {
			return { error: result.error };
		}
		return { success: true };
	})
));

export { file3dsEffectRouter, documentsEffectRouter, jsonFilesEffectRouter, uploadedImagesEffectRouter };
