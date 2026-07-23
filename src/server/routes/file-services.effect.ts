/**
 * @file Express Routes para servicios de archivos usando Effect
 * @module server/routes/file-services.effect
 * @description Rutas REST para File3D, Document, JsonFile y retiro seguro de UploadedImages
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { metadatas } from '@/lib/drizzle/schema/core/metadatas.js';
import { file3Ds, jsonFiles } from '@/lib/drizzle/schema/index.js';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	authorizeMediaAssetParam,
	authorizeMediaPlacementInput,
	authorizeMediaPathInput,
	filterAuthorizedMediaEntities,
} from '@/server/security/authorized-root-request';
import type { MediaAssetType } from '@/server/security/media-asset-reference';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { DocumentService, DocumentServiceLive } from '@/services/document/document.service.effect';
import { File3DService, File3DServiceLive } from '@/services/file3d/file3d.service.effect';
import { JsonFileService, JsonFileServiceLive } from '@/services/json-file/json-file.service.effect';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const logger = serverLogger.withContext('FileServicesRoutes');

type PersistedSvgThumbnail = { data?: unknown; format?: unknown } | string;

function isSvgDocument(value: string): boolean {
	const normalized = value.trim();
	return /^<svg(?:\s|>)/i.test(normalized) && /<\/svg>$/i.test(normalized);
}

function decodePersistedSvgThumbnail(
	thumbnail: PersistedSvgThumbnail | null | undefined,
	encoding: 'auto' | 'base64' = 'auto'
): string | null {
	if (!thumbnail) return null;
	if (typeof thumbnail === 'object') {
		if (String(thumbnail.format).toLowerCase() !== 'svg' || typeof thumbnail.data !== 'string') return null;
		return decodePersistedSvgThumbnail(thumbnail.data, 'base64');
	}

	if (encoding === 'auto' && isSvgDocument(thumbnail)) return thumbnail.trim();
	try {
		const decoded = Buffer.from(thumbnail, 'base64').toString('utf8').trim();
		return isSvgDocument(decoded) ? decoded : null;
	} catch {
		return null;
	}
}

function sendSvg(res: express.Response, svg: string, maxAgeSeconds: number): void {
	res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
	res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}`);
	res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.send(svg);
}

function listAuthorizedFileRows<T extends { id?: unknown; path?: unknown }, E>(
	request: { app: { locals: Record<string, unknown> } },
	assetType: MediaAssetType,
	fetchPage: (offset: number, limit: number) => Effect.Effect<{ data: T[] }, E, never>,
	page: { limit: number; offset: number }
) {
	return Effect.gen(function* () {
		const authorized: T[] = [];
		let rawOffset = 0;
		const chunkSize = 500;
		while (true) {
			const chunk = yield* fetchPage(rawOffset, chunkSize);
			authorized.push(
				...(yield* Effect.promise(() =>
					filterAuthorizedMediaEntities(request, chunk.data, assetType, ['read', 'index'])
				))
			);
			rawOffset += chunk.data.length;
			if (chunk.data.length < chunkSize) break;
		}
		return {
			hasNext: page.offset + page.limit < authorized.length,
			items: authorized.slice(page.offset, page.offset + page.limit),
			total: authorized.length,
		};
	});
}

// File3D
const file3dsEffectRouter = express.Router();
file3dsEffectRouter.use(sanitizeJsonResponses);
file3dsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			const page = {
				limit: sanitizeLimit(String(req.query.limit ?? '50')),
				offset: sanitizeOffset(String(req.query.offset ?? '0')),
			};
			const result = yield* listAuthorizedFileRows(
				req,
				'file3d',
				(offset, limit) => service.getAll({ isFavorite: onlyFavorites || undefined, limit, offset }),
				page
			);
			return result.items.map((file3d) => ({
				...file3d,
				entityType: 'file3d' as const,
				thumbnailUrl: `/api/thumbnails/unified/3d/${file3d.id}`,
			}));
		}).pipe(Effect.provide(File3DServiceLive))
	)
);
file3dsEffectRouter.get('/:id/thumbnail', authorizeMediaAssetParam({ assetType: 'file3d' }), async (req, res) => {
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
				logger.warn('No se pudo interpretar metadata del modelo 3D', { assetId: id, error: e });
			}
		}

		// Si ya tiene thumbnail generado en metadata
		if (metadata?.thumbnail) {
			const thumbnailSvg = decodePersistedSvgThumbnail(metadata.thumbnail);
			if (thumbnailSvg) {
				sendSvg(res, thumbnailSvg, 3600);
				return;
			}
			logger.warn('Thumbnail SVG 3D persistido inválido; se usa fallback', { assetId: id });
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

		sendSvg(res, errorSVG, 60);
	} catch (error) {
		logger.error('No se pudo generar el thumbnail 3D', { error });
		res.status(500).json({ error: 'Error generating 3D thumbnail' });
	}
});
file3dsEffectRouter.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'file3d', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(File3DServiceLive))
	)
);
file3dsEffectRouter.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			const result = yield* service.create(req.body);
			res.status(201);
			return result;
		}).pipe(Effect.provide(File3DServiceLive))
	)
);
file3dsEffectRouter.put(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'file3d', permissions: ['read', 'write'] }),
	authorizeMediaPathInput({ expected: 'file', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			return yield* service.update(req.params.id, req.body);
		}).pipe(Effect.provide(File3DServiceLive))
	)
);
file3dsEffectRouter.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'file3d', permissions: ['delete'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(File3DServiceLive))
	)
);
file3dsEffectRouter.post(
	'/:id/restore',
	authorizeMediaAssetParam({
		allowDeleted: true,
		allowMissing: true,
		assetType: 'file3d',
		permissions: ['read', 'write'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* File3DService;
			return yield* service.restoreById(req.params.id);
		}).pipe(Effect.provide(File3DServiceLive))
	)
);

// Documents
const documentsEffectRouter = express.Router();
documentsEffectRouter.use(sanitizeJsonResponses);
documentsEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			const page = {
				limit: sanitizeLimit(String(req.query.limit ?? '50')),
				offset: sanitizeOffset(String(req.query.offset ?? '0')),
			};
			const result = yield* listAuthorizedFileRows(
				req,
				'document',
				(offset, limit) => service.getAll({ isFavorite: onlyFavorites || undefined, limit, offset }),
				page
			);
			return result.items.map((document) => ({
				...document,
				entityType: 'document' as const,
				thumbnailUrl: `/api/thumbnails/unified/document/${document.id}`,
			}));
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.get('/:id/preview', authorizeMediaAssetParam({ assetType: 'document' }), async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 212,
			height: Number.parseInt(req.query.height as string, 10) || 300,
		};

		// Obtener thumbnail de la tabla metadatas
		const thumbnailId = `${id}-thumbnail`;
		const metadataRecords = await db
			.select({ type: metadatas.type, value: metadatas.value })
			.from(metadatas)
			.where(eq(metadatas.id, thumbnailId));

		if (metadataRecords.length > 0) {
			const record = metadataRecords[0];
			const thumbnailSvg = decodePersistedSvgThumbnail(record.value, record.type === 'base64' ? 'base64' : 'auto');
			if (thumbnailSvg) {
				sendSvg(res, thumbnailSvg, 3600);
				return;
			}
			logger.warn('Preview SVG de documento persistido inválido; se usa fallback', { assetId: id });
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

		sendSvg(res, errorSVG, 60);
	} catch (error) {
		logger.error('No se pudo generar el preview de documento', { error });
		res.status(500).json({ error: 'Error generating document preview' });
	}
});
documentsEffectRouter.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'document', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			const result = yield* service.create(req.body);
			res.status(201);
			return result;
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.put(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'document', permissions: ['read', 'write'] }),
	authorizeMediaPathInput({ expected: 'file', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			return yield* service.update(req.params.id, req.body);
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'document', permissions: ['delete'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.post(
	'/:id/restore',
	authorizeMediaAssetParam({
		allowDeleted: true,
		allowMissing: true,
		assetType: 'document',
		permissions: ['read', 'write'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			return yield* service.restoreById(req.params.id);
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);
documentsEffectRouter.get(
	'/:id/images',
	authorizeMediaAssetParam({ assetType: 'document', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* DocumentService;
			return yield* service.getImages(req.params.id);
		}).pipe(Effect.provide(DocumentServiceLive))
	)
);

// JsonFiles
const jsonFilesEffectRouter = express.Router();
jsonFilesEffectRouter.use(sanitizeJsonResponses);
jsonFilesEffectRouter.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			const limit = sanitizeLimit(String(req.query.limit ?? '50'));
			const offset = sanitizeOffset(String(req.query.offset ?? '0'));
			const onlyFavorites = req.query.onlyFavorites === 'true' || req.query.isFavorite === 'true';
			const result = yield* listAuthorizedFileRows(
				req,
				'json',
				(rawOffset, chunkLimit) =>
					service.getAll({ isFavorite: onlyFavorites || undefined, limit: chunkLimit, offset: rawOffset }),
				{ limit, offset }
			);
			const data = result.items.map((jsonFile) => ({
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
					hasNext: result.hasNext,
					hasPrev: offset > 0,
				},
			};
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.get('/:id/preview', authorizeMediaAssetParam({ assetType: 'json' }), async (req, res) => {
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
				logger.warn('No se pudo interpretar metadata del archivo JSON', { assetId: id, error: e });
			}
		}

		// Si ya tiene thumbnail generado en metadata
		if (metadata?.thumbnail) {
			const thumbnailSvg = decodePersistedSvgThumbnail(metadata.thumbnail);
			if (thumbnailSvg) {
				sendSvg(res, thumbnailSvg, 3600);
				return;
			}
			logger.warn('Preview SVG JSON persistido inválido; se usa fallback', { assetId: id });
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

		sendSvg(res, errorSVG, 60);
	} catch (error) {
		logger.error('No se pudo generar el preview JSON', { error });
		res.status(500).json({ error: 'Error generating JSON preview' });
	}
});
jsonFilesEffectRouter.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'json', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			return yield* service.getById(req.params.id);
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			const result = yield* service.create(req.body);
			res.status(201);
			return result;
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.put(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'json', permissions: ['read', 'write'] }),
	authorizeMediaPathInput({ expected: 'file', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			return yield* service.update(req.params.id, req.body);
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'json', permissions: ['delete'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			yield* service.delete(req.params.id);
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.post(
	'/:id/restore',
	authorizeMediaAssetParam({
		allowDeleted: true,
		allowMissing: true,
		assetType: 'json',
		permissions: ['read', 'write'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			return yield* service.restoreById(req.params.id);
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);
jsonFilesEffectRouter.get(
	'/:id/images',
	authorizeMediaAssetParam({ assetType: 'json', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			return yield* service.getImages(req.params.id);
		}).pipe(Effect.provide(JsonFileServiceLive))
	)
);

// Cargas directas heredadas
const uploadedImagesEffectRouter = express.Router();
uploadedImagesEffectRouter.use(sanitizeJsonResponses);
uploadedImagesEffectRouter.use((_request, response) => {
	response.status(410).json({
		code: 'AUTHORIZED_ROOT_INGEST_REQUIRED',
		message: 'Las cargas directas fueron retiradas. Añade archivos a un media root autorizado y reindexa la carpeta.',
		retryable: false,
	});
});

export { file3dsEffectRouter, documentsEffectRouter, jsonFilesEffectRouter, uploadedImagesEffectRouter };
