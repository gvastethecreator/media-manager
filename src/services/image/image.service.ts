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
import type { ThumbnailStats } from '@/types/thumbnails';
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

// Evitar import directo de 'crypto' (Node) para compatibilidad en bundle frontend.
// Utilizar Web Crypto si existe; fallback a generador UUID v4 no-criptográfico.
const randomId = (): string => {
	try {
		const g: any = globalThis as any;
		const rndUUID = g?.crypto?.randomUUID;
		if (typeof rndUUID === 'function') {
			return rndUUID.call(g.crypto);
		}
	} catch {
		// ignorar y usar fallback
	}
	// Fallback sin operaciones bitwise; generar 32 hex + guiones formateados
	const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	// xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	// Version (4) fija y variante simulada sin bitwise: tomar valor 0-15 => map a 8-11
	const variantSource = Number.parseInt(hex.slice(16, 17), 16) % 4; // 0..3
	const variantNibble = (8 + variantSource).toString(16); // 8..b
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		`4${hex.slice(13, 16)}`,
		`${variantNibble}${hex.slice(17, 20)}`,
		hex.slice(20, 32),
	].join('-');
};

const SERVICE_NAME = 'ImageService';
const MAX_THUMBNAIL_SIZE_BYTES = 300 * 1024; // 300KB tope para almacenar en TEXT base64 con holgura
const imageLogger = serverLogger.withContext(SERVICE_NAME);

