import { prisma } from '@/lib/prisma'
import type { Object as PrismaObject } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { eventsService, type EventData } from './events.service'

const objectLogger = logger.withContext('ObjectService')

export interface ObjectCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  type?: string
  rarity?: string
  properties?: string
  requirements?: string
  origin?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface ObjectUpdate extends Partial<ObjectCreate> {
  id: string
}

export interface ObjectWithStats extends PrismaObject {
  _count: {
    images: number
  }
  totalSize: number
}

class ObjectService {
  async getObjects(): Promise<ObjectWithStats[]> {
    try {
      objectLogger.info('🔍 Buscando objetos...')
      const objects = await prisma.object.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

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

      objectLogger.info('✅ Objetos obtenidos correctamente:', { count: objects.length })
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
      objectLogger.error('❌ Error al obtener objeto:', error)
      throw error
    }
  }

  async createObject(data: ObjectCreate): Promise<ObjectWithStats> {
    try {
      const objectData = {
        ...data,
        emoji: data.emoji || '🎯',
        color: data.color || '#3b82f6',
        type: data.type || 'misc',
        rarity: data.rarity || 'common',
        properties: data.properties || '[]',
        requirements: data.requirements || '{}',
        origin: data.origin || '',
        stats: data.stats || '{}',
        sortBy: data.sortBy || 'name',
        filters: data.filters || '[]'
      }

      const object = await prisma.object.create({
        data: objectData,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const objectWithStats = {
        ...object,
        totalSize: 0
      }

      objectLogger.info('✨ Objeto creado:', object)
      const eventData: EventData = { type: 'create', id: object.id }
      eventsService.emit('objects:modified', eventData)
      return objectWithStats
    } catch (error) {
      objectLogger.error('❌ Error al crear objeto:', error)
      throw error
    }
  }

  async updateObject(id: string, data: ObjectUpdate): Promise<ObjectWithStats> {
    try {
      const object = await prisma.object.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const totalSize = await prisma.image.aggregate({
        where: { objects: { some: { id } } },
        _sum: { size: true }
      })

      const objectWithStats = {
        ...object,
        totalSize: totalSize._sum?.size || 0
      }

      objectLogger.info('📝 Objeto actualizado:', { id, data })
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('objects:modified', eventData)
      return objectWithStats
    } catch (error) {
      objectLogger.error('❌ Error al actualizar objeto:', error)
      throw error
    }
  }

  async deleteObject(id: string): Promise<void> {
    try {
      await prisma.object.delete({
        where: { id }
      })
      objectLogger.info('🗑️ Objeto eliminado:', id)
      const eventData: EventData = { type: 'delete', id }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al eliminar objeto:', error)
      throw error
    }
  }

  async addImageToObject(objectId: string, fileId: string) {
    try {
      await prisma.object.update({
        where: { id: objectId },
        data: {
          images: {
            connect: { id: fileId }
          }
        }
      })

      objectLogger.info('✨ Imagen agregada al objeto:', {
        objectId,
        fileId,
      })

      const eventData: EventData = { type: 'addImage', objectId, imageId: fileId }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al agregar imagen al objeto:', {
        error,
        objectId,
        fileId,
      })
      throw error
    }
  }

  async removeImageFromObject(objectId: string, fileId: string): Promise<void> {
    try {
      await prisma.object.update({
        where: { id: objectId },
        data: {
          images: {
            disconnect: { id: fileId }
          }
        }
      })
      objectLogger.info('🗑️ Imagen eliminada del objeto:', { objectId, fileId })
      const eventData: EventData = { type: 'removeImage', objectId, imageId: fileId }
      eventsService.emit('objects:modified', eventData)
    } catch (error) {
      objectLogger.error('❌ Error al eliminar imagen del objeto:', error)
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
          collections: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          albums: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          characters: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          places: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          objects: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          }
        }
      })

      return images.map(image => {
        const metadata = image.metadata ? JSON.parse(image.metadata as string) : undefined
        return {
          id: image.id,
          name: image.name,
          path: image.path,
          type: 'image',
          mimeType: metadata?.mimeType,
          size: image.size,
          width: image.width || undefined,
          height: image.height || undefined,
          metadata,
          thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : undefined,
          thumbnailSize: image.thumbnailSize || undefined,
          thumbnailWidth: image.thumbnailWidth || undefined,
          thumbnailHeight: image.thumbnailHeight || undefined,
          isFavorite: image.isFavorite || false,
          isPublic: image.isPublic || false,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString(),
          collections: image.collections,
          tags: image.tags,
          albums: image.albums,
          characters: image.characters,
          places: image.places,
          objects: image.objects
        }
      })
    } catch (error) {
      objectLogger.error('❌ Error al obtener imágenes del objeto:', error)
      throw error
    }
  }
}

export const objectService = new ObjectService()
export const { addImageToObject } = objectService