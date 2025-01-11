import { prisma } from '@/lib/prisma'
import type { Place as PrismaPlace } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { eventsService, type EventData } from './events.service'

const placeLogger = logger.withContext('PlaceService')

export interface PlaceCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  region?: string
  type?: string
  climate?: string
  population?: number
  government?: string
  dangers?: string
  resources?: string
  lore?: string
  history?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface PlaceUpdate {
  name?: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  region?: string
  type?: string
  climate?: string
  population?: number
  government?: string
  dangers?: string
  resources?: string
  lore?: string
  history?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface PlaceWithStats extends PrismaPlace {
  _count: {
    images: number
  }
  totalSize: number
}

class PlaceService {
  async getPlaces(): Promise<PlaceWithStats[]> {
    try {
      placeLogger.info('🔍 Buscando lugares...')
      const places = await prisma.place.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }).catch((error) => {
        placeLogger.error('❌ Error en prisma.place.findMany:', error)
        throw error
      })

      placeLogger.info('📊 Calculando estadísticas para', places.length, 'lugares')
      const placesWithStats = await Promise.all(
        places.map(async (place) => {
          try {
            const totalSize = await prisma.image.aggregate({
              where: { places: { some: { id: place.id } } },
              _sum: { size: true }
            })

            return {
              ...place,
              totalSize: totalSize._sum?.size || 0
            }
          } catch (error) {
            placeLogger.error('❌ Error al calcular estadísticas del lugar:', { placeId: place.id, error: error instanceof Error ? error.message : 'Error desconocido' })
            return {
              ...place,
              totalSize: 0
            }
          }
        })
      )

      placeLogger.info('✅ Lugares obtenidos correctamente:', { count: places.length })
      return placesWithStats
    } catch (error) {
      placeLogger.error('❌ Error al obtener lugares:', error instanceof Error ? { message: error.message, stack: error.stack } : error)
      throw new Error('Error al obtener los lugares: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async getPlace(id: string): Promise<PlaceWithStats | null> {
    try {
      const place = await prisma.place.findUnique({
        where: { id },
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      if (!place) return null

      const totalSize = await prisma.image.aggregate({
        where: { places: { some: { id } } },
        _sum: { size: true }
      })

      return {
        ...place,
        totalSize: totalSize._sum?.size || 0
      }
    } catch (error) {
      placeLogger.error('❌ Error al obtener lugar:', { id, error })
      throw new Error('Error al obtener el lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async createPlace(data: PlaceCreate): Promise<PlaceWithStats> {
    try {
      const placeData = {
        ...data,
        emoji: data.emoji || '📍',
        color: data.color || '#3b82f6',
        region: data.region || 'unknown',
        type: data.type || 'unknown',
        climate: data.climate || 'temperate',
        population: data.population || 0,
        government: data.government || 'unknown',
        dangers: data.dangers || '[]',
        resources: data.resources || '[]',
        lore: data.lore || '',
        history: data.history || '',
        stats: data.stats || '{}',
        sortBy: data.sortBy || 'name',
        filters: data.filters || '[]'
      }

      const place = await prisma.place.create({
        data: placeData,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      placeLogger.info('✨ Lugar creado:', { place })
      const eventData: EventData = { type: 'create', id: place.id }
      eventsService.emit('places:modified', eventData)

      return {
        ...place,
        totalSize: 0
      }
    } catch (error) {
      placeLogger.error('❌ Error al crear lugar:', { data, error })
      throw new Error('Error al crear el lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async updatePlace(id: string, data: PlaceUpdate): Promise<PlaceWithStats> {
    try {
      const place = await prisma.place.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const totalSize = await prisma.image.aggregate({
        where: { places: { some: { id } } },
        _sum: { size: true }
      })

      const placeWithStats = {
        ...place,
        totalSize: totalSize._sum?.size || 0
      }

      placeLogger.info('📝 Lugar actualizado:', { id, data })
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('places:modified', eventData)
      return placeWithStats
    } catch (error) {
      placeLogger.error('❌ Error al actualizar lugar:', { id, data, error })
      throw new Error('Error al actualizar el lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async deletePlace(id: string): Promise<void> {
    try {
      await prisma.place.delete({
        where: { id }
      })
      placeLogger.info('🗑️ Lugar eliminado:', { id })
      const eventData: EventData = { type: 'delete', id }
      eventsService.emit('places:modified', eventData)
    } catch (error) {
      placeLogger.error('❌ Error al eliminar lugar:', { id, error })
      throw new Error('Error al eliminar el lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async addImageToPlace(placeId: string, imageId: string): Promise<void> {
    try {
      await prisma.place.update({
        where: { id: placeId },
        data: {
          images: {
            connect: { id: imageId }
          }
        }
      })
      placeLogger.info('📸 Imagen agregada a lugar:', { placeId, imageId })
      const eventData: EventData = { type: 'addImage', objectId: placeId, imageId }
      eventsService.emit('places:modified', eventData)
    } catch (error) {
      placeLogger.error('❌ Error al agregar imagen a lugar:', { placeId, imageId, error })
      throw new Error('Error al agregar imagen al lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async removeImageFromPlace(placeId: string, imageId: string): Promise<void> {
    try {
      await prisma.place.update({
        where: { id: placeId },
        data: {
          images: {
            disconnect: { id: imageId }
          }
        }
      })
      placeLogger.info('🗑️ Imagen eliminada de lugar:', { placeId, imageId })
      const eventData: EventData = { type: 'removeImage', objectId: placeId, imageId }
      eventsService.emit('places:modified', eventData)
    } catch (error) {
      placeLogger.error('❌ Error al eliminar imagen de lugar:', { placeId, imageId, error })
      throw new Error('Error al eliminar imagen del lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  async getPlaceImages(id: string): Promise<FileItem[]> {
    try {
      const images = await prisma.image.findMany({
        where: {
          places: {
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
      placeLogger.error("❌ Error al obtener imágenes del lugar:", { error });
      throw new Error('Error al obtener imágenes del lugar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }
}

export const placeService = new PlaceService();