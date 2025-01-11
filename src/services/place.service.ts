import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { eventsService, type EventData } from './events.service'
import type { FileItem } from '@/types/file-item'
import type { Place } from '@prisma/client'

const placeLogger = logger.withContext('PlaceService')

export interface PlaceCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
}

export interface PlaceUpdate {
  name?: string
  emoji?: string
  color?: string
  description?: string
}

export interface PlaceWithStats extends Place {
  _count: {
    images: number
  }
  totalSize: number
}

class PlaceService {
  async getPlaces(): Promise<PlaceWithStats[]> {
    try {
      const places = await prisma.place.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      // Calcular tamaño total de imágenes para cada lugar
      const placesWithStats = await Promise.all(
        places.map(async (place) => {
          const totalSize = await prisma.image.aggregate({
            where: { places: { some: { id: place.id } } },
            _sum: { size: true }
          })

          return {
            ...place,
            totalSize: totalSize._sum?.size || 0
          }
        })
      )

      placeLogger.info('📥 Lugares obtenidos:', { count: places.length })
      return placesWithStats
    } catch (error) {
      placeLogger.error('❌ Error al obtener lugares:', error)
      throw error
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
      throw error
    }
  }

  async createPlace(data: PlaceCreate): Promise<Place> {
    try {
      const place = await prisma.place.create({
        data
      })
      placeLogger.info('✨ Lugar creado:', { place })
      const eventData: EventData = { type: 'create', id: place.id }
      eventsService.emit('places:modified', eventData)
      return place
    } catch (error) {
      placeLogger.error('❌ Error al crear lugar:', { data, error })
      throw error
    }
  }

  async updatePlace(id: string, data: PlaceUpdate): Promise<Place> {
    try {
      const place = await prisma.place.update({
        where: { id },
        data
      })
      placeLogger.info('📝 Lugar actualizado:', { id, data })
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('places:modified', eventData)
      return place
    } catch (error) {
      placeLogger.error('❌ Error al actualizar lugar:', { id, data, error })
      throw error
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
      throw error
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
      throw error
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
      throw error
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
        thumbnail: image.thumbnail?.toString(),
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
      placeLogger.error('❌ Error al obtener imágenes de lugar:', { id, error })
      throw error
    }
  }
}

export const placeService = new PlaceService()