// Re-export eliminado para cumplir regla de estilo
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
	private readonly CACHE_DIR = '.image-cache';

	private constructor() {
		this.ensureCacheDir();
	}

	static getInstance(): ImageService {
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

	private async processImage(
		inputPath: string,
		options: ImageProcessingOptions = {}
	): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
		try {
			let pipeline = sharp(inputPath);
			const meta = await pipeline.metadata();
			pipeline = this.applyResize(pipeline, meta, options);
			pipeline = this.applyFormat(pipeline, options);
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

	private applyResize(pipeline: sharp.Sharp, metadata: sharp.Metadata, options: ImageProcessingOptions): sharp.Sharp {
		const width = metadata.width ?? 0;
		const height = metadata.height ?? 0;
		const hasResize = Boolean(options.width) || Boolean(options.height);
		if (!hasResize) {
			return pipeline;
		}
		const aspectRatio = width > 0 && height > 0 ? width / height : 1;
		let targetWidth = options.width;
		let targetHeight = options.height;
		if (aspectRatio > 1 && targetWidth) {
			targetHeight = Math.round(targetWidth / aspectRatio);
		} else if (targetHeight) {
			targetWidth = Math.round(targetHeight * aspectRatio);
		}
		return pipeline.resize(targetWidth, targetHeight, {
			fit: options.fit || 'cover',
			withoutEnlargement: true,
		});
	}

	private applyFormat(pipeline: sharp.Sharp, options: ImageProcessingOptions): sharp.Sharp {
		switch (options.format) {
			case 'webp':
				// nearLossless genera archivos mayores; preferimos calidad moderada con esfuerzo razonable.
				return pipeline.webp({ quality: options.quality || 75, effort: 4 });
			case 'jpeg':
				return pipeline.jpeg({ quality: options.quality || 75, progressive: true, mozjpeg: true });
			case 'png':
				return pipeline.png({ progressive: true, compressionLevel: 9 });
			default:
				return pipeline;
		}
	}

	async createImage(data: CreateImageInput): Promise<ImageWithStats> {
		try {
			const [newImage] = await db
				.insert(images)
				.values({
					id: randomId(),
					name: data.name,
					path: data.path,
					size: data.size,
					width: data.width,
					height: data.height,
					hash: data.hash,
					metadata: data.metadata ? JSON.stringify(data.metadata) : null,
					folderId: data.folderId,

					isFavorite: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// Crear estadísticas iniciales
			await db.insert(imageStats).values({
				id: randomId(),
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
			await this.emitEvent(IMAGE_EVENTS.IMAGE_CREATED, { id: newImage.id });
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'create', imageId: newImage.id });

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

			await this.emitEvent(IMAGE_EVENTS.IMAGE_UPDATED, { id });
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'update', imageId: id });

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
				total,
				hasMore: page * pageSize < total,
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
		// Logging defensivo para diagnosticar posibles caídas en reindex masivo
		const startHr = process.hrtime.bigint();
		const memBefore = process.memoryUsage();
		imageLogger.info('[thumbnail] ▶️ start', {
			imageId,
			memRssMB: (memBefore.rss / 1024 / 1024).toFixed(1),
			memHeapUsedMB: (memBefore.heapUsed / 1024 / 1024).toFixed(1),
		});
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

			// Verificar existencia y permisos del archivo
			try {
				await fs.access(image.path, fs.constants.R_OK);
			} catch (permError: any) {
				const code = permError?.code;
				if (code === 'ENOENT' || code === 'ENOTDIR') {
					imageLogger.error('[thumbnail] Archivo no encontrado:', { path: image.path, code });
					throw createFileNotFoundError(image.path, { imageId }, SERVICE_NAME);
				}
				if (code === 'EACCES' || code === 'EPERM') {
					imageLogger.error('[thumbnail] Permiso denegado al leer:', {
						path: image.path,
						code,
						message: permError.message,
					});
					throw toServiceError(permError, {
						code: ServiceErrorCode.FILE_ACCESS_DENIED,
						message: `Permiso denegado: ${image.path}`,
						serviceName: SERVICE_NAME,
						context: { imageId, path: image.path },
					});
				}
				imageLogger.error('[thumbnail] Error comprobando acceso:', {
					path: image.path,
					code,
					message: permError instanceof Error ? permError.message : String(permError),
				});
				throw toServiceError(permError, {
					code: ServiceErrorCode.FILE_READ_ERROR,
					message: `No se pudo acceder al archivo: ${image.path}`,
					serviceName: SERVICE_NAME,
					context: { imageId, path: image.path },
				});
			}

			// Procesar la imagen para crear el thumbnail (primero en WebP)
			let { buffer, metadata } = await this.processImage(image.path, config);

			// Si el resultado supera el tope, recomprimir con ajustes más fuertes
			let mime = 'image/webp';
			if (buffer.length > MAX_THUMBNAIL_SIZE_BYTES) {
				imageLogger.info('[thumbnail] buffer grande, recomprimiendo', {
					imageId,
					sizeKB: (buffer.length / 1024).toFixed(1),
				});
				try {
					// Intento 1: WebP con menor calidad
					const webpRetry = await sharp(buffer).webp({ quality: 60, effort: 5 }).toBuffer({
						resolveWithObject: true,
					});
					buffer = webpRetry.data;
					metadata = webpRetry.info;
					mime = 'image/webp';
				} catch {
					// Intento 2: JPEG como fallback
					const jpegRetry = await sharp(image.path)
						.resize(config.width, config.height, { fit: config.fit || 'cover', withoutEnlargement: true })
						.jpeg({ quality: 75, progressive: true, mozjpeg: true })
						.toBuffer({ resolveWithObject: true });
					buffer = jpegRetry.data;
					metadata = jpegRetry.info;
					mime = 'image/jpeg';
				}
			}

			// Guardar resultado (try separado para capturar posibles errores DB sin perder métricas)
			try {
				await db
					.update(images)
					.set({
						thumbnail: buffer.toString('base64'), // Convertir Buffer a string base64
						thumbnailSize: buffer.length,
						thumbnailWidth: metadata.width ?? config.width,
						thumbnailHeight: metadata.height ?? config.height,
						thumbnailMimeType: mime,
						thumbnailError: null,
						thumbnailErrorAt: null,
						thumbnailOptimizedAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch (dbErr) {
				imageLogger.error('[thumbnail] 💥 DB update failed', {
					imageId,
					error: dbErr instanceof Error ? dbErr.message : String(dbErr),
				});
				throw dbErr;
			}

			// Emitir evento de thumbnail generado
			await this.emitEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, { imageId });

			const memAfter = process.memoryUsage();
			const durationMs = Number((process.hrtime.bigint() - startHr) / 1000000n);
			imageLogger.info('[thumbnail] ✅ done', {
				imageId,
				durationMs,
				bufferKB: (buffer.length / 1024).toFixed(1),
				memHeapDeltaMB: ((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2),
				memRssMB: (memAfter.rss / 1024 / 1024).toFixed(1),
			});
		} catch (error: any) {
			// Registrar error en columnas dedicadas para permitir reintentos controlados
			try {
				await db
					.update(images)
					.set({
						thumbnailError: error instanceof Error ? error.message : String(error),
						thumbnailErrorAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch (e) {
				imageLogger.warn('[thumbnail] No se pudo registrar thumbnailError', {
					imageId,
					error: e instanceof Error ? e.message : String(e),
				});
			}
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al generar thumbnail',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			imageLogger.error('[thumbnail] ❌ failed', {
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
	 * Variante segura: intenta generar thumbnail y NO lanza excepción.
	 * Devuelve true si se generó con éxito, false en caso contrario (registrando thumbnailError/thumbnailErrorAt).
	 */
	async generateThumbnailSafe(imageId: string): Promise<boolean> {
		try {
			await this.generateThumbnail(imageId);
			return true;
		} catch (err: any) {
			// Asegurar registro de error ya fue hecho en generateThumbnail catch; redundancia defensiva
			try {
				await db
					.update(images)
					.set({
						thumbnailError: err instanceof Error ? err.message : String(err),
						thumbnailErrorAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch {}
			return false;
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
				// Intentar convertir base64 -> Buffer y validar que sea una imagen legible
				try {
					const buf = Buffer.from(image.thumbnail, 'base64');
					// Validación ligera con sharp: obtener metadata; si falla, regenerar
					await sharp(buf).metadata();
					return buf;
				} catch (_e) {
					// Thumbnail corrupto o no válido: regenerar
					await this.generateThumbnail(imageId);
					const refreshed = await this.getImage(imageId);
					if (refreshed?.thumbnail) {
						return Buffer.from(refreshed.thumbnail, 'base64');
					}
					throw createFileNotFoundError(`Miniatura corrupta reparada pero no disponible para la imagen ${imageId}`);
				}
			}

			await this.generateThumbnail(imageId);
			const updatedImage = await this.getImage(imageId);
			if (!updatedImage?.thumbnail) {
				throw createFileNotFoundError(`Miniatura para la imagen ${imageId} no encontrada después de la generación`);
			}
			// Convertir string base64 a Buffer
			return Buffer.from(updatedImage.thumbnail, 'base64');
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
				failed: erroredImages[0]?.count || 0,
				pending: (totalImages[0]?.count || 0) - (processedImages[0]?.count || 0),
				totalFiles: totalImages[0]?.count || 0,
				totalSize: Number(totalThumbnailSize[0].sum || 0),
				processedSize: Number(totalThumbnailSize[0].sum || 0),
				errors: [],
				averageProcessingTime: 0,
				lastProcessedAt: lastProcessedImage[0]?.date || undefined,
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
