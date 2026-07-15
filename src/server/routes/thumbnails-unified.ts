/**
 * @file Rutas unificadas para thumbnails de todas las entidades
 * @module server/routes/thumbnails-unified
 * @description Endpoints para obtener, generar y gestionar thumbnails
 *              de imágenes, videos, audio, documentos, JSON y modelos 3D
 */

import { and, eq } from 'drizzle-orm';
import express from 'express';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, images, jsonFiles, metadatas, videos } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { authorizeMediaAssetParam, getAuthorizedRootRegistry } from '@/server/security/authorized-root-request';
import {
	type MediaAssetType,
	parseMediaAssetReference,
	resolveMediaAssetReference,
} from '@/server/security/media-asset-reference';
import {
	type ThumbnailEntityType,
	type ThumbnailOptions,
	thumbnailUnifiedService,
} from '@/services/thumbnail/thumbnail-unified.service';

const router = express.Router();
const logger = serverLogger.withContext('ThumbnailsUnifiedRoute');

function toMediaAssetType(entityType: ThumbnailEntityType): MediaAssetType {
	return entityType === 'jsonFile' ? 'json' : entityType;
}

async function authorizeThumbnailAsset(
	request: express.Request,
	entityType: ThumbnailEntityType,
	entityId: unknown
): Promise<void> {
	const reference = parseMediaAssetReference({ assetId: entityId, assetType: toMediaAssetType(entityType) });
	const registry = getAuthorizedRootRegistry(request);
	await resolveMediaAssetReference(registry, reference, 'read');
	await resolveMediaAssetReference(registry, reference, 'index');
}

// ===================== ENDPOINTS INDIVIDUALES =====================

/**
 * Helper para enviar respuesta de thumbnail (buffer o SVG placeholder)
 */
function sendThumbnailResult(result: any, res: express.Response, entityType: string, id: string): void {
	if (result.success && result.data) {
		res.setHeader('Content-Type', result.mimeType || 'image/webp');
		res.setHeader('Cache-Control', 'public, max-age=31536000');
		res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
		res.end(result.data);
	} else {
		const placeholder = generatePlaceholderSVG(entityType, id);
		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.status(404).send(placeholder);
	}
}

/**
 * GET /thumbnails/unified/image/:id - Obtener thumbnail de imagen
 */
