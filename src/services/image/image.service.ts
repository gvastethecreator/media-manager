/**
 * @file Servicio de Image
 * @module services/image
 * @description Implementación del servicio de imágenes
 *
 * # Arquitectura del Servicio de Imágenes
 *
 * Este servicio implementa un enfoque de clase singleton para gestionar imágenes,
 * incluyendo procesamiento, generación de miniaturas y manejo de metadatos.
 *
 * ## Estructura Principal
 *
 * ```
 * ├── Estado interno y constantes
 * ├── Funciones auxiliares internas
 * │   ├── emitEvent - Sistema de eventos
 * │   ├── ensureCacheDir - Gestión de caché
 * │   ├── processImage - Procesamiento de imágenes
 * │   └── getCacheKey - Generación de claves de caché
 * ├── Funciones públicas expuestas
 * │   ├── createImage, getImages, updateImage...
 * │   └── generateThumbnail, getThumbnail...
 * └── Exportación del servicio como singleton
 * ```
 *
 * ## Sistema de Eventos
 *
 * El servicio implementa un sistema de eventos que se integra
 * con el sistema de eventos central de la aplicación. Los eventos incluyen:
 *
 * - IMAGE_CREATED cuando se crea una nueva imagen
 * - IMAGE_UPDATED cuando se actualiza una imagen
 * - IMAGE_DELETED cuando se elimina una imagen
 * - THUMBNAIL_GENERATED cuando se genera una nueva miniatura
 * - ERROR cuando ocurre un error en cualquier operación
 *
 * ## Procesamiento de Imágenes
 *
 * El servicio utiliza Sharp para el procesamiento eficiente de imágenes,
 * permitiendo redimensionar, cambiar formato y optimizar imágenes.
 */
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import sharp from 'sharp';

import { extractMetadata } from '@/app/actions/metadata';
import { thumbnailCache } from '@/lib/cache';
import { imageConfig } from '@/lib/config';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import { transformImageToExtended } from '@/transformers/image';
import type { ImageExtended } from '@/types/entities/image/types';
import { ThumbnailQuality } from '@/types/thumbnails';
import {
	ServiceErrorCode,
	createEntityNotFoundError,
	createFileNotFoundError,
	createServiceError,
	toServiceError,
} from '@/utils/errors/service-errors';
import { statsService } from '../stats.service';

const SERVICE_NAME = 'ImageService';
const imageLogger = serverLogger.withContext(SERVICE_NAME);

export type { ThumbnailQuality };
export const THUMBNAIL_QUALITY_CONFIG = imageConfig.thumbnail.qualities;

export type CreateImageInput = {
	name: string;
	path: string;
	size: number;
	width: number;
	height: number;
	hash: string;
	folderId: string;
	metadata?: Record<string, string | number | boolean | string[] | null | undefined>;
	isPublic?: boolean;
};

export type ImageProcessingOptions = {
	quality?: number;
	width?: number;
	height?: number;
	format?: 'webp' | 'jpeg' | 'png';
	fit?: 'cover' | 'contain' | 'inside' | 'outside';
	type?: string;
};

// Definir los eventos de imágenes
export const IMAGE_EVENTS = {
	IMAGE_CREATED: 'image:created',
	IMAGE_UPDATED: 'image:updated',
	IMAGE_DELETED: 'image:deleted',
	IMAGES_CHANGED: 'images:changed',
	THUMBNAIL_GENERATED: 'image:thumbnail:generated',
	METADATA_UPDATED: 'image:metadata:updated',
	ERROR: 'image:error',
} as const;

// Mapeo de eventos internos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	// Eventos genéricos
	error: 'folder:error',
	// Mapeos específicos
	[IMAGE_EVENTS.IMAGE_CREATED]: 'images:modified',
	[IMAGE_EVENTS.IMAGE_UPDATED]: 'images:modified',
	[IMAGE_EVENTS.IMAGE_DELETED]: 'images:modified',
	[IMAGE_EVENTS.IMAGES_CHANGED]: 'images:modified',
	[IMAGE_EVENTS.THUMBNAIL_GENERATED]: 'images:modified',
	[IMAGE_EVENTS.METADATA_UPDATED]: 'images:modified',
	[IMAGE_EVENTS.ERROR]: 'folder:error',
} as const;

