import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EventEmitter } from 'events'
import type {
  SystemImageMetadata,
  SystemImageDimensions,
  SystemImageStats,
  SystemImageFilters,
  SystemImageResult,
  SystemImageResults,
  CreateSystemImageParams,
  UpdateSystemImageParams,
  GetSystemImagesParams,
  SystemImageEvents,
  SystemImageProcessingOptions,
} from '@/types/system-images'
import { SystemImageType } from '@/types/entities'
import { processImage } from '@/lib/image-processing'

const systemImagesLogger = logger.withContext('SystemImagesService')

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
  OR?: Array<{
    name: { contains: string; mode: 'insensitive' };
  } | {
    category: { contains: string; mode: 'insensitive' };
  }>;
}

class SystemImagesService extends EventEmitter {
  private static instance: SystemImagesService
  private readonly EVENTS: SystemImageEvents = {
    IMAGE_CREATED: 'system-image:created',
    IMAGE_UPDATED: 'system-image:updated',
    IMAGE_DELETED: 'system-image:deleted',
    IMAGES_CHANGED: 'system-images:changed',
  }

  private constructor() {
    super()
  }

  public static getInstance(): SystemImagesService {
    if (!SystemImagesService.instance) {
      SystemImagesService.instance = new SystemImagesService()
    }
    return SystemImagesService.instance
  }

