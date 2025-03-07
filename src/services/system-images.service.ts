import { processImage } from '@/lib/image-processing';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { SystemImageType } from '@/types/entities';
import type {
	CreateSystemImageParams,
	GetSystemImagesParams,
	SystemImageDimensions,
	SystemImageEvents,
	SystemImageFilters,
	SystemImageMetadata,
	SystemImageProcessingOptions,
	SystemImageResult,
	SystemImageResults,
	SystemImageStats,
	UpdateSystemImageParams,
} from '@/types/system-images';

const systemImagesLogger = logger.withContext('SystemImagesService');

interface WhereClause {
	type?: SystemImageType;
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

class SystemImagesService {
	private static instance: SystemImagesService;
	private readonly EVENTS: SystemImageEvents = {
		IMAGE_CREATED: 'system-image:created',
		IMAGE_UPDATED: 'system-image:updated',
		IMAGE_DELETED: 'system-image:deleted',
		IMAGES_CHANGED: 'system-images:changed',
	};

	private constructor() {
		// Ya no es necesario llamar a super()
	}

	public static getInstance(): SystemImagesService {
		if (!SystemImagesService.instance) {
			SystemImagesService.instance = new SystemImagesService();
		}
		return SystemImagesService.instance;
	}

	// Método privado para emitir eventos usando serverEvents
	private async emitEvent(event: string, data: unknown): Promise<void> {
		// Emitir con el nuevo sistema
		await emit({
			type: event,
			data,
		});
	}

