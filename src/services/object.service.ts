import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { eventsService, type CacheInvalidationEvent, type EventData, type EventType } from './events.service'
import type { FileItem } from '@/types/file-item'
import type { Object } from '@prisma/client'

const objectLogger = logger.withContext('ObjectService')

export interface ObjectCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
}

export interface ObjectUpdate {
  name?: string
  emoji?: string
  color?: string
  description?: string
}

export interface ObjectWithStats extends Object {
  _count: {
    images: number
  }
  totalSize: number
}

class ObjectService {
  async getObjects(): Promise<ObjectWithStats[]> {
    try {
      const objects = await prisma.object.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      // Calcular tamaño total de imágenes para cada objeto
      const objectsWithStats = await Promise.all(
        objects.map(async (object) => {
          const totalSize = await prisma.image.aggregate({
            where: { objects: { some: { id: object.id } } },
            _sum: { size: true }
          })

          return {
            ...object,
            totalSize: totalSize._sum?.size || 0
          }
        })
      )

      objectLogger.info('📥 Objetos obtenidos:', { count: objects.length })
      return objectsWithStats
    } catch (error) {
      objectLogger.error('❌ Error al obtener objetos:', error)
      throw error
    }
  }

  async getObject(id: string): Promise<ObjectWithStats | null> {
    try {
      const object = await prisma.object.findUnique({
        where: { id },
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      if (!object) return null

      const totalSize = await prisma.image.aggregate({
        where: { objects: { some: { id } } },
        _sum: { size: true }
      })

      return {
        ...object,
        totalSize: totalSize._sum?.size || 0
      }
    } catch (error) {
      objectLogger.error('❌ Error al obtener objeto:', { id, error })
      throw error
    }
  }

  async createObject(data: ObjectCreate): Promise<Object> {
    try {
      const object = await prisma.object.create({
        data
      })
      objectLogger.info('✨ Objeto creado:', { object })
      const eventData: EventData = { type: 'create', id: object.id }
      eventsService.emit('objects:modified', eventData)
      return object
    } catch (error) {
      objectLogger.error('❌ Error al crear objeto:', { data, error })
      throw error
    }
  }

  async updateObject(id: string, data: ObjectUpdate): Promise<Object> {
    try {
      const object = await prisma.object.update({
        where: { id },
        data
      })
      objectLogger.info('📝 Objeto actualizado:', { id, data })
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('objects:modified', eventData)
      return object
    } catch (error) {
      objectLogger.error('❌ Error al actualizar objeto:', { id, data, error })
      throw error
    }
  }

  async deleteObject(id: string): Promise<void> {
    try {
      await prisma.object.delete({
        where: { id }
      })
      objectLogger.info('🗑️ Objeto eliminado:', { id })
      const eventData: EventData = { type: 'delete', id }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al eliminar objeto:', { id, error })
      throw error
    }
  }

  async addImageToObject(objectId: string, imageId: string): Promise<void> {
    try {
      await prisma.object.update({
        where: { id: objectId },
        data: {
          images: {
            connect: { id: imageId }
          }
        }
      })
      objectLogger.info('📸 Imagen agregada a objeto:', { objectId, imageId })
      const eventData: EventData = { type: 'addImage', objectId, imageId }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al agregar imagen a objeto:', { objectId, imageId, error })
      throw error
    }
  }

  async removeImageFromObject(objectId: string, imageId: string): Promise<void> {
    try {
      await prisma.object.update({
        where: { id: objectId },
        data: {
          images: {
            disconnect: { id: imageId }
          }
        }
      })
      objectLogger.info('🗑️ Imagen eliminada de objeto:', { objectId, imageId })
      const eventData: EventData = { type: 'removeImage', objectId, imageId }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al eliminar imagen de objeto:', { objectId, imageId, error })
      throw error
    }
  }

  async getObjectImages(id: string): Promise<FileItem[]> {
    try {
      const images = await prisma.image.findMany({
        where: {
          objects: {
            some: { id }
          }
        },
        include: {
          tags: true,
          collections: true,
          characters: true,
          places: true,
          objects: true,
          activities: true,
          stats: true
        }
      })

      return images.map(image => ({
        id: image.id,
        name: image.name,
        path: image.path,
        type: 'image',
        mimeType: image.metadata ? JSON.parse(image.metadata).mimeType : undefined,
        size: image.size,
        width: image.width,
        height: image.height,
        metadata: image.metadata ? JSON.parse(image.metadata) : undefined,
        thumbnail: image.thumbnail,
        thumbnailSize: image.thumbnailSize || undefined,
        thumbnailWidth: image.thumbnailWidth || undefined,
        thumbnailHeight: image.thumbnailHeight || undefined,
        isFavorite: false, // TODO: Implementar
        isPublic: image.isPublic,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
        tags: image.tags,
        collections: image.collections,
        characters: image.characters,
        places: image.places,
        objects: image.objects,
        activities: image.activities.map(activity => ({
          ...activity,
          createdAt: activity.createdAt.toISOString()
        })),
        stats: image.stats ? {
          views: image.stats.views,
          downloads: image.stats.downloads,
          lastViewed: image.stats.lastViewed?.toISOString() || ''
        } : undefined
      }))
    } catch (error) {
      objectLogger.error('❌ Error al obtener imágenes de objeto:', { id, error })
      throw error
    }
  }
}

export const objectService = new ObjectService()