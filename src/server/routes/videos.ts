import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateAnimatedVideoThumbnail } from '@/lib/utils/video/helpers';
import { fromDrizzleVideoWithCounts } from '@/transformers/video/transformer';
import {
	deleteVideo,
	getVideoById,
	getVideoFormatStats,
	getVideos,
	updateVideo,
} from '../services/video.server.service';

const router = Router() as any;

const VideoCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	path: z.string().min(1),
	hash: z.string().min(1),
	size: z.number().min(0),
	mimeType: z.string().min(1), // Agregado para compatibilidad con el servicio
	duration: z.number().min(0),
	width: z.number().int().min(0).nullable().optional(),
	height: z.number().int().min(0).nullable().optional(),
	metadata: z.string().nullable().optional(),
	thumbnail: z.string().nullable().optional(),
	thumbnailSize: z.number().int().min(0).nullable().optional(),
	thumbnailWidth: z.number().int().min(0).nullable().optional(),
	thumbnailHeight: z.number().int().min(0).nullable().optional(),

	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	folderId: z.string().min(1),
});

const VideoUpdateSchema = VideoCreateSchema.partial();

// GET /api/videos - Obtener videos con filtros
router.get('/', async (req: Request, res: Response) => {
	try {
		const filters = req.query; // Los filtros se validan en el servicio
		const result = await getVideos(filters as any);

		// Transformar a VideoWithStats para la UI (incluye entityType y stats)
		const transformed = Array.isArray(result?.data)
			? (result.data as any[]).map((v) => {
					try {
						return fromDrizzleVideoWithCounts(v as any);
					} catch {
						// Fallback mínimo si falla el transformer
						return {
							...v,
							entityType: 'video',
							stats: {
								// mínimos requeridos por la UI
								resolution: v.width && v.height ? `${v.width}x${v.height}` : 'unknown',
								formattedSize: `${Math.round((v.size || 0) / (1024 * 1024))} MB`,
								hasAudio: true,
								hasSubtitles: false,
								qualityLevel: 'unknown',
								technicalGrade: 'D',
								durationMinutes: 0,
								durationHours: 0,
								megabytes: 0,
								gigabytes: 0,
								aspectRatio: 'unknown',
								formattedDuration: '0:00',
								bitrate: null,
								frameRate: null,
								views: 0,
								likes: 0,
								downloads: 0,
								lastViewed: null,
								duplicateStatus: 'unique',
								thumbnailUrl: v?.id ? `/api/videos/${v.id}/thumbnail` : null,
								totalRelations: 0,
								// EntityStats base
								createdAt: new Date(v.createdAt || Date.now()),
								updatedAt: new Date(v.updatedAt || Date.now()),
								size: v.size || 0,
								albumCount: 0,
								collectionCount: 0,
								tagCount: 0,
								characterCount: 0,
								placeCount: 0,
								worldItemCount: 0,
								conceptCount: 0,
								promptCount: 0,
								noteCount: 0,
								wildcardCount: 0,
								propertyCount: 0,
								groupCount: 0,
								totalAssociations: 0,
								totalItems: 0,
								imageCount: 0,
								videoCount: 1,
								lastUpdated: new Date(v.updatedAt || Date.now()),
							},
							thumbnailUrl: v?.id ? `/api/videos/${v.id}/thumbnail` : null,
						};
					}
				})
			: result?.data;

		// Compatibilidad: si el alias es /videos (sin /api), devolver arreglo directo
		if (req.baseUrl === '/videos') {
			return res.json(Array.isArray(transformed) ? transformed : (result?.data ?? []));
		}

		res.json({
			...result,
			data: transformed,
		});
	} catch (error) {
		serverLogger.error('Error al obtener videos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/videos/:id - Obtener un video por ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const video = await getVideoById(id);
		// Transformar a VideoWithStats; si falla, añadir mínimos
		const payload = video
			? (() => {
					try {
						return fromDrizzleVideoWithCounts(video as any);
					} catch {
						return {
							...video,
							entityType: 'video',
							stats: {
								resolution: video.width && video.height ? `${video.width}x${video.height}` : 'unknown',
								formattedSize: `${Math.round((video.size || 0) / (1024 * 1024))} MB`,
								hasAudio: true,
								hasSubtitles: false,
								qualityLevel: 'unknown',
								technicalGrade: 'D',
								durationMinutes: 0,
								durationHours: 0,
								megabytes: 0,
								gigabytes: 0,
								aspectRatio: 'unknown',
								formattedDuration: '0:00',
								bitrate: null,
								frameRate: null,
								views: 0,
								likes: 0,
								downloads: 0,
								lastViewed: null,
								duplicateStatus: 'unique',
								thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
								totalRelations: 0,
								createdAt: new Date(video.createdAt || Date.now()),
								updatedAt: new Date(video.updatedAt || Date.now()),
								size: video.size || 0,
								albumCount: 0,
								collectionCount: 0,
								tagCount: 0,
								characterCount: 0,
								placeCount: 0,
								worldItemCount: 0,
								conceptCount: 0,
								promptCount: 0,
								noteCount: 0,
								wildcardCount: 0,
								propertyCount: 0,
								groupCount: 0,
								totalAssociations: 0,
								totalItems: 0,
								imageCount: 0,
								videoCount: 1,
								lastUpdated: new Date(video.updatedAt || Date.now()),
							},
							thumbnailUrl: `/api/videos/${video.id}/thumbnail`,
						};
					}
				})()
			: null;
		res.json(payload);
	} catch (error) {
		serverLogger.error('Error al obtener video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/videos/:id/content - Servir el video original
router.get('/:id/content', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const video = await getVideoById(id);

		if (!(video && video.path)) {
			res.status(404).send('Video not found');
			return;
		}

		if (!existsSync(video.path)) {
			res.status(404).send('Video file not found');
			return;
		}

		// Determinar mime type básico por extensión
		const ext = video.path.split('.').pop()?.toLowerCase();
		let mimeType = 'video/mp4';
		if (ext === 'webm') mimeType = 'video/webm';
		if (ext === 'ogg') mimeType = 'video/ogg';
		if (ext === 'mov') mimeType = 'video/quicktime';
		if (ext === 'mkv') mimeType = 'video/x-matroska';

		res.sendFile(video.path, {
			acceptRanges: true,
			headers: {
				'Content-Type': mimeType,
			},
		});
	} catch (error) {
		serverLogger.error('Error serving video content:', error);
		res.status(500).send('Error serving video content');
	}
});

// GET /api/videos/:id/thumbnail - Servir thumbnail de video
router.get('/:id/thumbnail', async (req: Request, res: Response) => {
	try {
		const { id } = req.params as { id: string };
		const timeParam = (req.query.time || req.query.timestamp) as string | undefined;
		const time = timeParam ? Number.parseFloat(timeParam) : 1;

		const video = await getVideoById(id);
		if (!video) {
			res.status(404).send('Video not found');
			return;
		}

		// 1) Preferir columna thumbnail (base64 TEXT) - WebP animado pre-generado
		if (video.thumbnail && typeof video.thumbnail === 'string') {
			try {
				const b64 = video.thumbnail.startsWith('data:') ? video.thumbnail.split(',')[1] : video.thumbnail;
				const buffer = Buffer.from(b64, 'base64');

				const etag = `W/"${buffer.length.toString(16)}-${id}-pregenerated"`;
				const lastModified = new Date(video.updatedAt || Date.now()).toUTCString();

				const ifNoneMatch = req.header('If-None-Match');
				const ifModifiedSince = req.header('If-Modified-Since');
				if (ifNoneMatch === etag || (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
					res.status(304).end();
					return;
				}

				// Detectar MIME type basado en el contenido o usar WebP por defecto
				const mimeType = video.thumbnailMimeType || 'image/webp';

				res.set({
					'Content-Type': mimeType,
					'Content-Length': buffer.length.toString(),
					'Cache-Control': 'public, max-age=31536000, immutable',
					ETag: etag,
					'Last-Modified': lastModified,
				});
				res.send(buffer);
				return;
			} catch {
				// continuar
			}
		}

		// 2) Intentar desde metadata.thumbnail.data (base64)
		if (video.metadata && typeof video.metadata === 'string') {
			try {
				const meta = JSON.parse(video.metadata);
				const metaThumb = meta?.thumbnail?.data as string | undefined;
				if (metaThumb) {
					const buffer = Buffer.from(metaThumb, 'base64');
					const etag = `W/"${buffer.length.toString(16)}-${id}"`;
					const lastModified = new Date(video.updatedAt || Date.now()).toUTCString();

					const ifNoneMatch = req.header('If-None-Match');
					const ifModifiedSince = req.header('If-Modified-Since');
					if (ifNoneMatch === etag || (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
						res.status(304).end();
						return;
					}

					res.set({
						'Content-Type': 'image/jpeg',
						'Content-Length': buffer.length.toString(),
						'Cache-Control': 'public, max-age=31536000, immutable',
						ETag: etag,
						'Last-Modified': lastModified,
					});
					res.send(buffer);
					return;
				}
			} catch {
				// continuar
			}
		}

		// 3) Generar on-the-fly con mediabunny si el archivo existe
		if (!(video.path && existsSync(video.path))) {
			res.status(404).send('Video file not found');
			return;
		}

		try {
			// Intentar con mediabunny para thumbnails animados
			const animatedWebpBuffer = await generateAnimatedVideoThumbnail(video.path, {
				time,
				quality: req.query.quality as string,
				frames: 8,
				duration: 1.5,
			});

			if (animatedWebpBuffer) {
				const etag = `W/"${animatedWebpBuffer.length.toString(16)}-${id}-animated"`;
				const lastModified = new Date().toUTCString();

				res.set({
					'Content-Type': 'image/webp',
					'Content-Length': animatedWebpBuffer.length.toString(),
					'Cache-Control': 'public, max-age=86400',
					ETag: etag,
					'Last-Modified': lastModified,
				});
				res.send(animatedWebpBuffer);
				return;
			}
		} catch (error) {
			serverLogger.warn('Error generating animated thumbnail with mediabunny, falling back to single frame:', error);
		}

		// Fallback: generar thumbnail estático con mediabunny
		try {
			const { generateVideoThumbnail } = await import('@/server/services/media/mediabunny-thumbnail.service');
			const timestamp = Number.isFinite(time) ? Math.max(0.05, Math.min(time as number, 36_000)) : 1;

			const thumbnailBuffer = await generateVideoThumbnail(video.path, timestamp, 320, 240);

			if (thumbnailBuffer) {
				const etag = `W/"${thumbnailBuffer.length.toString(16)}-${id}"`;
				const lastModified = new Date().toUTCString();

				res.set({
					'Content-Type': 'image/jpeg',
					'Content-Length': thumbnailBuffer.length.toString(),
					'Cache-Control': 'public, max-age=86400',
					ETag: etag,
					'Last-Modified': lastModified,
					Vary: 'Accept, Accept-Encoding',
				});
				res.send(thumbnailBuffer);
				return;
			}
		} catch (error) {
			serverLogger.error('Error generating static thumbnail with mediabunny:', error);
		}

		// Fallback final: usar error estándar
		res.status(500).send('Unable to generate thumbnail');
	} catch (error) {
		serverLogger.error('Error al servir thumbnail de video:', error);
		res.status(500).send('Error al servir thumbnail de video');
	}
});

// PUT /api/videos/:id - Actualizar video
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const validatedData = VideoUpdateSchema.parse(req.body);
		const updatedVideo = await updateVideo(id, validatedData);
		res.json(updatedVideo);
	} catch (error) {
		serverLogger.error('Error al actualizar video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/videos/:id - Eliminar video
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const result = await deleteVideo(id);
		if (!result.success) {
			res.status(404).json({ error: 'Video no encontrado' });
			return;
		}
		res.json({
			success: true,
			message: 'Video eliminado correctamente',
			deletedId: id,
		});
	} catch (error) {
		serverLogger.error('Error al eliminar video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/videos/stats/formats - Obtener estadísticas de formatos de video
router.get('/stats/formats', async (_req: Request, res: Response) => {
	try {
		const formatStats = await getVideoFormatStats();
		res.json({
			data: formatStats.map((stat: any) => ({
				format: stat.format,
				count: stat.count,
				totalSize: stat.sumSize || 0,
				avgDuration: stat.avgDuration,
				avgWidth: stat.avgWidth,
				avgHeight: stat.avgHeight,
			})),
		});
	} catch (error) {
		serverLogger.error('Error al obtener estadísticas de formatos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as videosRouter };
