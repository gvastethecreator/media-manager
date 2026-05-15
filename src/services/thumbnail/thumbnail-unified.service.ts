/**
 * @file Servicio unificado de thumbnails para todas las entidades
 * @module services/thumbnail
 * @description Proporciona generación, recuperación y gestión de thumbnails
 *              para imágenes, videos, audio, documentos, JSON y modelos 3D
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, images, jsonFiles, videos } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateAndSaveWaveform } from '@/lib/utils/audio/waveform-generator';
import { generateStaticVideoThumbnailFFmpeg } from '@/lib/utils/video/ffmpeg-thumbnails';

const logger = serverLogger.withContext('ThumbnailUnified');

/**
 * Tipos de entidades soportadas para thumbnails
 */
export type ThumbnailEntityType = 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';

/**
 * Opciones de generación de thumbnail
 */
export interface ThumbnailOptions {
	force?: boolean;
	height?: number;
	quality?: 'compressed' | 'low' | 'medium' | 'high';
	width?: number;
}

/**
 * Resultado de generación de thumbnail
 */
export interface ThumbnailResult {
	data?: Buffer;
	error?: string;
	generated?: boolean;
	height?: number;
	mimeType?: string;
	success: boolean;
	width?: number;
}

/**
 * Información de thumbnail para una entidad
 */
export interface ThumbnailInfo {
	generatedAt?: Date;
	hasThumbnail: boolean;
	height?: number;
	mimeType?: string;
	url?: string;
	width?: number;
}

export interface ThumbnailMaintenanceOptions extends ThumbnailOptions {
	entityTypes?: ThumbnailEntityType[];
}

interface ThumbnailRequest {
	entityId: string;
	entityType: ThumbnailEntityType;
}

// ===================== CONSTANTES =====================

const DEFAULT_DIMENSIONS: Record<ThumbnailEntityType, { width: number; height: number }> = {
	image: { width: 512, height: 512 },
	video: { width: 320, height: 180 },
	audio: { width: 800, height: 200 },
	document: { width: 212, height: 300 },
	jsonFile: { width: 300, height: 400 },
	file3d: { width: 300, height: 300 },
};

const MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.gif': 'image/gif',
};

const SVG_COLORS = {
	canvas: 'oklch(0.12 0.002 0)',
	canvasRaised: 'oklch(0.18 0.002 0)',
	canvasMuted: 'oklch(0.25 0.002 0)',
	foreground: 'oklch(0.94 0.002 0)',
	muted: 'oklch(0.7 0.002 0)',
	subtle: 'oklch(0.55 0.002 0)',
	accent: 'oklch(0.59 0.2 255)',
	success: 'oklch(0.63 0.17 150)',
	danger: 'oklch(0.58 0.2 25)',
};

const escapeSvgText = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const truncateText = (value: string, maxLength: number): string =>
	value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

// ===================== SERVICIO UNIFICADO =====================

class ThumbnailUnifiedService {
	private static instance: ThumbnailUnifiedService;

	private constructor() {}

	static getInstance(): ThumbnailUnifiedService {
		if (!ThumbnailUnifiedService.instance) {
			ThumbnailUnifiedService.instance = new ThumbnailUnifiedService();
		}
		return ThumbnailUnifiedService.instance;
	}

	// ===================== MÉTODOS PÚBLICOS =====================

