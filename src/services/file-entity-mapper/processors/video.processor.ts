import {
	createVideo as createVideoServer,
	getVideoByHash as getVideoByHashServer,
} from '@/server/services/video.server.service';
import type { VideoCreateInput } from '@/types/entities/video';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

/**
 * Procesador especializado para entidades de tipo VIDEO
 */
export class VideoProcessor {
	/**
	 * Verifica si un video ya existe por hash
	 */
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await getVideoByHashServer(hash);
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad video básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for video creation');
		}

		const videoData: VideoCreateInput = {
			name: fileInfo.name,
			path: fileInfo.path,
			size: fileInfo.size,
			hash: fileInfo.hash,
			folderId: fileInfo.folderId,
			mimeType: getMimeTypeFromExtension(fileInfo.extension),
			duration: 0,
			isFavorite: false,
		};

		const video = await createVideoServer(videoData as any);
		return video.id;
	}

	/**
	 * Extrae metadata de video (duración, resolución, codec, bitrate)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { videoProbeService } = await import('@/services/video/video-probe.service');
			const { db } = await import('@/lib/drizzle');
			const { videos } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			const probe = await videoProbeService.probe(filePath);

			const enhancedMetadata = {
				videoData: {
					duration: probe.duration,
					width: probe.width,
					height: probe.height,
					resolution: probe.width && probe.height ? `${probe.width}x${probe.height}` : null,
					bitRate: probe.bitRate,
					codec: probe.codec,
					format: probe.format,
				},
				raw: probe.raw,
			};

			await db
				.update(videos)
				.set({
					duration: probe.duration ? Math.round(probe.duration * 1000) : 0,
					width: probe.width ?? null,
					height: probe.height ?? null,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(videos.id, entityId));

			return { success: true };
		} catch (e) {
			return { success: false, error: 'Video metadata extraction failed' };
		}
	}

	/**
	 * Genera thumbnail animado WebP de alta calidad para el video
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { generateAnimatedVideoThumbnail } = await import('@/lib/utils/video/helpers');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			const videos = (schema as any).videos;

			if (!videos) {
				return { success: false, error: 'Videos schema not found' };
			}

			const animatedWebpBuffer = await generateAnimatedVideoThumbnail(filePath, {
				time: 5,
				quality: 'high',
				frames: 12,
				duration: 2,
			});

			if (!animatedWebpBuffer || animatedWebpBuffer.length === 0) {
				console.warn('No se pudo generar thumbnail WebP animado para:', filePath);
				return { success: false, error: 'Failed to generate animated thumbnail' };
			}

			const b64 = animatedWebpBuffer.toString('base64');

			let thumbnailWidth: number | null = null;
			let thumbnailHeight: number | null = null;

			try {
				const sharp = await import('sharp');
				const metadata = await sharp.default(animatedWebpBuffer).metadata();
				thumbnailWidth = metadata.width || null;
				thumbnailHeight = metadata.height || null;
			} catch (e) {
				console.warn('No se pudieron obtener dimensiones del thumbnail:', e);
			}

			await db
				.update(videos)
				.set({
					thumbnail: b64,
					thumbnailSize: animatedWebpBuffer.length,
					thumbnailWidth,
					thumbnailHeight,
					thumbnailMimeType: 'image/webp',
					updatedAt: new Date(),
				})
				.where(eq(videos.id, entityId));

			return { success: true };
		} catch (e) {
			console.warn('Error generando thumbnail WebP animado para video:', filePath, e);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}
}
