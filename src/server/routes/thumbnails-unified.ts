/**
 * @file Rutas unificadas para thumbnails de todas las entidades
 * @module server/routes/thumbnails-unified
 * @description Endpoints para obtener, generar y gestionar thumbnails
 *              de imágenes, videos, audio, documentos, JSON y modelos 3D
 */

import { and, eq } from 'drizzle-orm';
import express from 'express';
import { db } from '@/lib/drizzle';
import {
	audios,
	documents,
	file3Ds,
	images,
	jsonFiles,
	metadatas,
	videos,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	thumbnailUnifiedService,
	type ThumbnailEntityType,
	type ThumbnailOptions,
} from '@/services/thumbnail/thumbnail-unified.service';

const router = express.Router();
const logger = serverLogger.withContext('ThumbnailsUnifiedRoute');

// ===================== ENDPOINTS INDIVIDUALES =====================

/**
 * GET /thumbnails/unified/image/:id - Obtener thumbnail de imagen
 */
router.get('/image/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('image', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/webp');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			// Fallback a placeholder
			const placeholder = generatePlaceholderSVG('image', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving image thumbnail:', error);
		res.status(500).json({ error: 'Error serving thumbnail' });
	}
});

/**
 * GET /thumbnails/unified/video/:id - Obtener thumbnail de video
 */
router.get('/video/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('video', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/webp');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			const placeholder = generatePlaceholderSVG('video', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving video thumbnail:', error);
		res.status(500).json({ error: 'Error serving thumbnail' });
	}
});

/**
 * GET /thumbnails/unified/audio/:id - Obtener waveform de audio
 */
router.get('/audio/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('audio', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			const placeholder = generatePlaceholderSVG('audio', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving audio waveform:', error);
		res.status(500).json({ error: 'Error serving waveform' });
	}
});

/**
 * GET /thumbnails/unified/document/:id - Obtener preview de documento
 */
router.get('/document/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('document', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			const placeholder = generatePlaceholderSVG('document', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving document thumbnail:', error);
		res.status(500).json({ error: 'Error serving document preview' });
	}
});

/**
 * GET /thumbnails/unified/json/:id - Obtener preview de JSON
 */
router.get('/json/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('jsonFile', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			const placeholder = generatePlaceholderSVG('jsonFile', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving JSON thumbnail:', error);
		res.status(500).json({ error: 'Error serving JSON preview' });
	}
});

/**
 * GET /thumbnails/unified/3d/:id - Obtener thumbnail de modelo 3D
 */
router.get('/3d/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const options = parseOptions(req.query);

		const result = await thumbnailUnifiedService.getThumbnail('file3d', id, options);

		if (result.success && result.data) {
			res.setHeader('Content-Type', result.mimeType || 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=31536000');
			res.setHeader('X-Thumbnail-Generated', result.generated ? 'true' : 'false');
			res.end(result.data);
		} else {
			const placeholder = generatePlaceholderSVG('file3d', id);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.status(404).send(placeholder);
		}
	} catch (error) {
		logger.error('Error serving 3D thumbnail:', error);
		res.status(500).json({ error: 'Error serving 3D preview' });
	}
});

// ===================== ENDPOINTS GENÉRICOS =====================

/**
 * POST /thumbnails/unified/generate - Generar thumbnail para cualquier entidad
 * Body: { entityType: string, entityId: string, options?: ThumbnailOptions }
 */
router.post('/generate', async (req, res) => {
	try {
		const { entityType, entityId, options = {} } = req.body;

		if (!entityType || !entityId) {
			res.status(400).json({ error: 'entityType and entityId are required' });
			return;
		}

		if (!isValidEntityType(entityType)) {
			res.status(400).json({ error: `Invalid entity type: ${entityType}` });
			return;
		}

		logger.info(`Generating thumbnail: ${entityType}/${entityId}`);
		const result = await thumbnailUnifiedService.getThumbnail(entityType, entityId, {
			...options,
			force: true,
		});

		if (result.success) {
			res.json({
				success: true,
				entityType,
				entityId,
				mimeType: result.mimeType,
				width: result.width,
				height: result.height,
				generated: result.generated,
			});
		} else {
			res.status(500).json({
				success: false,
				error: result.error || 'Thumbnail generation failed',
			});
		}
	} catch (error) {
		logger.error('Error generating thumbnail:', error);
		res.status(500).json({ error: 'Error generating thumbnail' });
	}
});

