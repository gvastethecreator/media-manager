import { processImage } from '@/lib/image-processing';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromDB, transformUploadedImage } from '@/transformers/uploaded-image';
import type { UploadedImageType } from '@/types/entities/uploaded-image';
import type {
    CreateUploadedImageParams,
    GetUploadedImagesParams,
    UpdateUploadedImageParams,
    UploadedImageDimensions,
    UploadedImageEvents,
    UploadedImageMetadata,
    UploadedImageProcessingOptions,
    UploadedImageResult,
    UploadedImageResults,
    UploadedImageStats
} from '@/types/uploaded-images';
import {
    ServiceErrorCode,
    createEntityNotFoundError,
    toServiceError
} from '@/utils/errors/service-errors';

const SERVICE_NAME = 'UploadedImagesService';
const uploadedImagesLogger = serverLogger.withContext(SERVICE_NAME);

interface WhereClause {
	type?: UploadedImageType;
	category?: string;
	size?: {
		gte?: number;
		lte?: number;
	};
	width?: {
		gte?: number;
		lte?: number;
	};
	height?: {
		gte?: number;
		lte?: number;
	};
	OR?: Array<
		| {
				name: { contains: string; mode: 'insensitive' };
		  }
		| {
				category: { contains: string; mode: 'insensitive' };
		  }
	>;
}

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

			// Crear la imagen en la base de datos
			const image = await prisma.uploadedImage.create({
				data: {
					name,
					path,
					type,
					category,
					size,
					width,
					height,
					metadata: processedMetadata ? JSON.stringify(processedMetadata) : null,
				},
			});

			// Usar el transformer para convertir el registro a la respuesta
			const entity = fromDB(image);
			const result = transformUploadedImage(entity);

			// Emitir evento de creación
			await this.emitEvent(this.EVENTS.IMAGE_CREATED, result);
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'create', image: result });

			return result;
		} catch (error) {
			// Usar el nuevo sistema de manejo de errores
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al crear imagen subida',
				serviceName: SERVICE_NAME
			});
		}
	}

	public async updateImage(id: string, params: UpdateUploadedImageParams): Promise<UploadedImageResult> {
		try {
			// Verificar que la imagen existe
			const existingImage = await prisma.uploadedImage.findUnique({
				where: { id },
			});

			if (!existingImage) {
				throw createEntityNotFoundError('UploadedImage', id, SERVICE_NAME);
			}

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

			// Actualizar la imagen en la base de datos
			const image = await prisma.uploadedImage.update({
				where: { id },
				data: {
					name: name ?? existingImage.name,
					path: imagePath,
					type: type ?? existingImage.type,
					category: category ?? existingImage.category,
					size: imageSize,
					width: imageWidth,
					height: imageHeight,
					metadata: Object.keys(updatedMetadata).length > 0 ? JSON.stringify(updatedMetadata) : null,
				},
			});

			// Usar el transformer para convertir el registro a la respuesta
			const entity = fromDB(image);
			const result = transformUploadedImage(entity);

			// Emitir evento de actualización
			await this.emitEvent(this.EVENTS.IMAGE_UPDATED, result);
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'update', image: result });

			return result;
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al actualizar imagen subida',
				context: { id, params },
				serviceName: SERVICE_NAME
			});
		}
	}

	public async deleteImage(id: string): Promise<void> {
		try {
			// Verificar que la imagen existe
			const image = await prisma.uploadedImage.findUnique({
				where: { id },
			});

			if (!image) {
				throw createEntityNotFoundError('UploadedImage', id, SERVICE_NAME);
			}

			// Eliminar el archivo físico
			await this.deleteImageFile(image.path);

			// Eliminar la entrada de la base de datos
			await prisma.uploadedImage.delete({
				where: { id },
			});

			// Emitir evento de eliminación
			await this.emitEvent(this.EVENTS.IMAGE_DELETED, { id });
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { action: 'delete', id });
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al eliminar imagen subida',
				context: { id },
				serviceName: SERVICE_NAME
			});
		}
	}

	public async getImages(params: GetUploadedImagesParams = {}): Promise<UploadedImageResults> {
		try {
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

			// Construir la cláusula where para el filtrado
			const where: WhereClause = {};

			if (type) {
				where.type = type;
			}

			if (category) {
				where.category = category;
			}

			// Filtrar por tamaño
			if (minSize || maxSize) {
				where.size = {};
				if (minSize) {
					where.size.gte = minSize;
				}
				if (maxSize) {
					where.size.lte = maxSize;
				}
			}

			// Filtrar por dimensiones
			if (minWidth || maxWidth) {
				where.width = {};
				if (minWidth) {
					where.width.gte = minWidth;
				}
				if (maxWidth) {
					where.width.lte = maxWidth;
				}
			}

			if (minHeight || maxHeight) {
				where.height = {};
				if (minHeight) {
					where.height.gte = minHeight;
				}
				if (maxHeight) {
					where.height.lte = maxHeight;
				}
			}

			// Búsqueda por nombre o categoría
			if (search) {
				where.OR = [
					{
						name: { contains: search, mode: 'insensitive' },
					},
					{
						category: { contains: search, mode: 'insensitive' },
					},
				];
			}

			// Calcular el número total de imágenes que coinciden con los filtros
			const total = await prisma.uploadedImage.count({ where });

			// Obtener las imágenes paginadas
			const rawImages = await prisma.uploadedImage.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: (page - 1) * pageSize,
				take: pageSize,
			});

			// Transformar los resultados usando el transformer
			const items = rawImages.map((image) => {
				const entity = fromDB(image);
				return transformUploadedImage(entity);
			});

			// Obtener estadísticas si se incluyen en la respuesta
			const stats = await this.getImageStats();

			return {
				items,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al obtener imágenes subidas',
				context: { params },
				serviceName: SERVICE_NAME
			});
		}
	}

	public async getImageStats(): Promise<UploadedImageStats> {
		try {
			// Contar el número total de imágenes
			const total = await prisma.uploadedImage.count();

			// Agrupar por tipo
			const byType = await prisma.uploadedImage.groupBy({
				by: ['type'],
				_count: {
					type: true,
				},
				_sum: {
					size: true,
				},
			});

			// Calcular el tamaño total
			const totalSize = byType.reduce((sum, item) => sum + (item._sum?.size || 0), 0);

			// Convertir a formato de respuesta
			const stats: Record<UploadedImageType, number> = {} as Record<UploadedImageType, number>;

			for (const item of byType) {
				stats[item.type as UploadedImageType] = item._count.type;
			}

			return {
				total,
				byType: stats,
				totalSize,
				averageSize: total > 0 ? totalSize / total : 0,
			};
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.UNEXPECTED_ERROR,
				message: 'Error al obtener estadísticas de imágenes',
				serviceName: SERVICE_NAME
			});
		}
	}

	// Calcular dimensiones con proporción de aspecto
	private calculateDimensions(
		width: number,
		height: number,
		targetDimensions?: UploadedImageDimensions
	): UploadedImageDimensions {
		// Calcular la proporción de aspecto
		const aspectRatio = width / height;

		// Si no hay dimensiones objetivo, devolver las dimensiones originales
		if (!targetDimensions) {
			return {
				width,
				height,
				aspectRatio,
			};
		}

		const { width: targetWidth, height: targetHeight } = targetDimensions;

		// Si solo se especifica una dimensión, calcular la otra manteniendo la proporción
		if (targetWidth && !targetHeight) {
			return {
				width: targetWidth,
				height: Math.round(targetWidth / aspectRatio),
				aspectRatio,
			};
		}

		if (targetHeight && !targetWidth) {
			return {
				width: Math.round(targetHeight * aspectRatio),
				height: targetHeight,
				aspectRatio,
			};
		}

		// Si se especifican ambas dimensiones, devolver esas dimensiones
		if (targetWidth && targetHeight) {
			return {
				width: targetWidth,
				height: targetHeight,
				aspectRatio: targetWidth / targetHeight,
			};
		}

		// Caso por defecto: devolver las dimensiones originales
		return {
			width,
			height,
			aspectRatio,
		};
	}

	// Procesar imagen
	private async processImage(
		path: string,
		options: UploadedImageProcessingOptions
	): Promise<{ path: string; metadata: UploadedImageMetadata }> {
		try {
			return await processImage(path, options);
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al procesar la imagen',
				context: { path, options },
				serviceName: SERVICE_NAME
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
				serviceName: SERVICE_NAME
			});
		}
	}

	// Obtener URL de imagen
	private getImageUrl(path: string): string {
		// En una implementación real, esto podría ser una URL completa a un CDN o servidor de archivos
		return `/api/images/${encodeURIComponent(path)}`;
	}

	// Obtener URL de miniatura
	private getThumbnailUrl(path: string): string {
		return `/api/images/thumbnails/${encodeURIComponent(path)}`;
	}
}

export const uploadedImagesService = UploadedImagesService.getInstance();
