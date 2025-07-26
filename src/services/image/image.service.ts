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
import { and, asc, count, desc, eq, isNotNull, like, or, sum } from 'drizzle-orm';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { imageConfig } from '@/lib/config';
import { db } from '@/lib/drizzle';
import { folders, imageStats, images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import {
	createEntityNotFoundError,
	createFileNotFoundError,
	createServiceError,
	ServiceErrorCode,
	toServiceError,
} from '@/lib/utils/errors/service-errors';
import type { ImageUpdateInput, ImageWithStats } from '@/types/entities/image/types';
import type { ThumbnailQuality, ThumbnailStats } from '@/types/thumbnails';
// Tipos movidos a types locales
export interface GetImagesOptions {
	folderId?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	tagIds?: string[];
	isFavorite?: boolean;
	pageSize?: number;
	page?: number;
}

export interface GetImagesResult {
	images: ImageWithStats[];
	total: number;
	hasMore: boolean;
	pagination?: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

import * as crypto from 'crypto';

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

	async createImage(data: CreateImageInput): Promise<ImageWithStats> {
		try {
			const [newImage] = await db
				.insert(images)
				.values({
					id: crypto.randomUUID(),
					name: data.name,
					path: data.path,
					size: data.size,
					width: data.width,
					height: data.height,
					hash: data.hash,
					metadata: data.metadata ? JSON.stringify(data.metadata) : null,
					folderId: data.folderId,
					isPublic: data.isPublic || false,
					isFavorite: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// Crear estadísticas iniciales
			await db.insert(imageStats).values({
				id: crypto.randomUUID(),
				imageId: newImage.id,
				views: 0,
			});

			// Generar thumbnail automáticamente
			await this.generateThumbnail(newImage.id);

			// Obtener la imagen completa con sus relaciones
			const result = await this.getImage(newImage.id);

			if (!result) {
				throw createServiceError({
					code: ServiceErrorCode.UNEXPECTED_ERROR,
					message: 'No se pudo obtener la imagen recién creada',
				});
			}

			// Emitir evento de creación
			await this.emitEvent(IMAGE_EVENTS.IMAGE_CREATED, result);
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'create', image: result });

			return result;
		} catch (error: any) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al crear imagen',
				context: { data },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene una imagen por su ID con estadísticas optimizadas
	 */
	async getImage(id: string): Promise<ImageWithStats | null> {
		try {
			imageLogger.info('🔍 Obteniendo imagen:', id);

			// Obtener imagen base
			const imageResult = await db.select().from(images).where(eq(images.id, id)).limit(1);

			if (imageResult.length === 0) {
				imageLogger.warn('⚠️ Imagen no encontrada:', id);
				return null;
			}

			const image = imageResult[0];

			// Construir imagen con estadísticas
			const imageWithStats: ImageWithStats = {
				...image,
				isFavorite: Boolean(image.isFavorite),
				entityType: 'image',
				stats: {
					viewCount: 0,
					downloadCount: 0,
					likeCount: 0,
					commentCount: 0,
					tagCount: 0,
					albumCount: 0,
					collectionCount: 0,
					characterCount: 0,
					placeCount: 0,
					worldItemCount: 0,
					conceptCount: 0,
					promptCount: 0,
					noteCount: 0,
					wildcardCount: 0,
					propertyCount: 0,
					groupCount: 0,
				},
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
				fullUrl: `/api/images/${image.id}/original`,
			};

			imageLogger.info('✅ Imagen obtenida correctamente');
			return imageWithStats;
		} catch (error) {
			imageLogger.error('❌ Error obteniendo imagen:', error);
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'No se pudo obtener la imagen',
			});
		}
	}

	/**
	 * Actualiza una imagen existente
	 */
	async updateImage(id: string, data: ImageUpdateInput): Promise<ImageWithStats> {
		try {
			// Buscar la imagen existente
			const image = await db.query.images.findFirst({
				where: eq(images.id, id),
			});

			if (!image) {
				throw createEntityNotFoundError('Image', id);
			}

			// Actualizar en la base de datos
			const [updatedImage] = await db
				.update(images)
				.set({
					...data,
					metadata: data.metadata ? JSON.stringify(data.metadata) : image.metadata,
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			// Volver a obtener la imagen con sus estadísticas
			const imageWithStats = await this.getImage(id);
			if (!imageWithStats) {
				throw createEntityNotFoundError('Image', id, 'después de actualizar');
			}

			await this.emitEvent(IMAGE_EVENTS.IMAGE_UPDATED, { id, changes: data });
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, {});

			return imageWithStats;
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al actualizar imagen',
				context: { imageId: id, data },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Elimina una imagen
	 */
	async deleteImage(id: string): Promise<void> {
		try {
			imageLogger.info('🗑️ Eliminando imagen:', id);

			// Verificar que la imagen exista
			const existingImage = await db.query.images.findFirst({
				where: eq(images.id, id),
				columns: { id: true },
			});

			if (!existingImage) {
				throw createEntityNotFoundError('Imagen', id, SERVICE_NAME);
			}

			await db.delete(images).where(eq(images.id, id));

			// Emitir eventos
			await this.emitEvent(IMAGE_EVENTS.IMAGE_DELETED, { id });
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'delete', imageId: id });

			imageLogger.info('✅ Imagen eliminada correctamente');
		} catch (error) {
			imageLogger.error('❌ Error eliminando imagen:', error);
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'No se pudo eliminar la imagen',
			});
		}
	}

	/**
	 * Obtiene múltiples imágenes con paginación y filtros
	 */
	async getImages(options: GetImagesOptions = {}): Promise<GetImagesResult> {
		try {
			const {
				search,
				folderId,
				tagIds,
				isFavorite,
				pageSize = 50,
				page = 1,
				sortBy = 'updatedAt',
				sortOrder = 'desc',
			} = options;

			// **MIGRACIÓN A DRIZZLE**
			// Construir filtros dinámicamente
			const conditions: any[] = [];

			// Filtro de búsqueda por texto
			if (search) {
				conditions.push(or(like(images.name, `%${search}%`), like(images.description, `%${search}%`)));
			}

			// Filtro por carpeta
			if (folderId) {
				conditions.push(eq(images.folderId, folderId));
			}

			// Filtro por favorito
			if (isFavorite !== undefined) {
				conditions.push(eq(images.isFavorite, isFavorite));
			}

			// TODO: Filtros por tagIds requieren JOINs con tablas de relación
			// Por ahora los omitimos para simplificar la migración inicial
			if (tagIds && tagIds.length > 0) {
				imageLogger.warn('⚠️ Filtro por tagIds aún no implementado en Drizzle');
			}

			// Determinar el ordenamiento
			const orderDirection = sortOrder === 'desc' ? desc : asc;
			let orderByField: any;

			switch (sortBy) {
				case 'name':
					orderByField = orderDirection(images.name);
					break;
				case 'createdAt':
					orderByField = orderDirection(images.createdAt);
					break;
				case 'size':
					orderByField = orderDirection(images.size);
					break;
				default:
					orderByField = orderDirection(images.updatedAt);
			}

			// Consulta principal con JOIN a folder
			const drizzleQuery = db
				.select({
					// Campos de la imagen
					id: images.id,
					name: images.name,
					description: images.description,
					path: images.path,
					hash: images.hash,
					size: images.size,
					width: images.width,
					height: images.height,
					metadata: images.metadata,
					thumbnail: images.thumbnail,
					thumbnailSize: images.thumbnailSize,
					thumbnailWidth: images.thumbnailWidth,
					thumbnailHeight: images.thumbnailHeight,
					thumbnailMimeType: images.thumbnailMimeType,
					thumbnailError: images.thumbnailError,
					thumbnailErrorAt: images.thumbnailErrorAt,
					thumbnailOptimizedAt: images.thumbnailOptimizedAt,
					isFavorite: images.isFavorite,
					folderId: images.folderId,
					noteId: images.noteId,
					createdAt: images.createdAt,
					updatedAt: images.updatedAt,
					addedAt: images.addedAt,
					// Campos del folder (JOIN)
					folderRealId: folders.id,
					folderName: folders.name,
					folderPath: folders.path,
				})
				.from(images)
				.leftJoin(folders, eq(images.folderId, folders.id));

			// Aplicar filtros si existen
			let queryWithFilters = drizzleQuery;
			if (conditions.length > 0) {
				queryWithFilters = drizzleQuery.where(and(...conditions));
			}

			// Aplicar ordenamiento y paginación
			const drizzleImages = await queryWithFilters
				.orderBy(orderByField)
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			// Consulta de conteo total (con los mismos filtros)
			let countQuery = db.select({ count: count() }).from(images);

			if (conditions.length > 0) {
				countQuery = countQuery.where(and(...conditions));
			}

			const [{ count: total }] = await countQuery;

			const transformedImages = drizzleImages.map((raw: any) => {
				return {
					...raw,
					metadata: raw.metadata ? JSON.parse(raw.metadata) : null,
					isFavorite: Boolean(raw.isFavorite),
					entityType: 'image',
					stats: {
						viewCount: 0,
						downloadCount: 0,
						likeCount: 0,
						commentCount: 0,
						tagCount: 0,
						albumCount: 0,
						collectionCount: 0,
						characterCount: 0,
						placeCount: 0,
						worldItemCount: 0,
						conceptCount: 0,
						promptCount: 0,
						noteCount: 0,
						wildcardCount: 0,
						propertyCount: 0,
						groupCount: 0,
					},
					thumbnailUrl: `/api/images/${raw.id}/thumbnail`,
					fullUrl: `/api/images/${raw.id}/original`,
					folder: raw.folderRealId
						? {
							id: raw.folderRealId,
							name: raw.folderName ?? '',
							path: raw.folderPath ?? '',
						}
						: null,
				} as ImageWithStats;
			});

			return {
				images: transformedImages,
				pagination: {
					page,
					pageSize,
					total,
					totalPages: Math.ceil(total / pageSize),
					hasNext: page * pageSize < total,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'No se pudieron obtener las imágenes',
			});
		}
	}

	async generateThumbnail(imageId: string): Promise<void> {
		try {
			const image = await db.query.images.findFirst({
				where: eq(images.id, imageId),
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			// Configuración fija para el thumbnail
			const config: ImageProcessingOptions = {
				width: 512,
				height: 512,
				quality: 80,
				format: 'webp',
				fit: 'cover',
			};

			// Verificar acceso al archivo
			try {
				await fs.access(image.path, fs.constants.R_OK);
			} catch (permError: any) {
				imageLogger.error(
					'🔴 Sin permiso de lectura para:',
					image.path,
					permError instanceof Error ? permError.message : String(permError)
				);
				throw createFileNotFoundError(image.path, { imageId }, SERVICE_NAME);
			}

			// Procesar la imagen para crear el thumbnail
			const { buffer, metadata } = await this.processImage(image.path, config);

			// Guardar el thumbnail y sus metadatos en la entidad Image
			await db
				.update(images)
				.set({
					thumbnail: buffer,
					thumbnailSize: buffer.length,
					thumbnailWidth: metadata.width ?? config.width,
					thumbnailHeight: metadata.height ?? config.height,
					thumbnailMimeType: 'image/webp',
					thumbnailError: null,
					thumbnailErrorAt: null,
					thumbnailOptimizedAt: new Date(),
				})
				.where(eq(images.id, imageId));

			// Emitir evento de thumbnail generado
			await this.emitEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, { imageId });
		} catch (error: any) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al generar thumbnail',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al generar thumbnail',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene el thumbnail de una imagen (buffer). Si no existe, lo genera en caliente y lo cachea.
	 * @param imageId ID de la imagen
	 * @returns Buffer del thumbnail
	 */
	async getThumbnail(imageId: string): Promise<Buffer> {
		try {
			const image = await this.getImage(imageId);
			if (!image) {
				throw createEntityNotFoundError('Image', imageId);
			}

			if (image.thumbnail) {
				return image.thumbnail;
			}

			await this.generateThumbnail(imageId);
			const updatedImage = await this.getImage(imageId);
			if (!updatedImage || !updatedImage.thumbnail) {
				throw createFileNotFoundError(`Miniatura para la imagen ${imageId} no encontrada después de la generación`);
			}
			return updatedImage.thumbnail;
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener miniatura',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	async getOriginalImage(imageId: string): Promise<Buffer> {
		try {
			const image = await this.getImage(imageId);
			if (!image) {
				throw createEntityNotFoundError('Image', imageId);
			}

			if (!image.path) {
				throw createFileNotFoundError(`Ruta original para la imagen ${imageId} no encontrada`);
			}

			return await fs.readFile(image.path);
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener la imagen original',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene estadísticas de procesamiento de miniaturas.
	 * @returns Estadísticas de miniaturas.
	 */
	async getThumbnailProcessingStats(): Promise<ThumbnailStats> {
		try {
			const totalImages = await db.select({ count: count() }).from(images);
			const processedImages = await db
				.select({ count: count() })
				.from(images)
				.where(isNotNull(images.thumbnailOptimizedAt));
			const erroredImages = await db.select({ count: count() }).from(images).where(isNotNull(images.thumbnailError));
			const totalThumbnailSize = await db
				.select({ sum: sum(images.thumbnailSize) })
				.from(images)
				.where(isNotNull(images.thumbnailSize));
			const lastProcessedImage = await db
				.select({ date: images.thumbnailOptimizedAt })
				.from(images)
				.where(isNotNull(images.thumbnailOptimizedAt))
				.orderBy(desc(images.thumbnailOptimizedAt))
				.limit(1);

			return {
				total: totalImages[0]?.count || 0,
				processed: processedImages[0]?.count || 0,
				errors: erroredImages[0].count,
				totalSize: Number(totalThumbnailSize[0].sum || 0),
				lastProcessed: lastProcessedImage[0]?.date || undefined,
			};
		} catch (error) {
			imageLogger.error('Error al obtener estadísticas de miniaturas:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al obtener estadísticas de miniaturas',
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene una imagen por su hash.
	 * @param hash Hash de la imagen
	 * @returns Imagen con estadísticas o null si no se encuentra
	 */
	async getImageByHash(hash: string): Promise<ImageWithStats | null> {
		try {
			imageLogger.info('🔍 Buscando imagen por hash:', hash);

			// **MIGRACIÓN A DRIZZLE**
			const result = await db.select().from(images).where(eq(images.hash, hash)).limit(1);

			if (result.length === 0) {
				imageLogger.info('Imagen no encontrada por hash:', hash);
				return null;
			}

			const image = result[0];
			imageLogger.info('✅ Imagen encontrada por hash:', image.name);

			// Construir imagen con estadísticas
			const imageWithStats: ImageWithStats = {
				...image,
				isFavorite: Boolean(image.isFavorite),
				entityType: 'image',
				stats: {
					viewCount: 0,
					downloadCount: 0,
					likeCount: 0,
					commentCount: 0,
					tagCount: 0,
					albumCount: 0,
					collectionCount: 0,
					characterCount: 0,
					placeCount: 0,
					worldItemCount: 0,
					conceptCount: 0,
					promptCount: 0,
					noteCount: 0,
					wildcardCount: 0,
					propertyCount: 0,
					groupCount: 0,
				},
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
				fullUrl: `/api/images/${image.id}/original`,
			};

			return imageWithStats;
		} catch (error) {
			imageLogger.error('❌ Error al buscar imagen por hash:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al buscar imagen por hash',
				context: { hash },
				serviceName: SERVICE_NAME,
			});
		}
	}
}

// Exportar la clase y la instancia singleton del servicio
export { ImageService };
export const imageService = ImageService.getInstance();

/**
 * 📝 DOCUMENTACIÓN: Thumbnail único por imagen
 * - Ahora el sistema almacena un solo thumbnail por imagen usando los campos de la entidad Image.
 * - Se elimina la lógica de múltiples calidades y la dependencia de una tabla Thumbnail.
 * - La obtención y generación de thumbnails es directa y eficiente.
 * - Compatible con el frontend y FileBrowser2.
 */