/**
 * POST /thumbnails/unified/batch - Generar múltiples thumbnails
 * Body: { requests: Array<{ entityType: string, entityId: string }>, options?: ThumbnailOptions }
 */
router.post('/batch', async (req, res) => {
	try {
		const { requests, options = {} } = req.body;

		if (!Array.isArray(requests) || requests.length === 0) {
			res.status(400).json({ error: 'requests array is required' });
			return;
		}

		if (requests.length > 20) {
			res.status(400).json({ error: 'Maximum 20 requests per batch' });
			return;
		}

		// Validar todos los tipos
		const invalidTypes = requests.filter((r) => !isValidEntityType(r.entityType));
		if (invalidTypes.length > 0) {
			res.status(400).json({
				error: 'Invalid entity types found',
				invalid: invalidTypes.map((r) => r.entityType),
			});
			return;
		}

		logger.info(`Batch generating ${requests.length} thumbnails`);
		const results = await thumbnailUnifiedService.generateBatch(requests, options);

		const summary = {
			total: requests.length,
			successful: Object.values(results).filter((r) => r.success).length,
			failed: Object.values(results).filter((r) => !r.success).length,
			generated: Object.values(results).filter((r) => r.generated).length,
		};

		res.json({
			success: true,
			summary,
			results,
		});
	} catch (error) {
		logger.error('Error in batch thumbnail generation:', error);
		res.status(500).json({ error: 'Error in batch generation' });
	}
});

/**
 * GET /thumbnails/unified/info/:entityType/:entityId - Obtener información del thumbnail
 */
router.get('/info/:entityType/:entityId', async (req, res) => {
	try {
		const { entityType, entityId } = req.params;

		if (!isValidEntityType(entityType)) {
			res.status(400).json({ error: `Invalid entity type: ${entityType}` });
			return;
		}

		const info = await thumbnailUnifiedService.getThumbnailInfo(entityType, entityId);

		res.json({
			entityType,
			entityId,
			...info,
		});
	} catch (error) {
		logger.error('Error getting thumbnail info:', error);
		res.status(500).json({ error: 'Error getting thumbnail info' });
	}
});

/**
 * GET /thumbnails/unified/stats - Estadísticas de thumbnails
 */
router.get('/stats', async (_req, res) => {
	try {
		// Contar thumbnails por tipo
		const [
			imageStats,
			videoStats,
			audioStats,
			documentStats,
			jsonStats,
			file3dStats,
		] = await Promise.all([
			// Imágenes con thumbnail
			db
				.select({ count: db.fn.count() })
				.from(images)
				.where(and(eq(db.sql`length(${images.thumbnail})`, images.thumbnail))),
			// Videos con thumbnail
			db.select({ count: db.fn.count() }).from(videos).where(and(eq(videos.thumbnail, videos.thumbnail))),
			// Audio con waveform (buscando en metadata)
			db.select({ count: db.fn.count() }).from(audios),
			// Documentos con thumbnail (en metadatas)
			db
				.select({ count: db.fn.count() })
				.from(metadatas)
				.where(and(eq(metadatas.entityType, 'document'), eq(metadatas.key, 'thumbnail'))),
			// JSON con thumbnail
			db.select({ count: db.fn.count() }).from(jsonFiles),
			// 3D con thumbnail
			db.select({ count: db.fn.count() }).from(file3Ds),
		]);

		// Totales
		const [totalImages, totalVideos, totalAudios, totalDocuments, totalJsonFiles, totalFile3Ds] =
			await Promise.all([
				db.select({ count: db.fn.count() }).from(images),
				db.select({ count: db.fn.count() }).from(videos),
				db.select({ count: db.fn.count() }).from(audios),
				db.select({ count: db.fn.count() }).from(documents),
				db.select({ count: db.fn.count() }).from(jsonFiles),
				db.select({ count: db.fn.count() }).from(file3Ds),
			]);

		res.json({
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
		});
	} catch (error) {
		logger.error('Error getting thumbnail stats:', error);
		res.status(500).json({ error: 'Error getting stats' });
	}
});

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
