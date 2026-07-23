/**
 * @file Rutas unificadas para thumbnails de todas las entidades
 * @module server/routes/thumbnails-unified
 * @description Endpoints para obtener, generar y gestionar thumbnails
 *              de imágenes, videos, audio, documentos, JSON y modelos 3D
 */

import { eq, sql } from 'drizzle-orm';
import express from 'express';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import {
	assets,
	audios,
	documents,
	file3Ds,
	images,
	jsonFiles,
	metadatas,
	sourceFiles,
	videos,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { visibleAssetLifecycleCondition } from '@/services/media-core/canonical-media-persistence';
import {
	authorizeMediaAssetParam,
	getAuthorizedRootRegistry,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
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
): Promise<string> {
	const reference = parseMediaAssetReference({ assetId: entityId, assetType: toMediaAssetType(entityType) });
	const registry = getAuthorizedRootRegistry(request);
	await resolveMediaAssetReference(registry, reference, 'read');
	return (await resolveMediaAssetReference(registry, reference, 'index')).absolutePath;
}

// ===================== ENDPOINTS INDIVIDUALES =====================

/**
 * Helper para enviar respuesta de thumbnail (buffer o SVG placeholder)
 */
function sendThumbnailResult(result: any, res: express.Response, entityType: string, id: string): void {
	if (result.success && result.data) {
		res.setHeader('Content-Type', result.mimeType || 'image/webp');
		res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
		res.setHeader('Vary', 'Cookie');
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
		res.send(result.data);
	} else {
		const placeholder = generatePlaceholderSVG(entityType, id);
		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'private, no-store');
		res.setHeader('Vary', 'Cookie');
		res.setHeader('X-Content-Type-Options', 'nosniff');
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
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('image', id, options, res.locals.authorizedAssetPath),
						entityType: 'image',
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
 * GET /thumbnails/unified/video/:id - Obtener thumbnail de video
 */
router.get(
	'/video/:id',
	authorizeMediaAssetParam({ assetType: 'video', permissions: ['read', 'index'] }),
	effectHandler(
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('video', id, options, res.locals.authorizedAssetPath),
						entityType: 'video',
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
 * GET /thumbnails/unified/audio/:id - Obtener waveform de audio
 */
router.get(
	'/audio/:id',
	authorizeMediaAssetParam({ assetType: 'audio', permissions: ['read', 'index'] }),
	effectHandler(
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('audio', id, options, res.locals.authorizedAssetPath),
						entityType: 'audio',
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
 * GET /thumbnails/unified/document/:id - Obtener preview de documento
 */
router.get(
	'/document/:id',
	authorizeMediaAssetParam({ assetType: 'document', permissions: ['read', 'index'] }),
	effectHandler(
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('document', id, options, res.locals.authorizedAssetPath),
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
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('jsonFile', id, options, res.locals.authorizedAssetPath),
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
		(req, res) =>
			Effect.tryPromise({
				try: async () => {
					const { id } = req.params;
					const options = parseOptions(req.query);
					return {
						result: await thumbnailUnifiedService.getThumbnail('file3d', id, options, res.locals.authorizedAssetPath),
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
				const authorizedSourcePath = await authorizeThumbnailAsset(req, entityType, entityId);

				logger.info(`Generating thumbnail: ${entityType}/${entityId}`);
				const result = await thumbnailUnifiedService.getThumbnail(
					entityType,
					entityId,
					{
						...options,
						force: true,
					},
					authorizedSourcePath
				);

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
				const authorizedSourcePaths = await Promise.all(
					requests.map((request: { entityId: unknown; entityType: ThumbnailEntityType }) =>
						authorizeThumbnailAsset(req, request.entityType, request.entityId)
					)
				);

				logger.info(`Batch generating ${requests.length} thumbnails`);
				const results = await thumbnailUnifiedService.generateBatch(requests, options, authorizedSourcePaths);

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
	(req, res, next) => {
		try {
			getAuthorizedRootRegistry(req);
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(res, error)) next(error);
		}
	},
	effectHandler((req) =>
		Effect.tryPromise({
			try: async () => {
				const registry = getAuthorizedRootRegistry(req);
				const [imageRows, videoRows, audioRows, documentRows, jsonRows, file3dRows] = await Promise.all([
					db
						.select({
							assetId: images.assetId,
							id: images.id,
							path: images.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`CASE WHEN ${images.thumbnail} IS NOT NULL THEN 1 ELSE 0 END`,
						})
						.from(images)
						.leftJoin(assets, eq(images.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(images.assetId)),
					db
						.select({
							assetId: videos.assetId,
							id: videos.id,
							path: videos.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`CASE WHEN ${videos.thumbnail} IS NOT NULL THEN 1 ELSE 0 END`,
						})
						.from(videos)
						.leftJoin(assets, eq(videos.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(videos.assetId)),
					db
						.select({
							assetId: audios.assetId,
							id: audios.id,
							path: audios.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`CASE WHEN json_valid(${audios.metadata}) THEN
								json_type(${audios.metadata}, '$.waveform') IS NOT NULL OR
								json_type(${audios.metadata}, '$.waveformBase64') IS NOT NULL
							ELSE 0 END`,
						})
						.from(audios)
						.leftJoin(assets, eq(audios.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(audios.assetId)),
					db
						.select({
							assetId: documents.assetId,
							id: documents.id,
							path: documents.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`CASE WHEN ${documents.thumbnail} IS NOT NULL OR EXISTS (
								SELECT 1 FROM ${metadatas}
								WHERE ${metadatas.entityId} = ${documents.id}
									AND ${metadatas.entityType} = 'document'
									AND ${metadatas.key} = 'thumbnail'
									AND ${metadatas.value} IS NOT NULL
							) THEN 1 ELSE 0 END`,
						})
						.from(documents)
						.leftJoin(assets, eq(documents.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(documents.assetId)),
					db
						.select({
							assetId: jsonFiles.assetId,
							id: jsonFiles.id,
							path: jsonFiles.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`0`,
						})
						.from(jsonFiles)
						.leftJoin(assets, eq(jsonFiles.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(jsonFiles.assetId)),
					db
						.select({
							assetId: file3Ds.assetId,
							id: file3Ds.id,
							path: file3Ds.path,
							relativePath: sourceFiles.relativePath,
							rootId: sourceFiles.rootId,
							sourceAssetId: sourceFiles.assetId,
							withDerived: sql<number>`0`,
						})
						.from(file3Ds)
						.leftJoin(assets, eq(file3Ds.assetId, assets.id))
						.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
						.where(visibleAssetLifecycleCondition(file3Ds.assetId)),
				]);
				const scopeRows = async <
					TRow extends {
						assetId: string | null;
						path: string;
						relativePath: string | null;
						rootId: string | null;
						sourceAssetId: string | null;
						withDerived: number;
					},
				>(
					rows: readonly TRow[]
				): Promise<TRow[]> => {
					const scoped: TRow[] = [];
					for (const row of rows) {
						if (row.assetId) {
							if (row.sourceAssetId !== row.assetId || !row.rootId || !row.relativePath) continue;
							try {
								const reference = { relativePath: row.relativePath, rootId: row.rootId };
								await registry.resolve(reference, 'read');
								await registry.resolve(reference, 'index');
								scoped.push(row);
							} catch {
								// El rootId persistido no basta: la ubicación canónica debe seguir
								// resolviendo bajo el root y los permisos actuales de la solicitud.
							}
							continue;
						}
						try {
							await registry.authorizeAbsolutePath(row.path, 'read');
							await registry.authorizeAbsolutePath(row.path, 'index');
							scoped.push(row);
						} catch {
							// Legacy rows outside the request scope are intentionally invisible.
						}
					}
					return scoped;
				};
				const [scopedImages, scopedVideos, scopedAudios, scopedDocuments, scopedJson, scopedFile3d] = await Promise.all(
					[
						scopeRows(imageRows),
						scopeRows(videoRows),
						scopeRows(audioRows),
						scopeRows(documentRows),
						scopeRows(jsonRows),
						scopeRows(file3dRows),
					]
				);
				const derivedCount = (rows: ReadonlyArray<{ withDerived: number }>) =>
					rows.reduce((total, row) => total + (Number(row.withDerived) ? 1 : 0), 0);

				return {
					byType: {
						image: {
							total: scopedImages.length,
							withThumbnail: derivedCount(scopedImages),
						},
						video: {
							total: scopedVideos.length,
							withThumbnail: derivedCount(scopedVideos),
						},
						audio: {
							total: scopedAudios.length,
							withWaveform: derivedCount(scopedAudios),
						},
						document: {
							total: scopedDocuments.length,
							withThumbnail: derivedCount(scopedDocuments),
						},
						jsonFile: {
							total: scopedJson.length,
						},
						file3d: {
							total: scopedFile3d.length,
						},
					},
					totals: {
						entities:
							scopedImages.length +
							scopedVideos.length +
							scopedAudios.length +
							scopedDocuments.length +
							scopedJson.length +
							scopedFile3d.length,
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