router.get(
	'/image/:id',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return { result: await thumbnailUnifiedService.getThumbnail('image', id, options), entityType: 'image', id };
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

/**
 * GET /thumbnails/unified/video/:id - Obtener thumbnail de video
 */
router.get(
	'/video/:id',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return { result: await thumbnailUnifiedService.getThumbnail('video', id, options), entityType: 'video', id };
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

/**
 * GET /thumbnails/unified/audio/:id - Obtener waveform de audio
 */
router.get(
	'/audio/:id',
	authorizeMediaAssetParam({ assetType: 'audio', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return { result: await thumbnailUnifiedService.getThumbnail('audio', id, options), entityType: 'audio', id };
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

/**
 * GET /thumbnails/unified/document/:id - Obtener preview de documento
 */
router.get(
	'/document/:id',
	authorizeMediaAssetParam({ assetType: 'document', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('document', id, options),
						entityType: 'document',
						id,
					};
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

/**
 * GET /thumbnails/unified/json/:id - Obtener preview de JSON
 */
router.get(
	'/json/:id',
	authorizeMediaAssetParam({ assetType: 'json', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('jsonFile', id, options),
						entityType: 'jsonFile',
						id,
					};
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

/**
 * GET /thumbnails/unified/3d/:id - Obtener thumbnail de modelo 3D
 */
router.get(
	'/3d/:id',
	authorizeMediaAssetParam({ assetType: 'file3d', permissions: ['read', 'index'] }),
	effectHandler(
		(req) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('file3d', id, options),
						entityType: 'file3d',
						id,
					};
				},
				catch: (error) => new Error(String(error)),
			}),
		{
			onSuccess: (data, res) => {
				sendThumbnailResult(data.result, res, data.entityType, data.id);
			},
		}
	)
);

// ===================== ENDPOINTS GENÉRICOS =====================

/**
 * POST /thumbnails/unified/generate - Generar thumbnail para cualquier entidad
 * Body: { entityType: string, entityId: string, options?: ThumbnailOptions }
 */
router.post(
	'/generate',
	effectHandler((req) =>
		Effect.tryPromise({
			try: async () => {
				const { entityType, entityId, options = {} } = req.body;

				if (!(entityType && entityId)) {
					throw Object.assign(new Error('entityType and entityId are required'), { _tag: 'ValidationError' });
				}

				if (!isValidEntityType(entityType)) {
					throw Object.assign(new Error(`Invalid entity type: ${entityType}`), { _tag: 'ValidationError' });
				}
				await authorizeThumbnailAsset(req, entityType, entityId);

				logger.info(`Generating thumbnail: ${entityType}/${entityId}`);
				const result = await thumbnailUnifiedService.getThumbnail(entityType, entityId, {
					...options,
					force: true,
				});

				if (result.success) {
					return {
						success: true,
						entityType,
						entityId,
						mimeType: result.mimeType,
						width: result.width,
						height: result.height,
						generated: result.generated,
					};
				}

				throw Object.assign(new Error(result.error || 'Thumbnail generation failed'), { _tag: 'DatabaseError' });
			},
			catch: (error) => new Error(String(error)),
		})
	)
);

/**
 * POST /thumbnails/unified/batch - Generar múltiples thumbnails
 * Body: { requests: Array<{ entityType: string, entityId: string }>, options?: ThumbnailOptions }
 */
router.post(
	'/batch',
	effectHandler((req) =>
		Effect.tryPromise({
			try: async () => {
				const { requests, options = {} } = req.body;

				if (!Array.isArray(requests) || requests.length === 0) {
					throw Object.assign(new Error('requests array is required'), { _tag: 'ValidationError' });
				}

				if (requests.length > 20) {
					throw Object.assign(new Error('Maximum 20 requests per batch'), { _tag: 'ValidationError' });
				}

				const invalidTypes = requests.filter((r: any) => !isValidEntityType(r.entityType));
				if (invalidTypes.length > 0) {
					throw Object.assign(
						new Error(`Invalid entity types found: ${invalidTypes.map((r: any) => r.entityType).join(', ')}`),
						{ _tag: 'ValidationError' }
					);
				}
				await Promise.all(
					requests.map((request: { entityId: unknown; entityType: ThumbnailEntityType }) =>
						authorizeThumbnailAsset(req, request.entityType, request.entityId)
					)
				);

				logger.info(`Batch generating ${requests.length} thumbnails`);
				const results = await thumbnailUnifiedService.generateBatch(requests, options);

				const summary = {
					total: requests.length,
					successful: Object.values(results).filter((r) => r.success).length,
					failed: Object.values(results).filter((r) => !r.success).length,
					generated: Object.values(results).filter((r) => r.generated).length,
				};

				return {
					success: true,
					summary,
					results,
				};
			},
			catch: (error) => new Error(String(error)),
		})
	)
);

/**
 * GET /thumbnails/unified/info/:entityType/:entityId - Obtener información del thumbnail
 */
router.get(
	'/info/:entityType/:entityId',
	authorizeMediaAssetParam({
		assetType: (request) => (request.params.entityType === 'jsonFile' ? 'json' : request.params.entityType),
		idParam: 'entityId',
	}),
	effectHandler((req) =>
		Effect.tryPromise({
			try: async () => {
				const { entityType, entityId } = req.params;

				if (!isValidEntityType(entityType)) {
					throw Object.assign(new Error(`Invalid entity type: ${entityType}`), { _tag: 'ValidationError' });
				}

				const info = await thumbnailUnifiedService.getThumbnailInfo(entityType, entityId);

				return {
					entityType,
					entityId,
					...info,
				};
			},
			catch: (error) => new Error(String(error)),
		})
	)
);

/**
 * GET /thumbnails/unified/stats - Estadísticas de thumbnails
 */
router.get(
	'/stats',
	effectHandler((_req) =>
		Effect.tryPromise({
			try: async () => {
				const [imageStats, videoStats, audioStats, documentStats, jsonStats, file3dStats] = await Promise.all([
					db
						.select({ count: db.fn.count() })
						.from(images)
						.where(and(eq(db.sql`length(${images.thumbnail})`, images.thumbnail))),
					db
						.select({ count: db.fn.count() })
						.from(videos)
						.where(and(eq(videos.thumbnail, videos.thumbnail))),
					db.select({ count: db.fn.count() }).from(audios),
					db
						.select({ count: db.fn.count() })
						.from(metadatas)
						.where(and(eq(metadatas.entityType, 'document'), eq(metadatas.key, 'thumbnail'))),
					db.select({ count: db.fn.count() }).from(jsonFiles),
					db.select({ count: db.fn.count() }).from(file3Ds),
				]);

				const [totalImages, totalVideos, totalAudios, totalDocuments, totalJsonFiles, totalFile3Ds] = await Promise.all(
					[
						db.select({ count: db.fn.count() }).from(images),
						db.select({ count: db.fn.count() }).from(videos),
						db.select({ count: db.fn.count() }).from(audios),
						db.select({ count: db.fn.count() }).from(documents),
						db.select({ count: db.fn.count() }).from(jsonFiles),
						db.select({ count: db.fn.count() }).from(file3Ds),
					]
				);

				return {
					byType: {
						image: {
							total: Number(totalImages[0]?.count || 0),
							withThumbnail: Number(imageStats[0]?.count || 0),
						},
						video: {
							total: Number(totalVideos[0]?.count || 0),
							withThumbnail: Number(videoStats[0]?.count || 0),
						},
						audio: {
							total: Number(totalAudios[0]?.count || 0),
							withWaveform: Number(audioStats[0]?.count || 0),
						},
						document: {
							total: Number(totalDocuments[0]?.count || 0),
							withThumbnail: Number(documentStats[0]?.count || 0),
						},
						jsonFile: {
							total: Number(totalJsonFiles[0]?.count || 0),
						},
						file3d: {
							total: Number(totalFile3Ds[0]?.count || 0),
						},
					},
					totals: {
						entities:
							Number(totalImages[0]?.count || 0) +
							Number(totalVideos[0]?.count || 0) +
							Number(totalAudios[0]?.count || 0) +
							Number(totalDocuments[0]?.count || 0) +
							Number(totalJsonFiles[0]?.count || 0) +
							Number(totalFile3Ds[0]?.count || 0),
					},
				};
			},
			catch: (error) => new Error(String(error)),
		})
	)
);

// ===================== HELPER FUNCTIONS =====================

function parseOptions(query: any): ThumbnailOptions {
	return {
		width: query.width ? Number.parseInt(query.width, 10) : undefined,
		height: query.height ? Number.parseInt(query.height, 10) : undefined,
		quality: ['low', 'medium', 'high'].includes(query.quality) ? query.quality : 'medium',
		force: query.force === 'true',
	};
}

function isValidEntityType(type: string): type is ThumbnailEntityType {
	return ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'].includes(type);
}

function generatePlaceholderSVG(entityType: string, id: string): string {
	const colors: Record<string, { bg: string; icon: string; text: string }> = {
		image: { bg: '#1f2937', icon: '#6b7280', text: '#9ca3af' },
		video: { bg: '#1f2937', icon: '#dc2626', text: '#9ca3af' },
		audio: { bg: '#111827', icon: '#10b981', text: '#6b7280' },
		document: { bg: '#ffffff', icon: '#3b82f6', text: '#1f2937' },
		jsonFile: { bg: '#111827', icon: '#a855f7', text: '#f9fafb' },
		file3d: { bg: '#111827', icon: '#6366f1', text: '#9ca3af' },
	};

	const c = colors[entityType] || colors.image;
	const labels: Record<string, string> = {
		image: '🖼️',
		video: '🎬',
		audio: '🎵',
		document: '📄',
		jsonFile: '📋',
		file3d: '🎲',
	};

	return `
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="${c.bg}" rx="8"/>
  <text x="150" y="140" font-size="64" text-anchor="middle">${labels[entityType] || '📄'}</text>
  <text x="150" y="200" font-family="Arial" font-size="14" fill="${c.text}" text-anchor="middle">
    Sin thumbnail
  </text>
  <text x="150" y="220" font-family="monospace" font-size="10" fill="${c.icon}" text-anchor="middle">
    ${id.slice(0, 12)}...
  </text>
</svg>`;
}

export { router as thumbnailsUnifiedRouter };
export default router;