	public async createImage(params: CreateSystemImageParams): Promise<SystemImageResult> {
		try {
			const { name, file, type, category, dimensions, metadata = {}, processingOptions } = params;

			// Procesar imagen si se especifican opciones
			let processedPath = file.path;
			let processedMetadata: SystemImageMetadata = metadata;
			if (processingOptions) {
				const processed = await this.processImage(file.path, processingOptions);
				processedPath = processed.path;
				processedMetadata = {
					...metadata,
					...processed.metadata,
				};
			}

			// Crear imagen en la base de datos
			const image = await prisma.systemImage.create({
				data: {
					name,
					path: processedPath,
					type,
					category,
					size: file.size,
					width: dimensions.width,
					height: dimensions.height,
					metadata: JSON.stringify(processedMetadata),
				},
			});

			// Calcular dimensiones
			const calculatedDimensions = this.calculateDimensions(dimensions.width, dimensions.height);

			// Emitir eventos con el nuevo sistema
			await this.emitEvent(this.EVENTS.IMAGE_CREATED, { id: image.id, type, category });
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { type, category });

			// Transformar y devolver resultado
			const result: SystemImageResult = {
				id: image.id,
				name: image.name,
				path: image.path,
				type: image.type as SystemImageType,
				category: image.category,
				size: image.size,
				width: image.width,
				height: image.height,
				url: this.getImageUrl(image.path),
				thumbnailUrl: this.getThumbnailUrl(image.path),
				dimensions: calculatedDimensions,
				metadata: JSON.parse(image.metadata || '{}'),
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
			};

			return result;
		} catch (error) {
			systemImagesLogger.error('Error creando imagen:', error);
			throw new Error(`Error creando imagen: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	public async updateImage(id: string, params: UpdateSystemImageParams): Promise<SystemImageResult> {
		try {
			const { name, type, category, dimensions, metadata } = params;

			// Buscar imagen existente
			const existingImage = await prisma.systemImage.findUnique({
				where: { id },
			});

			if (!existingImage) {
				throw new Error(`Imagen no encontrada: ${id}`);
			}

			// Datos a actualizar
			const updateData: Record<string, unknown> = {};

			if (name) {
				updateData.name = name;
			}

			if (type) {
				updateData.type = type;
			}

			if (category) {
				updateData.category = category;
			}

			if (dimensions) {
				if (dimensions.width) {
					updateData.width = dimensions.width;
				}
				if (dimensions.height) {
					updateData.height = dimensions.height;
				}
			}

			if (metadata) {
				const existingMetadata = JSON.parse(existingImage.metadata || '{}');
				updateData.metadata = JSON.stringify({
					...existingMetadata,
					...metadata,
				});
			}

			// Actualizar en base de datos
			const image = await prisma.systemImage.update({
				where: { id },
				data: updateData,
			});

			// Calcular dimensiones
			const calculatedDimensions = this.calculateDimensions(
				image.width,
				image.height,
				dimensions as SystemImageDimensions
			);

			// Emitir eventos con el nuevo sistema
			await this.emitEvent(this.EVENTS.IMAGE_UPDATED, { id, type, category });
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { type, category });

			return {
				id: image.id,
				name: image.name,
				path: image.path,
				type: image.type as SystemImageType,
				category: image.category,
				size: image.size,
				dimensions: calculatedDimensions,
				url: this.getImageUrl(image.path),
				thumbnailUrl: this.getThumbnailUrl(image.path),
				metadata: JSON.parse(image.metadata || '{}'),
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
			};
		} catch (error) {
			systemImagesLogger.error('Error updating system image:', { id, params, error });
			throw new Error('Error al actualizar imagen del sistema');
		}
	}

	public async deleteImage(id: string): Promise<void> {
		try {
			// Buscar imagen existente
			const image = await prisma.systemImage.findUnique({
				where: { id },
			});

			if (!image) {
				throw new Error(`Imagen no encontrada: ${id}`);
			}

			// Eliminar archivo físico
			if (image.path) {
				await this.deleteImageFile(image.path);
			}

			// Eliminar de la base de datos
			await prisma.systemImage.delete({
				where: { id },
			});

			// Emitir eventos con el nuevo sistema
			await this.emitEvent(this.EVENTS.IMAGE_DELETED, { id, type: image.type, category: image.category });
			await this.emitEvent(this.EVENTS.IMAGES_CHANGED, { type: image.type, category: image.category });
		} catch (error) {
			systemImagesLogger.error('Error deleting system image:', { id, error });
			throw new Error('Error al eliminar imagen del sistema');
		}
	}

	public async getImages(params: GetSystemImagesParams = {}): Promise<SystemImageResults> {
		try {
			const { filters = {}, targetDimensions } = params;

			const {
				type,
				category,
				minSize,
				maxSize,
				minWidth,
				maxWidth,
				minHeight,
				maxHeight,
				search,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				page = 0,
				pageSize = 50,
			} = filters;

			// Construir where
			const where: WhereClause = {};
			if (type) {
				where.type = type;
			}
			if (category) {
				where.category = category;
			}
			if (minSize || maxSize) {
				where.size = {};
				if (minSize) {
					where.size.gte = minSize;
				}
				if (maxSize) {
					where.size.lte = maxSize;
				}
			}
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
			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ category: { contains: search, mode: 'insensitive' } },
				];
			}

			// Obtener total
			const total = await prisma.systemImage.count({ where });

			// Obtener imágenes
			const rawImages = await prisma.systemImage.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getImageStats();

			// Procesar resultados
			const items = rawImages.map((image) => ({
				...image,
				type: image.type as SystemImageType,
				dimensions: targetDimensions
					? this.calculateDimensions(image.width, image.height, targetDimensions)
					: this.calculateDimensions(image.width, image.height),
				url: this.getImageUrl(image.path),
				thumbnailUrl: this.getThumbnailUrl(image.path),
				metadata: JSON.parse(image.metadata || '{}'),
			}));

			return {
				items,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			systemImagesLogger.error('Error getting system images:', { params, error });
			throw new Error('Error al obtener imágenes del sistema');
		}
	}

	public async getImageStats(): Promise<SystemImageStats> {
		try {
			const total = await prisma.systemImage.count();
			const byType = await prisma.systemImage.groupBy({
				by: ['type'],
				_count: true,
				_sum: {
					size: true,
				},
			});

			const stats: Record<SystemImageType, number> = {} as Record<SystemImageType, number>;
			let totalSize = 0;

			for (const item of byType) {
				stats[item.type as SystemImageType] = item._count;
				totalSize += item._sum.size || 0;
			}

			return {
				total,
				byType: stats,
				totalSize,
				averageSize: total > 0 ? totalSize / total : 0,
			};
		} catch (error) {
			systemImagesLogger.error('Error getting image stats:', error);
			throw new Error('Error al obtener estadísticas de imágenes');
		}
	}

	private calculateDimensions(
		width: number,
		height: number,
		targetDimensions?: SystemImageDimensions
	): SystemImageDimensions {
		const aspectRatio = width / height;

		if (targetDimensions) {
			const { width: targetWidth, height: targetHeight } = targetDimensions;
			if (targetWidth && targetHeight) {
				return {
					width: targetWidth,
					height: targetHeight,
					aspectRatio,
				};
			}
			if (targetWidth) {
				return {
					width: targetWidth,
					height: Math.round(targetWidth / aspectRatio),
					aspectRatio,
				};
			}
			if (targetHeight) {
				return {
					width: Math.round(targetHeight * aspectRatio),
					height: targetHeight,
					aspectRatio,
				};
			}
		}

		return {
			width,
			height,
			aspectRatio,
		};
	}

	private async processImage(
		path: string,
		options: SystemImageProcessingOptions
	): Promise<{ path: string; metadata: SystemImageMetadata }> {
		try {
			return await processImage(path, options);
		} catch (error) {
			systemImagesLogger.error('Error processing image:', { path, options, error });
			throw new Error('Error al procesar imagen');
		}
	}

	private async deleteImageFile(path: string): Promise<void> {
		// Solo log por ahora, ya que es un TODO
		systemImagesLogger.info('Simulando eliminación de archivo:', path);
		// TODO: Implementar eliminación real del archivo físico
		// La implementación futura podría ser algo como:
		// await fs.unlink(path);
	}

	private getImageUrl(path: string): string {
		// TODO: Implementar generación de URL
		return path;
	}

	private getThumbnailUrl(path: string): string {
		// TODO: Implementar generación de URL de miniatura
		return path;
	}
}

export const systemImagesService = SystemImagesService.getInstance();