	/**
	 * Obtiene o genera un thumbnail para cualquier tipo de entidad
	 */
	async getThumbnail(
		entityType: ThumbnailEntityType,
		entityId: string,
		options: ThumbnailOptions = {}
	): Promise<ThumbnailResult> {
		try {
			logger.debug(`Obteniendo thumbnail: ${entityType}/${entityId}`);

			// Intentar obtener thumbnail existente
			const existing = await this.getExistingThumbnail(entityType, entityId);

			if (existing.success && !options.force) {
				logger.debug(`Thumbnail existente encontrado: ${entityType}/${entityId}`);
				return existing;
			}

			// Generar nuevo thumbnail
			logger.info(`Generando thumbnail: ${entityType}/${entityId}`);
			return await this.generateThumbnail(entityType, entityId, options);
		} catch (error) {
			logger.error(`Error obteniendo thumbnail ${entityType}/${entityId}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Verifica si una entidad tiene thumbnail
	 */
	async hasThumbnail(entityType: ThumbnailEntityType, entityId: string): Promise<boolean> {
		const info = await this.getThumbnailInfo(entityType, entityId);
		return info.hasThumbnail;
	}

	/**
	 * Obtiene información del thumbnail sin generar
	 */
	async getThumbnailInfo(entityType: ThumbnailEntityType, entityId: string): Promise<ThumbnailInfo> {
		try {
			switch (entityType) {
				case 'image': {
					const image = await db.query.images.findFirst({
						where: eq(images.id, entityId),
						columns: {
							thumbnail: true,
							thumbnailWidth: true,
							thumbnailHeight: true,
							thumbnailMimeType: true,
							thumbnailOptimizedAt: true,
						},
					});
					return {
						hasThumbnail: !!image?.thumbnail,
						width: image?.thumbnailWidth || undefined,
						height: image?.thumbnailHeight || undefined,
						mimeType: image?.thumbnailMimeType || 'image/webp',
						url: `/api/thumbnails/unified/image/${entityId}`,
						generatedAt: image?.thumbnailOptimizedAt || undefined,
					};
				}

				case 'video': {
					const video = await db.query.videos.findFirst({
						where: eq(videos.id, entityId),
						columns: {
							thumbnail: true,
							thumbnailWidth: true,
							thumbnailHeight: true,
							thumbnailMimeType: true,
						},
					});
					return {
						hasThumbnail: !!video?.thumbnail,
						width: video?.thumbnailWidth || undefined,
						height: video?.thumbnailHeight || undefined,
						mimeType: video?.thumbnailMimeType || 'image/webp',
						url: `/api/thumbnails/unified/video/${entityId}`,
					};
				}

				case 'audio': {
					const audio = await db.query.audios.findFirst({
						where: eq(audios.id, entityId),
						columns: { metadata: true },
					});
					const metadata = audio?.metadata ? JSON.parse(audio.metadata as string) : null;
					return {
						hasThumbnail: !!metadata?.waveform,
						mimeType: 'image/svg+xml',
						url: `/api/thumbnails/unified/audio/${entityId}`,
					};
				}

				case 'document': {
					const document = await db.query.documents.findFirst({
						where: eq(documents.id, entityId),
						columns: {
							thumbnail: true,
							thumbnailWidth: true,
							thumbnailHeight: true,
							thumbnailMimeType: true,
						},
					});
					return {
						hasThumbnail: !!document?.thumbnail,
						width: document?.thumbnailWidth || DEFAULT_DIMENSIONS.document.width,
						height: document?.thumbnailHeight || DEFAULT_DIMENSIONS.document.height,
						mimeType: document?.thumbnailMimeType || 'image/svg+xml',
						url: `/api/thumbnails/unified/document/${entityId}`,
					};
				}

				case 'jsonFile': {
					const jsonFile = await db.query.jsonFiles.findFirst({
						where: eq(jsonFiles.id, entityId),
						columns: { metadata: true },
					});
					const metadata = jsonFile?.metadata ? JSON.parse(jsonFile.metadata as string) : null;
					return {
						hasThumbnail: !!metadata?.thumbnail,
						mimeType: 'image/svg+xml',
						url: `/api/thumbnails/unified/json/${entityId}`,
					};
				}

				case 'file3d': {
					const file3d = await db.query.file3Ds.findFirst({
						where: eq(file3Ds.id, entityId),
						columns: { metadata: true },
					});
					const metadata = file3d?.metadata ? JSON.parse(file3d.metadata as string) : null;
					return {
						hasThumbnail: !!metadata?.thumbnail,
						mimeType: 'image/svg+xml',
						url: `/api/thumbnails/unified/3d/${entityId}`,
					};
				}

				default:
					return { hasThumbnail: false };
			}
		} catch (error) {
			logger.error(`Error obteniendo info de thumbnail ${entityType}/${entityId}:`, error);
			return { hasThumbnail: false };
		}
	}

	/**
	 * Genera thumbnails para múltiples entidades en batch
	 */
	async generateBatch(
		requests: Array<{ entityType: ThumbnailEntityType; entityId: string }>,
		options: ThumbnailOptions = {}
	): Promise<Record<string, ThumbnailResult>> {
		const results: Record<string, ThumbnailResult> = {};

		// Procesar en lotes de 5 para no saturar
		const batchSize = 5;
		for (let i = 0; i < requests.length; i += batchSize) {
			const batch = requests.slice(i, i + batchSize);
			const batchPromises = batch.map(async ({ entityType, entityId }) => {
				const key = `${entityType}:${entityId}`;
				results[key] = await this.getThumbnail(entityType, entityId, options);
			});
			await Promise.all(batchPromises);
		}

		return results;
	}

	// ===================== MÉTODOS LEGACY (Compatibilidad) =====================

	/**
	 * Optimiza thumbnails existentes regenerándolos con el pipeline actual.
	 */
	async optimizeThumbnails(options: ThumbnailMaintenanceOptions = {}): Promise<{
		failed: number;
		optimized: number;
		success: boolean;
	}> {
		const { entityTypes, ...thumbnailOptions } = options;
		const requests = await this.getThumbnailMaintenanceRequests(entityTypes, true);
		const results = await this.generateBatch(requests, { ...thumbnailOptions, force: true });
		const totals = this.countBatchResults(results);
		logger.info(`Optimización de thumbnails completada: ${totals.successful}/${requests.length}`);
		return { success: totals.failed === 0, optimized: totals.successful, failed: totals.failed };
	}

	/**
	 * Reprocesa todos los thumbnails soportados.
	 */
	async reprocessAll(options: ThumbnailMaintenanceOptions = {}): Promise<{
		failed: number;
		processed: number;
		success: boolean;
	}> {
		const { entityTypes, ...thumbnailOptions } = options;
		const requests = await this.getThumbnailMaintenanceRequests(entityTypes, false);
		const results = await this.generateBatch(requests, { ...thumbnailOptions, force: true });
		const totals = this.countBatchResults(results);
		logger.info(`Reprocesamiento de thumbnails completado: ${totals.successful}/${requests.length}`);
		return { success: totals.failed === 0, processed: totals.successful, failed: totals.failed };
	}

	/**
	 * Limpia thumbnails huérfanos (Legacy)
	 */
	async cleanThumbnails(options: ThumbnailMaintenanceOptions = {}): Promise<{ cleaned: number; success: boolean }> {
		const requests = await this.getThumbnailMaintenanceRequests(options.entityTypes, true);
		logger.info(`Limpieza de thumbnails validó ${requests.length} thumbnails persistidos`);
		return { success: true, cleaned: 0 };
	}

	// ===================== MÉTODOS PRIVADOS =====================

	/**
	 * Obtiene thumbnail existente de la base de datos
	 */
	private async getExistingThumbnail(entityType: ThumbnailEntityType, entityId: string): Promise<ThumbnailResult> {
		switch (entityType) {
			case 'image': {
				const image = await db.query.images.findFirst({
					where: eq(images.id, entityId),
					columns: {
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailMimeType: true,
					},
				});

				if (image?.thumbnail) {
					return {
						success: true,
						data: Buffer.from(image.thumbnail, 'base64'),
						mimeType: image.thumbnailMimeType || 'image/webp',
						width: image.thumbnailWidth || DEFAULT_DIMENSIONS.image.width,
						height: image.thumbnailHeight || DEFAULT_DIMENSIONS.image.height,
					};
				}
				return { success: false };
			}

			case 'video': {
				const video = await db.query.videos.findFirst({
					where: eq(videos.id, entityId),
					columns: {
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailMimeType: true,
					},
				});

				if (video?.thumbnail) {
					return {
						success: true,
						data: Buffer.from(video.thumbnail, 'base64'),
						mimeType: video.thumbnailMimeType || 'image/webp',
						width: video.thumbnailWidth || DEFAULT_DIMENSIONS.video.width,
						height: video.thumbnailHeight || DEFAULT_DIMENSIONS.video.height,
					};
				}
				return { success: false };
			}

			case 'audio': {
				const audio = await db.query.audios.findFirst({
					where: eq(audios.id, entityId),
					columns: { metadata: true },
				});

				if (audio?.metadata) {
					const metadata = JSON.parse(audio.metadata as string);
					if (metadata?.waveform?.data) {
						return {
							success: true,
							data: Buffer.from(metadata.waveform.data, 'base64'),
							mimeType: 'image/svg+xml',
							width: metadata.waveform.width || DEFAULT_DIMENSIONS.audio.width,
							height: metadata.waveform.height || DEFAULT_DIMENSIONS.audio.height,
						};
					}
				}
				return { success: false };
			}

			case 'document': {
				const document = await db.query.documents.findFirst({
					where: eq(documents.id, entityId),
					columns: {
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailMimeType: true,
					},
				});

				if (document?.thumbnail) {
					return {
						success: true,
						data: Buffer.from(document.thumbnail, 'base64'),
						mimeType: document.thumbnailMimeType || 'image/svg+xml',
						width: document.thumbnailWidth || DEFAULT_DIMENSIONS.document.width,
						height: document.thumbnailHeight || DEFAULT_DIMENSIONS.document.height,
					};
				}
				return { success: false };
			}

			case 'jsonFile': {
				const record = await db.query.jsonFiles.findFirst({
					where: eq(jsonFiles.id, entityId),
					columns: { metadata: true },
				});

				if (record?.metadata) {
					const metadata = JSON.parse(record.metadata as string);
					// El processor guarda en metadata.thumbnail.data como base64
					if (metadata?.thumbnail?.data) {
						return {
							success: true,
							data: Buffer.from(metadata.thumbnail.data, 'base64'),
							mimeType: 'image/svg+xml',
							width: metadata.thumbnail.width || DEFAULT_DIMENSIONS.jsonFile.width,
							height: metadata.thumbnail.height || DEFAULT_DIMENSIONS.jsonFile.height,
						};
					}
				}
				return { success: false };
			}

			case 'file3d': {
				const record = await db.query.file3Ds.findFirst({
					where: eq(file3Ds.id, entityId),
					columns: { metadata: true },
				});

				if (record?.metadata) {
					const metadata = JSON.parse(record.metadata as string);
					// El processor guarda en metadata.thumbnail.data como base64
					if (metadata?.thumbnail?.data) {
						return {
							success: true,
							data: Buffer.from(metadata.thumbnail.data, 'base64'),
							mimeType: 'image/svg+xml',
							width: metadata.thumbnail.width || DEFAULT_DIMENSIONS.file3d.width,
							height: metadata.thumbnail.height || DEFAULT_DIMENSIONS.file3d.height,
						};
					}
				}
				return { success: false };
			}

			default:
				return { success: false };
		}
	}

	private countBatchResults(results: Record<string, ThumbnailResult>): { failed: number; successful: number } {
		let successful = 0;
		let failed = 0;

		for (const result of Object.values(results)) {
			if (result.success) {
				successful++;
			} else {
				failed++;
			}
		}

		return { successful, failed };
	}

	private getRequestedEntityTypes(entityTypes?: ThumbnailEntityType[]): ThumbnailEntityType[] {
		if (entityTypes?.length) {
			return entityTypes;
		}

		return ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'];
	}

	private async getThumbnailMaintenanceRequests(
		entityTypes?: ThumbnailEntityType[],
		onlyExisting = false
	): Promise<ThumbnailRequest[]> {
		const requests: ThumbnailRequest[] = [];
		const requestedEntityTypes = this.getRequestedEntityTypes(entityTypes);

		if (requestedEntityTypes.includes('image')) {
			const rows: Array<{ id: string }> = onlyExisting
				? await db.select({ id: images.id }).from(images).where(isNotNull(images.thumbnail))
				: await db.select({ id: images.id }).from(images);
			requests.push(...rows.map((row) => ({ entityType: 'image' as const, entityId: row.id })));
		}

		if (requestedEntityTypes.includes('video')) {
			const rows: Array<{ id: string }> = onlyExisting
				? await db.select({ id: videos.id }).from(videos).where(isNotNull(videos.thumbnail))
				: await db.select({ id: videos.id }).from(videos);
			requests.push(...rows.map((row) => ({ entityType: 'video' as const, entityId: row.id })));
		}

		if (requestedEntityTypes.includes('document')) {
			const rows: Array<{ id: string }> = onlyExisting
				? await db.select({ id: documents.id }).from(documents).where(isNotNull(documents.thumbnail))
				: await db.select({ id: documents.id }).from(documents);
			requests.push(...rows.map((row) => ({ entityType: 'document' as const, entityId: row.id })));
		}

		if (requestedEntityTypes.includes('audio')) {
			const rows = await db.select({ id: audios.id, metadata: audios.metadata }).from(audios);
			for (const row of rows) {
				if (!onlyExisting || this.hasMetadataPreview(row.metadata, 'waveform')) {
					requests.push({ entityType: 'audio', entityId: row.id });
				}
			}
		}

		if (requestedEntityTypes.includes('jsonFile')) {
			const rows = await db.select({ id: jsonFiles.id, metadata: jsonFiles.metadata }).from(jsonFiles);
			for (const row of rows) {
				if (!onlyExisting || this.hasMetadataPreview(row.metadata, 'thumbnail')) {
					requests.push({ entityType: 'jsonFile', entityId: row.id });
				}
			}
		}

		if (requestedEntityTypes.includes('file3d')) {
			const rows = await db.select({ id: file3Ds.id, metadata: file3Ds.metadata }).from(file3Ds);
			for (const row of rows) {
				if (!onlyExisting || this.hasMetadataPreview(row.metadata, 'thumbnail')) {
					requests.push({ entityType: 'file3d', entityId: row.id });
				}
			}
		}

		return requests;
	}

	private hasMetadataPreview(metadata: unknown, key: 'thumbnail' | 'waveform'): boolean {
		if (!metadata) {
			return false;
		}

		try {
			const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
			return Boolean((parsed as Record<string, unknown>)[key]);
		} catch {
			return false;
		}
	}

	/**
	 * Genera un nuevo thumbnail según el tipo de entidad
	 */
	private async generateThumbnail(
		entityType: ThumbnailEntityType,
		entityId: string,
		options: ThumbnailOptions
	): Promise<ThumbnailResult> {
		switch (entityType) {
			case 'image':
				return this.generateImageThumbnail(entityId, options);
			case 'video':
				return this.generateVideoThumbnail(entityId, options);
			case 'audio':
				return this.generateAudioThumbnail(entityId, options);
			case 'document':
				return this.generateDocumentThumbnail(entityId, options);
			case 'jsonFile':
				return this.generateJsonThumbnail(entityId, options);
			case 'file3d':
				return this.generate3DThumbnail(entityId, options);
			default:
				return { success: false, error: `Unsupported entity type: ${entityType}` };
		}
	}

	/**
	 * Genera thumbnail para imagen
	 */
	private async generateImageThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const { thumbnailService } = await import('@/services/image/image-thumbnail.service');
			await thumbnailService.generateThumbnail(entityId);

			// Obtener el thumbnail generado
			const image = await db.query.images.findFirst({
				where: eq(images.id, entityId),
				columns: {
					thumbnail: true,
					thumbnailWidth: true,
					thumbnailHeight: true,
					thumbnailMimeType: true,
				},
			});

			if (image?.thumbnail) {
				return {
					success: true,
					data: Buffer.from(image.thumbnail, 'base64'),
					mimeType: image.thumbnailMimeType || 'image/webp',
					width: image.thumbnailWidth || DEFAULT_DIMENSIONS.image.width,
					height: image.thumbnailHeight || DEFAULT_DIMENSIONS.image.height,
					generated: true,
				};
			}

			return { success: false, error: 'Failed to generate image thumbnail' };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Image thumbnail generation failed',
			};
		}
	}

	/**
	 * Genera thumbnail para video usando FFmpeg
	 */
	private async generateVideoThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const video = await db.query.videos.findFirst({
				where: eq(videos.id, entityId),
				columns: { path: true },
			});

			if (!(video?.path && existsSync(video.path))) {
				return { success: false, error: 'Video file not found' };
			}

			const dims = DEFAULT_DIMENSIONS.video;
			const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
				quality: options.quality || 'medium',
				width: options.width || dims.width,
				height: options.height || dims.height,
				time: 2,
			});

			if (!thumbnailBuffer) {
				return { success: false, error: 'FFmpeg thumbnail generation failed' };
			}

			// Guardar en DB
			await db
				.update(videos)
				.set({
					thumbnail: thumbnailBuffer.toString('base64'),
					thumbnailSize: thumbnailBuffer.length,
					thumbnailWidth: dims.width,
					thumbnailHeight: dims.height,
					thumbnailMimeType: 'image/webp',
					updatedAt: new Date(),
				})
				.where(eq(videos.id, entityId));

			return {
				success: true,
				data: thumbnailBuffer,
				mimeType: 'image/webp',
				width: dims.width,
				height: dims.height,
				generated: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Video thumbnail generation failed',
			};
		}
	}

	/**
	 * Genera thumbnail (waveform) para audio
	 */
	private async generateAudioThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const audio = await db.query.audios.findFirst({
				where: eq(audios.id, entityId),
				columns: { path: true, name: true },
			});

			if (!(audio?.path && existsSync(audio.path))) {
				return { success: false, error: 'Audio file not found' };
			}

			// Generar waveform
			await generateAndSaveWaveform(audio.path, entityId, {
				width: options.width || DEFAULT_DIMENSIONS.audio.width,
				height: options.height || DEFAULT_DIMENSIONS.audio.height,
				waveColor: 'oklch(0.59 0.2 255)',
				backgroundColor: 'oklch(0.18 0.002 0)',
				samples: 200,
			});

			// Obtener el waveform generado
			const updated = await db.query.audios.findFirst({
				where: eq(audios.id, entityId),
				columns: { metadata: true },
			});

			if (updated?.metadata) {
				const metadata = JSON.parse(updated.metadata as string);
				if (metadata?.waveform?.data) {
					return {
						success: true,
						data: Buffer.from(metadata.waveform.data, 'base64'),
						mimeType: 'image/svg+xml',
						width: metadata.waveform.width || DEFAULT_DIMENSIONS.audio.width,
						height: metadata.waveform.height || DEFAULT_DIMENSIONS.audio.height,
						generated: true,
					};
				}
			}

			return { success: false, error: 'Failed to generate audio waveform' };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Audio waveform generation failed',
			};
		}
	}

	/**
	 * Genera thumbnail para documento
	 */
	private async generateDocumentThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const document = await db.query.documents.findFirst({
				where: eq(documents.id, entityId),
				columns: { path: true, name: true, pageCount: true, wordCount: true },
			});

			if (!document) {
				return { success: false, error: 'Document not found' };
			}

			// Generar SVG placeholder
			const svg = this.createDocumentSVG(document.name, document.pageCount, document.wordCount);
			const svgBase64 = Buffer.from(svg).toString('base64');

			// Guardar en tabla documents
			await db
				.update(documents)
				.set({
					thumbnail: svgBase64,
					thumbnailSize: svgBase64.length,
					thumbnailWidth: DEFAULT_DIMENSIONS.document.width,
					thumbnailHeight: DEFAULT_DIMENSIONS.document.height,
					thumbnailMimeType: 'image/svg+xml',
					updatedAt: new Date(),
				})
				.where(eq(documents.id, entityId));

			return {
				success: true,
				data: Buffer.from(svg),
				mimeType: 'image/svg+xml',
				width: DEFAULT_DIMENSIONS.document.width,
				height: DEFAULT_DIMENSIONS.document.height,
				generated: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Document thumbnail generation failed',
			};
		}
	}

	/**
	 * Genera thumbnail para archivo JSON
	 */
	private async generateJsonThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const jsonFile = await db.query.jsonFiles.findFirst({
				where: eq(jsonFiles.id, entityId),
				columns: { path: true, name: true },
			});

			if (!(jsonFile?.path && existsSync(jsonFile.path))) {
				return { success: false, error: 'JSON file not found' };
			}

			// Leer contenido
			const content = await readFile(jsonFile.path, 'utf-8');
			const svg = this.createJsonPreviewSVG(content, jsonFile.name);

			// Guardar en metadata
			const existing = await db.query.jsonFiles.findFirst({
				where: eq(jsonFiles.id, entityId),
				columns: { metadata: true },
			});

			const existingMetadata = existing?.metadata ? JSON.parse(existing.metadata as string) : {};

			await db
				.update(jsonFiles)
				.set({
					metadata: JSON.stringify({
						...existingMetadata,
						thumbnail: {
							data: Buffer.from(svg).toString('base64'),
							width: DEFAULT_DIMENSIONS.jsonFile.width,
							height: DEFAULT_DIMENSIONS.jsonFile.height,
							format: 'svg',
							isPlaceholder: true,
							generatedAt: new Date().toISOString(),
						},
					}),
					updatedAt: new Date(),
				})
				.where(eq(jsonFiles.id, entityId));

			return {
				success: true,
				data: Buffer.from(svg),
				mimeType: 'image/svg+xml',
				width: DEFAULT_DIMENSIONS.jsonFile.width,
				height: DEFAULT_DIMENSIONS.jsonFile.height,
				generated: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'JSON thumbnail generation failed',
			};
		}
	}

	/**
	 * Genera thumbnail para modelo 3D
	 */
	private async generate3DThumbnail(entityId: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		try {
			const file3d = await db.query.file3Ds.findFirst({
				where: eq(file3Ds.id, entityId),
				columns: { name: true, vertices: true, faces: true, materials: true },
			});

			if (!file3d) {
				return { success: false, error: '3D model not found' };
			}

			const svg = this.create3DModelSVG(file3d.name, file3d.vertices, file3d.faces, file3d.materials);

			// Guardar en metadata
			const existing = await db.query.file3Ds.findFirst({
				where: eq(file3Ds.id, entityId),
				columns: { metadata: true },
			});

			const existingMetadata = existing?.metadata ? JSON.parse(existing.metadata as string) : {};

			await db
				.update(file3Ds)
				.set({
					metadata: JSON.stringify({
						...existingMetadata,
						thumbnail: {
							data: Buffer.from(svg).toString('base64'),
							width: DEFAULT_DIMENSIONS.file3d.width,
							height: DEFAULT_DIMENSIONS.file3d.height,
							format: 'svg',
							isPlaceholder: true,
							generatedAt: new Date().toISOString(),
						},
					}),
					updatedAt: new Date(),
				})
				.where(eq(file3Ds.id, entityId));

			return {
				success: true,
				data: Buffer.from(svg),
				mimeType: 'image/svg+xml',
				width: DEFAULT_DIMENSIONS.file3d.width,
				height: DEFAULT_DIMENSIONS.file3d.height,
				generated: true,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : '3D thumbnail generation failed',
			};
		}
	}

	// ===================== SVG GENERATORS =====================

	private createDocumentSVG(fileName: string, pageCount: number | null, wordCount: number | null): string {
		const pageInfo = pageCount && pageCount > 0 ? `${pageCount} páginas` : 'Documento';
		const wordInfo = wordCount && wordCount > 0 ? `${wordCount.toLocaleString()} palabras` : '';
		const safeFileName = escapeSvgText(truncateText(fileName, 30));

		return `
<svg width="212" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="doc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${SVG_COLORS.canvasRaised};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${SVG_COLORS.canvas};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="212" height="300" fill="url(#doc-bg)" rx="8"/>
  
  <text x="106" y="100" font-family="Arial" font-size="64" fill="${SVG_COLORS.subtle}" text-anchor="middle">📄</text>
  
  <text x="106" y="145" font-family="Arial" font-size="12" fill="${SVG_COLORS.muted}" text-anchor="middle" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;">
    ${safeFileName}
  </text>
  
  <text x="106" y="170" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtle}" text-anchor="middle">
    ${escapeSvgText(pageInfo)}
  </text>
  
  ${wordInfo ? `<text x="106" y="185" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtle}" text-anchor="middle">${escapeSvgText(wordInfo)}</text>` : ''}
  
  <rect x="50" y="260" width="112" height="20" rx="10" fill="${SVG_COLORS.canvasMuted}"/>
  <text x="106" y="274" font-family="Arial" font-size="10" fill="${SVG_COLORS.muted}" text-anchor="middle">Document</text>
</svg>`;
	}

	private createJsonPreviewSVG(content: string, fileName: string): string {
		let previewContent = '';
		try {
			const parsed = JSON.parse(content);
			const keys = Object.keys(parsed).slice(0, 5);
			previewContent = keys
				.map(
					(key, index) =>
						`<tspan x="20" dy="15" fill="${index % 2 === 0 ? SVG_COLORS.accent : SVG_COLORS.success}">"${escapeSvgText(key)}": ...</tspan>`
				)
				.join('');
		} catch {
			previewContent = `<tspan x="20" dy="15" fill="${SVG_COLORS.danger}">Invalid JSON</tspan>`;
		}
		const safeFileName = escapeSvgText(truncateText(fileName, 35));

		return `
<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="400" fill="${SVG_COLORS.canvas}" rx="8"/>
  <text x="150" y="30" font-family="Arial" font-size="16" fill="${SVG_COLORS.foreground}" text-anchor="middle" font-weight="bold">JSON</text>
  <text x="150" y="55" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtle}" text-anchor="middle">${safeFileName}</text>
  <g transform="translate(0, 80)">
    <text font-family="monospace" font-size="11" fill="${SVG_COLORS.foreground}">${previewContent}</text>
  </g>
  <text x="150" y="380" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtle}" text-anchor="middle">{ ... }</text>
</svg>`;
	}

	private create3DModelSVG(
		fileName: string,
		vertices: number | null,
		faces: number | null,
		materials: number | null
	): string {
		const vertInfo = vertices ? `${vertices.toLocaleString()} verts` : '';
		const faceInfo = faces ? `${faces.toLocaleString()} faces` : '';
		const matInfo = materials ? `${materials} mats` : '';
		const safeFileName = escapeSvgText(truncateText(fileName, 25));
		const statsText = escapeSvgText(`${vertInfo} ${faceInfo} ${matInfo}`.trim());

		return `
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="${SVG_COLORS.canvas}" rx="8"/>
  
  <g transform="translate(150, 120)">
    <g stroke="${SVG_COLORS.accent}" stroke-width="2" fill="none">
      <rect x="-40" y="-40" width="80" height="80"/>
      <rect x="-25" y="-25" width="80" height="80"/>
      <line x1="-40" y1="-40" x2="-25" y2="-25"/>
      <line x1="40" y1="-40" x2="55" y2="-25"/>
      <line x1="40" y1="40" x2="55" y2="55"/>
      <line x1="-40" y1="40" x2="-25" y2="55"/>
    </g>
  </g>
  
  <text x="150" y="200" font-family="Arial" font-size="12" fill="${SVG_COLORS.muted}" text-anchor="middle">
    ${safeFileName}
  </text>
  
  <text x="150" y="225" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtle}" text-anchor="middle">
    ${statsText}
  </text>
  
  <rect x="100" y="260" width="100" height="20" rx="10" fill="${SVG_COLORS.canvasMuted}"/>
  <text x="150" y="274" font-family="Arial" font-size="10" fill="${SVG_COLORS.muted}" text-anchor="middle">3D Model</text>
</svg>`;
	}
}

// Exportar instancia singleton
export const thumbnailUnifiedService = ThumbnailUnifiedService.getInstance();

// Exportar tipos
export { ThumbnailUnifiedService };
