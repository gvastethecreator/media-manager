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

export interface ObjectUpdate {
  name?: string
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
      }).catch((error) => {
        objectLogger.error('❌ Error en prisma.object.findMany:', error)
        throw error
      })

      objectLogger.info('📊 Calculando estadísticas para', objects.length, 'objetos')
      const objectsWithStats = await Promise.all(
        objects.map(async (object) => {
          try {
            const totalSize = await prisma.image.aggregate({
              where: { objects: { some: { id: object.id } } },
              _sum: { size: true }
            })

            return {
              ...object,
              totalSize: totalSize._sum?.size || 0
            }
          } catch (error) {
            objectLogger.error('❌ Error al calcular estadísticas del objeto:', { objectId: object.id, error: error instanceof Error ? error.message : 'Error desconocido' })
            return {
              ...object,
              totalSize: 0
            }
          }
        })
      )

      objectLogger.info('✅ Objetos obtenidos correctamente:', { count: objects.length })
      return objectsWithStats
    } catch (error) {
      objectLogger.error('❌ Error al obtener objetos:', error instanceof Error ? { message: error.message, stack: error.stack } : error)
      throw new Error('Error al obtener los objetos: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      throw new Error('Error al obtener el objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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

      objectLogger.info('✨ Objeto creado:', { object })
      const eventData: EventData = { type: 'create', id: object.id }
      eventsService.emit('objects:modified', eventData)

      return {
        ...object,
        totalSize: 0
      }
    } catch (error) {
      objectLogger.error('❌ Error al crear objeto:', { data, error })
      throw new Error('Error al crear el objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      objectLogger.error('❌ Error al actualizar objeto:', { id, data, error })
      throw new Error('Error al actualizar el objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      throw new Error('Error al eliminar el objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      throw new Error('Error al agregar imagen al objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      throw new Error('Error al eliminar imagen del objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
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
      });

      return images.map(image => {
        const metadata = image.metadata ? JSON.parse(image.metadata as string) : undefined;
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
          characters: image.characters,
          places: image.places,
          objects: image.objects
        };
      });
    } catch (error) {
      objectLogger.error("❌ Error al obtener imágenes del objeto:", { error });
      throw new Error('Error al obtener imágenes del objeto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }
}

export const objectService = new ObjectService();