  public async createImage(params: CreateSystemImageParams): Promise<SystemImageResult> {
    try {
      const {
        name,
        file,
        type,
        category,
        dimensions,
        metadata = {},
        processingOptions,
      } = params

      // Procesar imagen si se especifican opciones
      let processedPath = file.path
      let processedMetadata: SystemImageMetadata = metadata
      if (processingOptions) {
        const processed = await this.processImage(file.path, processingOptions)
        processedPath = processed.path
        processedMetadata = {
          ...metadata,
          ...processed.metadata,
        }
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
      })

      // Calcular dimensiones
      const calculatedDimensions = this.calculateDimensions(dimensions.width, dimensions.height)

      // Emitir eventos
      this.emit(this.EVENTS.IMAGE_CREATED, image)
      this.emit(this.EVENTS.IMAGES_CHANGED)

      return {
        ...image,
        type: image.type as SystemImageType,
        dimensions: calculatedDimensions,
        url: this.getImageUrl(image.path),
        thumbnailUrl: this.getThumbnailUrl(image.path),
        metadata: processedMetadata,
      }
    } catch (error) {
      systemImagesLogger.error('Error creating system image:', { params, error })
      throw new Error('Error al crear imagen del sistema')
    }
  }

  public async updateImage(
    id: string,
    params: UpdateSystemImageParams
  ): Promise<SystemImageResult> {
    try {
      const {
        name,
        file,
        type,
        category,
        dimensions,
        metadata,
        processingOptions,
      } = params

      // Obtener imagen actual
      const currentImage = await prisma.systemImage.findUnique({
        where: { id },
      })

      if (!currentImage) {
        throw new Error('Imagen no encontrada')
      }

      // Procesar nueva imagen si se proporciona
      let processedPath = file ? file.path : currentImage.path
      let processedMetadata = metadata ? metadata : JSON.parse(currentImage.metadata || '{}')
      if (file && processingOptions) {
        const processed = await this.processImage(file.path, processingOptions)
        processedPath = processed.path
        processedMetadata = {
          ...processedMetadata,
          ...processed.metadata,
        }
      }

      // Actualizar imagen
      const image = await prisma.systemImage.update({
        where: { id },
        data: {
          name: name || currentImage.name,
          path: processedPath,
          type: type || currentImage.type,
          category: category || currentImage.category,
          size: file?.size || currentImage.size,
          width: dimensions?.width || currentImage.width,
          height: dimensions?.height || currentImage.height,
          metadata: JSON.stringify(processedMetadata),
        },
      })

      // Calcular dimensiones
      const calculatedDimensions = this.calculateDimensions(
        dimensions?.width || currentImage.width,
        dimensions?.height || currentImage.height
      )

      // Emitir eventos
      this.emit(this.EVENTS.IMAGE_UPDATED, image)
      this.emit(this.EVENTS.IMAGES_CHANGED)

      return {
        ...image,
        type: image.type as SystemImageType,
        dimensions: calculatedDimensions,
        url: this.getImageUrl(image.path),
        thumbnailUrl: this.getThumbnailUrl(image.path),
        metadata: processedMetadata,
      }
    } catch (error) {
      systemImagesLogger.error('Error updating system image:', { id, params, error })
      throw new Error('Error al actualizar imagen del sistema')
    }
  }

  public async deleteImage(id: string): Promise<void> {
    try {
      // Obtener imagen
      const image = await prisma.systemImage.findUnique({
        where: { id },
      })

      if (!image) {
        throw new Error('Imagen no encontrada')
      }

      // Eliminar archivo físico
      await this.deleteImageFile(image.path)

      // Eliminar registro
      await prisma.systemImage.delete({
        where: { id },
      })

      // Emitir eventos
      this.emit(this.EVENTS.IMAGE_DELETED, image)
      this.emit(this.EVENTS.IMAGES_CHANGED)
    } catch (error) {
      systemImagesLogger.error('Error deleting system image:', { id, error })
      throw new Error('Error al eliminar imagen del sistema')
    }
  }

  public async getImages(params: GetSystemImagesParams = {}): Promise<SystemImageResults> {
    try {
      const {
        filters = {},
        targetDimensions,
      } = params

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
      } = filters

      // Construir where
      const where: WhereClause = {}
      if (type) where.type = type
      if (category) where.category = category
      if (minSize || maxSize) {
        where.size = {}
        if (minSize) where.size.gte = minSize
        if (maxSize) where.size.lte = maxSize
      }
      if (minWidth || maxWidth) {
        where.width = {}
        if (minWidth) where.width.gte = minWidth
        if (maxWidth) where.width.lte = maxWidth
      }
      if (minHeight || maxHeight) {
        where.height = {}
        if (minHeight) where.height.gte = minHeight
        if (maxHeight) where.height.lte = maxHeight
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Obtener total
      const total = await prisma.systemImage.count({ where })

      // Obtener imágenes
      const rawImages = await prisma.systemImage.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: page * pageSize,
        take: pageSize,
      })

      // Obtener estadísticas
      const stats = await this.getImageStats()

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
      }))

      return {
        items,
        total,
        page,
        pageSize,
        stats,
      }
    } catch (error) {
      systemImagesLogger.error('Error getting system images:', { params, error })
      throw new Error('Error al obtener imágenes del sistema')
    }
  }

  public async getImageStats(): Promise<SystemImageStats> {
    try {
      const total = await prisma.systemImage.count()
      const byType = await prisma.systemImage.groupBy({
        by: ['type'],
        _count: true,
        _sum: {
          size: true,
        },
      })

      const stats: Record<SystemImageType, number> = {} as Record<SystemImageType, number>
      let totalSize = 0
      byType.forEach((item) => {
        stats[item.type as SystemImageType] = item._count
        totalSize += item._sum.size || 0
      })

      return {
        total,
        byType: stats,
        totalSize,
        averageSize: total > 0 ? totalSize / total : 0,
      }
    } catch (error) {
      systemImagesLogger.error('Error getting image stats:', error)
      throw new Error('Error al obtener estadísticas de imágenes')
    }
  }

  private calculateDimensions(
    width: number,
    height: number,
    targetDimensions?: SystemImageDimensions
  ): SystemImageDimensions {
    const aspectRatio = width / height

    if (targetDimensions) {
      const { width: targetWidth, height: targetHeight } = targetDimensions
      if (targetWidth && targetHeight) {
        return {
          width: targetWidth,
          height: targetHeight,
          aspectRatio,
        }
      } else if (targetWidth) {
        return {
          width: targetWidth,
          height: Math.round(targetWidth / aspectRatio),
          aspectRatio,
        }
      } else if (targetHeight) {
        return {
          width: Math.round(targetHeight * aspectRatio),
          height: targetHeight,
          aspectRatio,
        }
      }
    }

    return {
      width,
      height,
      aspectRatio,
    }
  }

  private async processImage(
    path: string,
    options: SystemImageProcessingOptions
  ): Promise<{ path: string; metadata: SystemImageMetadata }> {
    try {
      return await processImage(path, options)
    } catch (error) {
      systemImagesLogger.error('Error processing image:', { path, options, error })
      throw new Error('Error al procesar imagen')
    }
  }

  private async deleteImageFile(path: string): Promise<void> {
    try {
      // TODO: Implementar eliminación de archivo físico
    } catch (error) {
      systemImagesLogger.error('Error deleting image file:', { path, error })
      throw new Error('Error al eliminar archivo de imagen')
    }
  }

  private getImageUrl(path: string): string {
    // TODO: Implementar generación de URL
    return path
  }

  private getThumbnailUrl(path: string): string {
    // TODO: Implementar generación de URL de miniatura
    return path
  }
}

export const systemImagesService = SystemImagesService.getInstance()