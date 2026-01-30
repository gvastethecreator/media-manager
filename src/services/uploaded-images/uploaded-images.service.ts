import * as crypto from 'crypto';
import { and, asc, count, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { uploadedImages } from '@/lib/drizzle/schema/index';
import { processUploadedImage } from '@/lib/image/image-processing';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { createEntityNotFoundError, ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';
import { fromDB } from '@/transformers/uploaded-image';
import type { UploadedImageType } from '@/types/entities/uploaded-image';
import type {
	CreateUploadedImageParams,
	GetUploadedImagesParams,
	UpdateUploadedImageParams,
	UploadedImageEvents,
	UploadedImageMetadata,
	UploadedImageProcessingOptions,
	UploadedImageResult,
	UploadedImageResults,
	UploadedImageStats,
} from '@/types/uploaded-images';

const SERVICE_NAME = 'UploadedImagesService';
const uploadedImagesLogger = serverLogger.withContext(SERVICE_NAME);

class UploadedImagesService {
	private static instance: UploadedImagesService;
	private readonly EVENTS: UploadedImageEvents = {
		IMAGE_CREATED: 'uploaded-image:created',
		IMAGE_UPDATED: 'uploaded-image:updated',
		IMAGE_DELETED: 'uploaded-image:deleted',
		IMAGES_CHANGED: 'uploaded-images:changed',
	};

	private constructor() {
		// Private constructor to force use of getInstance()
	}

	public static getInstance(): UploadedImagesService {
		if (!UploadedImagesService.instance) {
			UploadedImagesService.instance = new UploadedImagesService();
		}
		return UploadedImagesService.instance;
	}

	private async emitEvent(event: string, data: unknown): Promise<void> {
		try {
			await emit({
				type: event as EventType,
				data,
			});
		} catch (error) {
			uploadedImagesLogger.error('Error emitiendo evento:', { event, error });
		}
	}

	public async createImage(params: CreateUploadedImageParams): Promise<UploadedImageResult> {
		try {
			uploadedImagesLogger.info('🆕 Creando imagen subida');

			const { name, type, category, file, dimensions, metadata = {}, processingOptions = {} } = params;
			const { path, size } = file;
			const { width, height } = dimensions;

			let processedMetadata: UploadedImageMetadata = metadata;

			// Procesar la imagen si hay opciones de procesamiento
			if (Object.keys(processingOptions).length > 0) {
				const result = await this.processImage(path, processingOptions);
				processedMetadata = {
					...processedMetadata,
					...result.metadata,
				};
			}

			// Crear la imagen en la base de datos con Drizzle
			const [image] = await db
				.insert(uploadedImages)
				.values({
					name,
					path,
					size,
					hash: crypto.randomUUID(),
					metadata: processedMetadata ? JSON.stringify(processedMetadata) : null,
					imageId: crypto.randomUUID(),
					createdAt: new Date(),
				})
				.returning({
					id: uploadedImages.id,
					name: uploadedImages.name,
					path: uploadedImages.path,
					size: uploadedImages.size,
					hash: uploadedImages.hash,
					metadata: uploadedImages.metadata,
					imageId: uploadedImages.imageId,
					createdAt: uploadedImages.createdAt,
				});

			// Usar el transformer para convertir el registro a la respuesta
			const entity = fromDB(image);
			const result = {
				id: entity.id,
				name: entity.name,
				path: entity.path,
				type: entity.type as UploadedImageType,
				category: entity.category || '',
				hash: entity.hash,
				imageId: entity.imageId,
				size: entity.size,
				width: entity.width || 0,
				height: entity.height || 0,
				metadata: entity.metadata ? JSON.parse(entity.metadata) : null,
				dimensions: entity.dimensions,
				url: entity.url,
				thumbnailUrl: entity.thumbnailUrl,
				createdAt: entity.createdAt,
				updatedAt: entity.updatedAt,
			} as UploadedImageResult;

			// Emitir evento de creación
			await this.emitEvent(this.EVENTS.IMAGE_CREATED, result);
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'create', image: result });

			uploadedImagesLogger.info('✅ Imagen subida creada:', result.id);
			return result;
		} catch (error) {
			uploadedImagesLogger.error('❌ Error al crear imagen subida:', error);
			// Usar el nuevo sistema de manejo de errores
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al crear imagen subida',
				serviceName: SERVICE_NAME,
			});
		}
	}

	public async updateImage(id: string, params: UpdateUploadedImageParams): Promise<UploadedImageResult> {
		try {
			uploadedImagesLogger.info(`🔄 Actualizando imagen subida: ${id}`);

			// Verificar que la imagen existe con Drizzle
			const existingImageQuery = await db
				.select({
					id: uploadedImages.id,
					name: uploadedImages.name,
					path: uploadedImages.path,
					type: uploadedImages.type,
					category: uploadedImages.category,
					size: uploadedImages.size,
					width: uploadedImages.width,
					height: uploadedImages.height,
					metadata: uploadedImages.metadata,
					createdAt: uploadedImages.createdAt,
					updatedAt: uploadedImages.updatedAt,
				})
				.from(uploadedImages)
				.where(eq(uploadedImages.id, id))
				.limit(1);

			if (existingImageQuery.length === 0) {
				throw createEntityNotFoundError('UploadedImage', id, SERVICE_NAME);
			}

			const existingImage = existingImageQuery[0];
			const { name, type, category, file, dimensions, metadata, processingOptions } = params;

			let updatedMetadata = existingImage.metadata ? JSON.parse(existingImage.metadata) : {};
			let imagePath = existingImage.path;
			let imageSize = existingImage.size;
			let imageWidth = existingImage.width;
			let imageHeight = existingImage.height;

			// Si se proporciona un nuevo archivo, procesarlo
			if (file) {
				// Eliminar el archivo anterior si es diferente
				if (existingImage.path !== file.path) {
					await this.deleteImageFile(existingImage.path);
				}

				imagePath = file.path;
				imageSize = file.size;

				// Procesar la imagen si hay opciones
				if (processingOptions && Object.keys(processingOptions).length > 0) {
					const result = await this.processImage(file.path, processingOptions);
					updatedMetadata = {
						...updatedMetadata,
						...result.metadata,
					};
					imagePath = result.path;
				}
			}

			// Actualizar dimensiones si se proporcionan
			if (dimensions) {
				imageWidth = dimensions.width;
				imageHeight = dimensions.height;
			}

			// Actualizar metadatos si se proporcionan
			if (metadata) {
				updatedMetadata = {
					...updatedMetadata,
					...metadata,
				};
			}

			// Actualizar la imagen en la base de datos con Drizzle
			const [image] = await db
				.update(uploadedImages)
				.set({
					name: name ?? existingImage.name,
					path: imagePath,
					type: type ?? existingImage.type,
					category: category ?? existingImage.category,
					size: imageSize,
					width: imageWidth,
					height: imageHeight,
					metadata: Object.keys(updatedMetadata).length > 0 ? JSON.stringify(updatedMetadata) : null,
				})
				.where(eq(uploadedImages.id, id))
				.returning({
					id: uploadedImages.id,
					name: uploadedImages.name,
					path: uploadedImages.path,
					type: uploadedImages.type,
					category: uploadedImages.category,
					size: uploadedImages.size,
					width: uploadedImages.width,
					height: uploadedImages.height,
					metadata: uploadedImages.metadata,
					createdAt: uploadedImages.createdAt,
					updatedAt: uploadedImages.updatedAt,
				});

			// Usar el transformer para convertir el registro a la respuesta
			const entity = fromDB(image);
			const result = {
				id: entity.id,
				name: entity.name,
				path: entity.path,
				type: entity.type as UploadedImageType,
				category: entity.category || '',
				hash: entity.hash,
				imageId: entity.imageId,
				size: entity.size,
				width: entity.width || 0,
				height: entity.height || 0,
				metadata: entity.metadata ? JSON.parse(entity.metadata) : null,
				dimensions: entity.dimensions,
				url: entity.url,
				thumbnailUrl: entity.thumbnailUrl,
				createdAt: entity.createdAt,
				updatedAt: entity.updatedAt,
			} as UploadedImageResult;

			// Emitir evento de actualización
			await this.emitEvent(this.EVENTS.IMAGE_UPDATED, result);
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'update', image: result });

			uploadedImagesLogger.info('✅ Imagen subida actualizada:', result.id);
			return result;
		} catch (error) {
			uploadedImagesLogger.error('❌ Error al actualizar imagen subida:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al actualizar imagen subida',
				context: { id, params },
				serviceName: SERVICE_NAME,
			});
		}
	}

	public async deleteImage(id: string): Promise<void> {
		try {
			// Verificar que la imagen existe
			const image = await db
				.select({
					id: uploadedImages.id,
					path: uploadedImages.path,
				})
				.from(uploadedImages)
				.where(eq(uploadedImages.id, id))
				.limit(1);

			if (image.length === 0) {
				throw createEntityNotFoundError('UploadedImage', id, SERVICE_NAME);
			}

			const { path } = image[0];

			// Eliminar el archivo físico
			await this.deleteImageFile(path);

			// Eliminar la entrada de la base de datos
			await db.delete(uploadedImages).where(eq(uploadedImages.id, id));

			// Emitir evento de eliminación
			await this.emitEvent(this.EVENTS.IMAGE_DELETED, { id });
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'delete', id });
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al eliminar imagen subida',
				context: { id },
				serviceName: SERVICE_NAME,
			});
		}
	}

	public async getImages(params: GetUploadedImagesParams = {}): Promise<UploadedImageResults> {
		try {
			uploadedImagesLogger.info('🔍 Obteniendo imágenes subidas con filtros');

			const { filters = {}, includeDimensions = true, includeThumbnails = true, targetDimensions } = params;

			const {
				type,
				category,
				minWidth,
				maxWidth,
				minHeight,
				maxHeight,
				minSize,
				maxSize,
				search,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				page = 1,
				pageSize = 20,
			} = filters;

			// Construir condiciones de filtrado con Drizzle
			const conditions = [];

			if (type) {
				conditions.push(eq(uploadedImages.type, type));
			}

			if (category) {
				conditions.push(eq(uploadedImages.category, category));
			}

			// Filtrar por tamaño
			if (minSize) {
				conditions.push(gte(uploadedImages.size, minSize));
			}
			if (maxSize) {
				conditions.push(lte(uploadedImages.size, maxSize));
			}

			// Filtrar por dimensiones
			if (minWidth) {
				conditions.push(gte(uploadedImages.width, minWidth));
			}
			if (maxWidth) {
				conditions.push(lte(uploadedImages.width, maxWidth));
			}
			if (minHeight) {
				conditions.push(gte(uploadedImages.height, minHeight));
			}
			if (maxHeight) {
				conditions.push(lte(uploadedImages.height, maxHeight));
			}

			// Búsqueda por nombre o categoría
			if (search) {
				conditions.push(or(like(uploadedImages.name, `%${search}%`), like(uploadedImages.category, `%${search}%`)));
			}

			const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

			// Calcular el número total de imágenes que coinciden con los filtros
			const totalResult = await db
				.select({ count: count(uploadedImages.id) })
				.from(uploadedImages)
				.where(whereCondition);

			// Determinar el orden
			let orderByColumn:
				| typeof uploadedImages.name
				| typeof uploadedImages.size
				| typeof uploadedImages.type
				| typeof uploadedImages.createdAt;
			switch (sortBy) {
				case 'name':
					orderByColumn = uploadedImages.name;
					break;
				case 'size':
					orderByColumn = uploadedImages.size;
					break;
				case 'type':
					orderByColumn = uploadedImages.type;
					break;
				default:
					orderByColumn = uploadedImages.createdAt;
					break;
			}
			const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

			// Obtener las imágenes paginadas
			const rawImages = await db
				.select({
					id: uploadedImages.id,
					name: uploadedImages.name,
					path: uploadedImages.path,
					type: uploadedImages.type,
					category: uploadedImages.category,
					size: uploadedImages.size,
					hash: uploadedImages.hash,
					metadata: uploadedImages.metadata,
					imageId: uploadedImages.imageId,
					width: uploadedImages.width,
					height: uploadedImages.height,
					createdAt: uploadedImages.createdAt,
					updatedAt: uploadedImages.updatedAt,
				})
				.from(uploadedImages)
				.where(whereCondition)
				.orderBy(orderBy)
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			// Transformar los resultados usando el transformer
			const items = rawImages.map((image: (typeof rawImages)[0]) => {
				const entity = fromDB(image);
				// Mapear UploadedImageExtended a UploadedImageResult
				return {
					id: entity.id,
					name: entity.name,
					path: entity.path,
					type: entity.type as UploadedImageType,
					category: entity.category || '',
					hash: entity.hash,
					imageId: entity.imageId,
					size: entity.size,
					width: entity.width || 0,
					height: entity.height || 0,
					metadata: entity.metadata ? JSON.parse(entity.metadata) : null,
					dimensions: entity.dimensions,
					url: entity.url,
					thumbnailUrl: entity.thumbnailUrl,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				} as UploadedImageResult;
			});

			// Obtener estadísticas si se incluyen en la respuesta
			const stats = await this.getImageStats();

			uploadedImagesLogger.info(`✅ ${items.length} imágenes obtenidas`);

			return {
				items,
				total: totalResult[0].count,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			uploadedImagesLogger.error('❌ Error al obtener imágenes subidas:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al obtener imágenes subidas',
				context: { params },
				serviceName: SERVICE_NAME,
			});
		}
	}

	public async getImage(id: string): Promise<UploadedImageResult | null> {
		try {
			uploadedImagesLogger.info(`🔍 Obteniendo imagen subida por ID: ${id}`);

			// Buscar la imagen por ID
			const imageQuery = await db
				.select({
					id: uploadedImages.id,
					name: uploadedImages.name,
					path: uploadedImages.path,
					size: uploadedImages.size,
					hash: uploadedImages.hash,
					metadata: uploadedImages.metadata,
					imageId: uploadedImages.imageId,
					type: uploadedImages.type,
					category: uploadedImages.category,
					width: uploadedImages.width,
					height: uploadedImages.height,
					createdAt: uploadedImages.createdAt,
					updatedAt: uploadedImages.updatedAt,
				})
				.from(uploadedImages)
				.where(eq(uploadedImages.id, id))
				.limit(1);

			if (imageQuery.length === 0) {
				return null;
			}

			const image = imageQuery[0];

			// Transformar usando el transformer
			const entity = fromDB(image);
			const result = {
				id: entity.id,
				name: entity.name,
				path: entity.path,
				type: entity.type as UploadedImageType,
				category: entity.category || '',
				hash: entity.hash,
				imageId: entity.imageId,
				size: entity.size,
				width: entity.width || 0,
				height: entity.height || 0,
				metadata: entity.metadata ? JSON.parse(entity.metadata) : null,
				dimensions: entity.dimensions,
				url: entity.url,
				thumbnailUrl: entity.thumbnailUrl,
				createdAt: entity.createdAt,
				updatedAt: entity.updatedAt,
			} as UploadedImageResult;

			return result;
		} catch (error) {
			uploadedImagesLogger.error('Error obteniendo imagen subida por ID:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al obtener la imagen subida',
				context: { id },
				serviceName: SERVICE_NAME,
			});
		}
	}

	public async getImageStats(): Promise<UploadedImageStats> {
		try {
			uploadedImagesLogger.info('📊 Calculando estadísticas de imágenes subidas');

			// Contar el número total de imágenes
			const totalResult = await db.select({ count: count(uploadedImages.id) }).from(uploadedImages);

			// Obtener todas las imágenes para calcular estadísticas
			const allImages = await db
				.select({
					type: uploadedImages.type,
					size: uploadedImages.size,
				})
				.from(uploadedImages);

			// Calcular estadísticas por tipo
			const stats: Record<string, number> = {};
			let totalSize = 0;

			for (const image of allImages) {
				const type = image.type || 'unknown';
				stats[type] = (stats[type] || 0) + 1;
				totalSize += image.size || 0;
			}

			uploadedImagesLogger.info('✅ Estadísticas calculadas');

			const averageSize = totalResult[0].count > 0 ? totalSize / totalResult[0].count : 0;

			return {
				total: totalResult[0].count,
				byType: stats as Record<UploadedImageType, number>,
				totalSize,
				averageSize,
			};
		} catch (error) {
			uploadedImagesLogger.error('❌ Error al obtener estadísticas:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al obtener estadísticas de imágenes subidas',
				context: {},
				serviceName: SERVICE_NAME,
			});
		}
	}

	// Procesar imagen
	private async processImage(
		path: string,
		options: UploadedImageProcessingOptions
	): Promise<{ path: string; metadata: UploadedImageMetadata }> {
		try {
			return await processUploadedImage(path, options);
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al procesar la imagen',
				context: { path, options },
				serviceName: SERVICE_NAME,
			});
		}
	}

	// Eliminar archivo de imagen
	private async deleteImageFile(path: string): Promise<void> {
		try {
			// Aquí se implementaría la lógica real para eliminar el archivo
			// Por ahora, solo simularemos esta operación
			uploadedImagesLogger.info('Simulando eliminación de archivo:', path);

			// Si necesitáramos verificar que el archivo existe:
			// if (!fileExists(path)) {
			//     throw createFileNotFoundError(path, {}, SERVICE_NAME);
			// }
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al eliminar archivo de imagen',
				context: { path },
				serviceName: SERVICE_NAME,
			});
		}
	}
}

export const uploadedImagesService = UploadedImagesService.getInstance();