class ImageService {
	private static instance: ImageService;
	private readonly SUPPORTED_FORMATS = imageConfig.processing.supportedFormats;
	private readonly CACHE_DIR = '.image-cache';

	private constructor() {
		this.ensureCacheDir();
	}

	public static getInstance(): ImageService {
		if (!ImageService.instance) {
			ImageService.instance = new ImageService();
		}
		return ImageService.instance;
	}

	// Método privado para emitir eventos
	private async emitEvent(event: string, data: unknown): Promise<void> {
		try {
			const eventType = EVENT_TYPE_MAPPING[event] || 'images:modified';
			await emit({
				type: eventType,
				data,
			});
		} catch (error) {
			imageLogger.error('Error emitiendo evento:', { event, error });
		}
	}

	private async ensureCacheDir() {
		try {
			await fs.mkdir(this.CACHE_DIR, { recursive: true });
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al crear directorio de caché',
				serviceName: SERVICE_NAME,
			});
		}
	}

	private getCacheKey(filePath: string, options: ImageProcessingOptions): string {
		const hash = createHash('md5');
		hash.update(filePath + JSON.stringify(options));
		return hash.digest('hex');
	}

	private async processImage(
		inputPath: string,
		options: ImageProcessingOptions = {}
	): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
		try {
			let pipeline = sharp(inputPath);
			const metadata = await pipeline.metadata();

			// Verificar que los valores de ancho y alto existen antes de usarlos
			const width = metadata.width ?? 0;
			const height = metadata.height ?? 0;

			if (options.width || options.height) {
				const aspectRatio = width > 0 && height > 0 ? width / height : 1;
				let targetWidth = options.width;
				let targetHeight = options.height;

				if (aspectRatio > 1 && targetWidth) {
					targetHeight = Math.round(targetWidth / aspectRatio);
				} else if (targetHeight) {
					targetWidth = Math.round(targetHeight * aspectRatio);
				}

				pipeline = pipeline.resize(targetWidth, targetHeight, {
					fit: options.fit || 'cover',
					withoutEnlargement: true,
				});
			}

			if (options.format === 'webp') {
				pipeline = pipeline.webp({
					quality: options.quality || 80,
					effort: 4,
					nearLossless: true,
				});
			} else if (options.format === 'jpeg') {
				pipeline = pipeline.jpeg({
					quality: options.quality || 80,
					progressive: true,
				});
			} else if (options.format === 'png') {
				pipeline = pipeline.png({
					progressive: true,
					compressionLevel: 9,
				});
			}

			const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
			return { buffer: data, metadata: info };
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al procesar imagen',
				context: { inputPath, options },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async createImage(data: CreateImageInput): Promise<ImageExtended> {
		try {
			// Crear el registro en la base de datos
			const dbImage = await prisma.image.create({
				data: {
					name: data.name,
					path: data.path,
					size: data.size,
					width: data.width,
					height: data.height,
					hash: data.hash,
					metadata: data.metadata ? JSON.stringify(data.metadata) : null,
					isPublic: data.isPublic ?? false,
					folder: {
						connect: { id: data.folderId },
					},
				},
				include: {
					tags: true,
				},
			});

			// Generar thumbnail automáticamente
			await this.generateThumbnail(dbImage.id, ThumbnailQuality.MEDIUM);

			// Inicializar estadísticas
			await statsService.getOrCreateImageStats(dbImage.id);

			// Usar el transformer para convertir a entidad
			const result = transformImageToExtended(dbImage);

			// Emitir evento de creación
			await this.emitEvent(IMAGE_EVENTS.IMAGE_CREATED, result);
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'create', image: result });

			return result;
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al crear imagen',
				context: { data },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
		try {
			const image = await prisma.image.findUnique({
				where: { id: imageId },
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			const config = THUMBNAIL_QUALITY_CONFIG[quality];
			if (!config) {
				throw createServiceError({
					code: ServiceErrorCode.INVALID_INPUT,
					message: 'Calidad de thumbnail inválida',
					context: { quality },
					serviceName: SERVICE_NAME,
				});
			}

			// Verificar si el archivo de imagen existe
			try {
				await fs.access(image.path);
			} catch (error) {
				throw createFileNotFoundError(image.path, SERVICE_NAME);
			}

			// Procesar la imagen para crear el thumbnail
			const { buffer } = await this.processImage(image.path, {
				width: config.width,
				height: config.height,
				quality: config.quality,
				format: 'webp',
				fit: 'cover',
			});

			// Guardar el thumbnail en la base de datos
			await prisma.thumbnail.upsert({
				where: {
					imageId_quality: {
						imageId,
						quality,
					},
				},
				create: {
					imageId,
					quality,
					data: buffer,
				},
				update: {
					data: buffer,
				},
			});

			// Invalidar caché si existe
			const cacheKey = `thumbnail:${imageId}:${quality}`;
			await thumbnailCache.delete(cacheKey);

			// Emitir evento de thumbnail generado
			await this.emitEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, { imageId, quality });
		} catch (error) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al generar thumbnail',
				imageId,
				quality,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_PROCESSING_ERROR,
				message: 'Error al generar thumbnail',
				context: { imageId, quality },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<Buffer> {
		try {
			// Verificar que la imagen existe
			const image = await prisma.image.findUnique({
				where: { id: imageId },
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			// Verificar que la calidad solicitada es válida
			if (!Object.values(ThumbnailQuality).includes(quality)) {
				throw createServiceError({
					code: ServiceErrorCode.INVALID_INPUT,
					message: 'Calidad de thumbnail inválida',
					context: { quality },
					serviceName: SERVICE_NAME,
				});
			}

			// Intentar recuperar de la caché
			const cacheKey = `thumbnail:${imageId}:${quality}`;
			const cachedThumbnail = await thumbnailCache.get(cacheKey);
			if (cachedThumbnail) {
				return cachedThumbnail;
			}

			// Buscar en la base de datos
			const thumbnail = await prisma.thumbnail.findUnique({
				where: {
					imageId_quality: {
						imageId,
						quality,
					},
				},
			});

			// Si no existe, generar y retornar
			if (!thumbnail) {
				await this.generateThumbnail(imageId, quality);
				// Buscar nuevamente después de generar
				const newThumbnail = await prisma.thumbnail.findUnique({
					where: {
						imageId_quality: {
							imageId,
							quality,
						},
					},
				});

				if (!newThumbnail) {
					throw createServiceError({
						code: ServiceErrorCode.FILE_NOT_FOUND,
						message: 'No se pudo generar el thumbnail',
						context: { imageId, quality },
						serviceName: SERVICE_NAME,
					});
				}

				// Guardar en caché y retornar
				await thumbnailCache.set(cacheKey, newThumbnail.data);
				return newThumbnail.data;
			}

			// Guardar en caché y retornar
			await thumbnailCache.set(cacheKey, thumbnail.data);
			return thumbnail.data;
		} catch (error) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al obtener thumbnail',
				imageId,
				quality,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener thumbnail',
				context: { imageId, quality },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async getOriginalImage(imageId: string): Promise<Buffer> {
		try {
			const image = await prisma.image.findUnique({
				where: { id: imageId },
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			try {
				return await fs.readFile(image.path);
			} catch (error) {
				throw createFileNotFoundError(image.path, SERVICE_NAME);
			}
		} catch (error) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al obtener imagen original',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener imagen original',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async getImageMetadata(imageId: string): Promise<Record<string, unknown>> {
		try {
			const image = await prisma.image.findUnique({
				where: { id: imageId },
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			// Si ya tiene metadatos, retornarlos
			if (image.metadata) {
				try {
					return JSON.parse(image.metadata);
				} catch (error) {
					imageLogger.warn('Error al parsear metadatos existentes:', { error, imageId });
					// Si falla, continuar para extraer nuevos metadatos
				}
			}

			// Verificar si el archivo existe
			try {
				await fs.access(image.path);
			} catch (error) {
				throw createFileNotFoundError(image.path, SERVICE_NAME);
			}

			// Extraer y guardar metadatos
			const metadata = await extractMetadata(image.path);
			if (metadata && Object.keys(metadata).length > 0) {
				await prisma.image.update({
					where: { id: imageId },
					data: {
						metadata: JSON.stringify(metadata),
					},
				});

				// Emitir evento de metadatos actualizados
				await this.emitEvent(IMAGE_EVENTS.METADATA_UPDATED, { imageId, metadata });
			}

			return metadata || {};
		} catch (error) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al obtener metadatos',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al obtener metadatos',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}
}

// Exportar la instancia singleton del servicio
export const imageService = ImageService.getInstance();
