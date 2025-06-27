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

import { extractMetadata } from '@/app/actions/metadata';
import { imageConfig } from '@/lib/config';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromPrismaImageWithCounts } from '@/transformers/image/transformer';
import type { ImageUpdateInput, ImageWithStats } from '@/types/entities/image/types';
import { ThumbnailQuality } from '@/types/thumbnails';
import {
    createEntityNotFoundError,
    createFileNotFoundError,
    createServiceError,
    ServiceErrorCode,
    toServiceError,
} from '@/lib/utils/errors/service-errors';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import sharp from 'sharp';

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
					// isPublic eliminado porque no existe en el modelo
					folder: {
						connect: { id: data.folderId },
					},
				},
				include: {
					tags: true,
					albums: true,
					collections: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					folder: { select: { id: true, name: true, path: true } },
					_count: {
						select: {
							tags: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							notes: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				},
			});

			// Crear estadísticas iniciales
			await prisma.imageStats.create({
				data: {
					imageId: dbImage.id,
					views: 0,
				},
			});

			// Generar thumbnail automáticamente
			await this.generateThumbnail(dbImage.id);

			// Usar el transformer para convertir a ImageWithStats
			const result = fromPrismaImageWithCounts(dbImage);

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

			const image = await prisma.image.findUnique({
				where: { id },
				include: {
					tags: true,
					albums: true,
					collections: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					folder: { select: { id: true, name: true, path: true } },
					_count: {
						select: {
							tags: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							notes: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				},
			});

			if (!image) {
				imageLogger.warn('⚠️ Imagen no encontrada:', id);
				return null;
			}

			const result = fromPrismaImageWithCounts(image);
			imageLogger.info('✅ Imagen obtenida correctamente');
			return result;
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
			imageLogger.info('📝 Actualizando imagen:', id);

			// Verificar que la imagen exista
			const existingImage = await prisma.image.findUnique({
				where: { id },
			});

			if (!existingImage) {
				throw createEntityNotFoundError('Imagen', id, SERVICE_NAME);
			}

			// Preparar datos para actualización
			const updateData: any = {};
			if (data.name !== undefined) updateData.name = data.name;
			if (data.description !== undefined) updateData.description = data.description;
			if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
			if (data.metadata !== undefined) updateData.metadata = data.metadata;

			const updated = await prisma.image.update({
				where: { id },
				data: updateData,
				include: {
					tags: true,
					albums: true,
					collections: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					folder: { select: { id: true, name: true, path: true } },
					_count: {
						select: {
							tags: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							notes: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				},
			});

			const result = fromPrismaImageWithCounts(updated);

			// Emitir evento de actualización
			await this.emitEvent(IMAGE_EVENTS.IMAGE_UPDATED, result);
			await this.emitEvent(IMAGE_EVENTS.IMAGES_CHANGED, { action: 'update', image: result });

			imageLogger.info('✅ Imagen actualizada correctamente');
			return result;
		} catch (error) {
			imageLogger.error('❌ Error actualizando imagen:', error);
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'No se pudo actualizar la imagen',
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
			const existingImage = await prisma.image.findUnique({
				where: { id },
				select: { id: true },
			});

			if (!existingImage) {
				throw createEntityNotFoundError('Imagen', id, SERVICE_NAME);
			}

			await prisma.image.delete({
				where: { id },
			});

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

			// Construir filtros
			const where: any = {};

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				];
			}

			if (folderId) {
				where.folderId = folderId;
			}

			if (isFavorite !== undefined) {
				where.isFavorite = isFavorite;
			}

			if (tagIds && tagIds.length > 0) {
				where.tags = {
					some: {
						id: { in: tagIds },
					},
				};
			}

			// Obtener total y imágenes
			const [total, images] = await Promise.all([
				prisma.image.count({ where }),
				prisma.image.findMany({
					where,
					include: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
						folder: { select: { id: true, name: true, path: true } },
						_count: {
							select: {
								tags: true,
								albums: true,
								collections: true,
								characters: true,
								places: true,
								worldItems: true,
								concepts: true,
								prompts: true,
								notes: true,
								wildcards: true,
								properties: true,
								groups: true,
							},
						},
					},
					orderBy: { [sortBy]: sortOrder },
					skip: (page - 1) * pageSize,
					take: pageSize,
				}),
			]);

			return {
				images: images.map(fromPrismaImageWithCounts),
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
			const image = await prisma.image.findUnique({
				where: { id: imageId },
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
			await prisma.image.update({
				where: { id: imageId },
				data: {
					thumbnail: buffer,
					thumbnailSize: buffer.length,
					thumbnailWidth: metadata.width ?? config.width,
					thumbnailHeight: metadata.height ?? config.height,
					thumbnailMimeType: 'image/webp',
					thumbnailError: null,
					thumbnailErrorAt: null,
					thumbnailOptimizedAt: new Date(),
				},
			});

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
			const image = await prisma.image.findUnique({
				where: { id: imageId },
				select: {
					thumbnail: true,
					path: true,
				},
			});

			// Si ya existe el thumbnail en la base de datos, devolverlo
			if (image?.thumbnail) {
				return Buffer.isBuffer(image.thumbnail) ? image.thumbnail : Buffer.from(image.thumbnail);
			}

			// Si no existe, intentar generarlo en caliente desde el archivo original
			if (image?.path) {
				const config: ImageProcessingOptions = {
					width: 512,
					height: 512,
					quality: 80,
					format: 'webp',
					fit: 'cover',
				};
				const { buffer } = await this.processImage(image.path, config);

				// Guardar el thumbnail en la base de datos
				await prisma.image.update({
					where: { id: imageId },
					data: {
						thumbnail: buffer,
						thumbnailSize: buffer.length,
						thumbnailMimeType: 'image/webp',
						thumbnailOptimizedAt: new Date(),
					},
				});

				// Guardar el thumbnail en la carpeta de caché
				const cachePath = `${this.CACHE_DIR}/thumb_${imageId}.webp`;
				await fs.writeFile(cachePath, buffer);

				return buffer;
			}

			// Si no se puede generar, lanzar error
			throw createServiceError({
				code: ServiceErrorCode.FILE_NOT_FOUND,
				message: 'Thumbnail no encontrado',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		} catch (error: any) {
			await this.emitEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al obtener thumbnail',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener thumbnail',
				context: { imageId },
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

			// 🟡 Logging detallado para depuración de acceso a archivos
			imageLogger.info('🔍 Verificando acceso al archivo original:', image.path);
			try {
				await fs.access(image.path, fs.constants.R_OK);
				imageLogger.info('🟢 Permiso de lectura OK para:', image.path);
			} catch (permError) {
				imageLogger.error(
					'🔴 Sin permiso de lectura para:',
					image.path,
					permError instanceof Error ? permError.message : String(permError)
				);
			}
			imageLogger.info(
				'🟡 Usuario proceso:',
				process.env.USERNAME || process.env.USER || (typeof process.getuid === 'function' ? process.getuid() : 'N/A')
			);

			try {
				return await fs.readFile(image.path);
			} catch (_error) {
				throw createFileNotFoundError(image.path, { imageId }, SERVICE_NAME);
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
			} catch (_error) {
				throw createFileNotFoundError(image.path, { imageId }, SERVICE_NAME);
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

/**
 * 📝 DOCUMENTACIÓN: Thumbnail único por imagen
 * - Ahora el sistema almacena un solo thumbnail por imagen usando los campos de la entidad Image.
 * - Se elimina la lógica de múltiples calidades y la dependencia de una tabla Thumbnail.
 * - La obtención y generación de thumbnails es directa y eficiente.
 * - Compatible con el frontend y FileBrowser2.
 */
