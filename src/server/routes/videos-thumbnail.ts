import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '@/lib/drizzle/index';
import { videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateStaticVideoThumbnailFFmpeg } from '@/lib/utils/video/ffmpeg-thumbnails';

const router = Router();
const logger = serverLogger.withContext('VideoThumbnailRoute');

// GET /api/videos/:id/thumbnail - Servir thumbnail de video (On-Demand)
router.get('/:id/thumbnail', async (req, res) => {
	try {
		const { id } = req.params;
		const { quality = 'medium', force = 'false' } = req.query;

		// 1. Buscar video en DB
		const video = await db.query.videos.findFirst({
			where: eq(videos.id, id),
			columns: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailMimeType: true,
			},
		});

		if (!video) {
			res.status(404).json({ error: 'Video not found' });
			return;
		}

		// 2. Si ya tiene thumbnail y no forzamos regeneración, servirlo
		if (video.thumbnail && force !== 'true') {
			const imgBuffer = Buffer.from(video.thumbnail, 'base64');
			res.writeHead(200, {
				'Content-Type': video.thumbnailMimeType || 'image/webp',
				'Content-Length': imgBuffer.length,
				'Cache-Control': 'public, max-age=31536000', // 1 año cache
			});
			res.end(imgBuffer);
			return;
		}

		// 3. Si no tiene, generar uno nuevo
		if (!(video.path && existsSync(video.path))) {
			logger.error(`❌ Video file not found: ${video.path}`);
			res.status(404).json({ error: 'Video file missing on disk' });
			return;
		}

		logger.info(`🎬 Generating thumbnail for video: ${id}`);
		const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
			quality: quality as string,
			width: 320,
			height: 240,
			time: 2, // Capture at 2s (often better than 0/1s)
		});

		if (!thumbnailBuffer) {
			logger.error('❌ Failed to generate thumbnail');
			res.status(500).json({ error: 'Thumbnail generation failed' });
			return;
		}

		// 4. Guardar en DB
		const base64Thumb = thumbnailBuffer.toString('base64');
		await db
			.update(videos)
			.set({
				thumbnail: base64Thumb,
				thumbnailSize: thumbnailBuffer.length,
				thumbnailWidth: 320,
				thumbnailHeight: 240,
				thumbnailMimeType: 'image/webp',
				updatedAt: new Date(),
			})
			.where(eq(videos.id, id));

		logger.info(`✅ Thumbnail generated and saved for video: ${id}`);

		// 5. Servir
		res.writeHead(200, {
			'Content-Type': 'image/webp',
			'Content-Length': thumbnailBuffer.length,
			'Cache-Control': 'public, max-age=31536000',
		});
		res.end(thumbnailBuffer);
	} catch (error) {
		logger.error('Error serving video thumbnail:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

export { router as videosThumbnailRouter };
export default router;
