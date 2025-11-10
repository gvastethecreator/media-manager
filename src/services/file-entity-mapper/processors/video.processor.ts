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
	 * Genera thumbnail para el video con estrategia de fallback:
	 * 1. Intentar thumbnail animado WebP (mediabunny primero, luego FFmpeg)
	 * 2. Si falla: thumbnail estático JPEG
	 * 3. Si falla: placeholder SVG con info del video
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const startTime = Date.now();
		const { basename } = await import('node:path');
		const fileName = basename(filePath);
		
		console.log(`🎬 [VideoProcessor] Iniciando generación de thumbnail: ${fileName}`);

		const { db } = await import('@/lib/drizzle');
		const schema = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');
		const videos = (schema as any).videos;

		if (!videos) {
			return { success: false, error: 'Videos schema not found' };
		}

		// Estrategia 1: Thumbnail animado WebP
		try {
			const result = await this.tryAnimatedThumbnail(filePath, entityId, videos, eq, db);
			if (result.success) {
				const duration = Date.now() - startTime;
				console.log(`✅ [VideoProcessor] Thumbnail animado generado en ${duration}ms: ${fileName}`);
				return result;
			}
			console.warn(`⚠️ [VideoProcessor] Thumbnail animado falló, intentando estático: ${result.error}`);
		} catch (e) {
			console.warn(`⚠️ [VideoProcessor] Error en thumbnail animado:`, e);
		}

		// Estrategia 2: Thumbnail estático JPEG
		try {
			const result = await this.tryStaticThumbnail(filePath, entityId, videos, eq, db);
			if (result.success) {
				const duration = Date.now() - startTime;
				console.log(`✅ [VideoProcessor] Thumbnail estático generado en ${duration}ms: ${fileName}`);
				return result;
			}
			console.warn(`⚠️ [VideoProcessor] Thumbnail estático falló: ${result.error}`);
		} catch (e) {
			console.warn(`⚠️ [VideoProcessor] Error en thumbnail estático:`, e);
		}

		// Estrategia 3: Placeholder SVG
		try {
			const result = await this.createPlaceholderThumbnail(filePath, entityId, videos, eq, db);
			const duration = Date.now() - startTime;
			console.log(`⚠️ [VideoProcessor] Usando placeholder en ${duration}ms: ${fileName}`);
			return result;
		} catch (e) {
			const duration = Date.now() - startTime;
			console.error(`❌ [VideoProcessor] Todas las estrategias fallaron en ${duration}ms:`, e);
			return { success: false, error: 'All thumbnail generation strategies failed' };
		}
	}

	/**
	 * Intenta generar thumbnail animado WebP con timeout
	 */
	private async tryAnimatedThumbnail(
		filePath: string,
		entityId: string,
		videos: any,
		eq: any,
		db: any
	): Promise<{ success: boolean; error?: string }> {
		const TIMEOUT_MS = 30000; // 30 segundos
		
		const generationPromise = (async () => {
			const { generateAnimatedVideoThumbnail } = await import('@/lib/utils/video/thumbnail-helpers.server');

			const animatedWebpBuffer = await generateAnimatedVideoThumbnail(filePath, {
				time: 5,
				quality: 'high',
				frames: 12,
				duration: 2,
			});

			if (!animatedWebpBuffer || animatedWebpBuffer.length === 0) {
				throw new Error('Buffer vacío o nulo');
			}

			// Validar que el buffer sea un WebP válido
			const header = animatedWebpBuffer.slice(0, 4).toString('ascii');
			if (header !== 'RIFF') {
				throw new Error('Buffer no es un WebP válido');
			}

			return animatedWebpBuffer;
		})();

		// Timeout wrapper
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Timeout: generación excedió 30s')), TIMEOUT_MS);
		});

		const animatedWebpBuffer = await Promise.race([generationPromise, timeoutPromise]);

		// Extraer dimensiones
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

		// Guardar en BD
		const b64 = animatedWebpBuffer.toString('base64');
		await db
			.update(videos)
			.set({
				thumbnail: b64,
				thumbnailSize: animatedWebpBuffer.length,
				thumbnailWidth,
				thumbnailHeight,
				thumbnailMimeType: 'image/webp',
				thumbnailError: null,
				thumbnailErrorAt: null,
				updatedAt: new Date(),
			})
			.where(eq(videos.id, entityId));

		return { success: true };
	}

	/**
	 * Intenta generar thumbnail estático JPEG usando FFmpeg o mediabunny
	 */
	private async tryStaticThumbnail(
		filePath: string,
		entityId: string,
		videos: any,
		eq: any,
		db: any
	): Promise<{ success: boolean; error?: string }> {
		const { generateStaticVideoThumbnail } = await import('@/lib/utils/video/thumbnail-helpers.server');

		const staticBuffer = await generateStaticVideoThumbnail(filePath, {
			time: 5,
			quality: 'medium',
			width: 320,
			height: 180,
		});

		if (!staticBuffer || staticBuffer.length === 0) {
			throw new Error('No se pudo generar thumbnail estático');
		}

		// Extraer dimensiones
		let thumbnailWidth: number | null = null;
		let thumbnailHeight: number | null = null;
		try {
			const sharp = await import('sharp');
			const metadata = await sharp.default(staticBuffer).metadata();
			thumbnailWidth = metadata.width || null;
			thumbnailHeight = metadata.height || null;
		} catch (e) {
			console.warn('No se pudieron obtener dimensiones del thumbnail estático:', e);
		}

		// Guardar en BD
		const b64 = staticBuffer.toString('base64');
		await db
			.update(videos)
			.set({
				thumbnail: b64,
				thumbnailSize: staticBuffer.length,
				thumbnailWidth,
				thumbnailHeight,
				thumbnailMimeType: 'image/jpeg',
				thumbnailError: null,
				thumbnailErrorAt: null,
				updatedAt: new Date(),
			})
			.where(eq(videos.id, entityId));

		return { success: true };
	}

	/**
	 * Crea un placeholder SVG con información del video
	 */
	private async createPlaceholderThumbnail(
		filePath: string,
		entityId: string,
		videos: any,
		eq: any,
		db: any
	): Promise<{ success: boolean; error?: string }> {
		const { basename } = await import('node:path');
		const fileName = basename(filePath);

		// Obtener metadata del video para mostrar en placeholder
		const video = await db.query.videos.findFirst({
			where: eq(videos.id, entityId),
		});

		const duration = video?.duration ? Math.round(video.duration / 1000) : 0;
		const resolution = video?.width && video?.height ? `${video.width}x${video.height}` : 'Unknown';

		// Generar SVG placeholder
		const svg = `
			<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
				<rect width="320" height="180" fill="#1f2937"/>
				<text x="160" y="70" font-family="Arial" font-size="48" fill="#6b7280" text-anchor="middle">🎬</text>
				<text x="160" y="110" font-family="Arial" font-size="12" fill="#9ca3af" text-anchor="middle">${fileName}</text>
				<text x="160" y="130" font-family="Arial" font-size="10" fill="#6b7280" text-anchor="middle">${resolution}</text>
				<text x="160" y="145" font-family="Arial" font-size="10" fill="#6b7280" text-anchor="middle">${duration}s</text>
			</svg>
		`;

		const svgBuffer = Buffer.from(svg.trim());
		const b64 = svgBuffer.toString('base64');

		// Guardar en BD con marcador de error
		await db
			.update(videos)
			.set({
				thumbnail: b64,
				thumbnailSize: svgBuffer.length,
				thumbnailWidth: 320,
				thumbnailHeight: 180,
				thumbnailMimeType: 'image/svg+xml',
				thumbnailError: 'Generated using placeholder due to processing failure',
				thumbnailErrorAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(videos.id, entityId));

		return { success: true, error: 'Using placeholder due to generation failure' };
	}
}
