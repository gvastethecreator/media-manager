import type { Album as PrismaAlbum } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { eventsService, type EventData } from './events.service'

const albumLogger = logger.withContext('AlbumService')

export interface AlbumCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: string
}

export interface AlbumUpdate extends Partial<AlbumCreate> {
  id: string
}

export interface AlbumWithStats extends PrismaAlbum {
  _count: {
    images: number
  }
  totalSize: number
}

export interface AlbumWithImages extends AlbumWithStats {
  images: FileItem[]
}

class AlbumService {
  async getAlbums(): Promise<AlbumWithStats[]> {
    try {
      albumLogger.info('📔 Obteniendo lista de álbumes')
      const albums = await prisma.album.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const albumsWithStats = await Promise.all(
        albums.map(async (album) => {
          const totalSize = await prisma.image.aggregate({
            where: { albums: { some: { id: album.id } } },
            _sum: { size: true }
          })

          return {
            ...album,
            totalSize: totalSize._sum?.size || 0
          }
        })
      )

      albumLogger.info(`✅ ${albums.length} álbumes obtenidos`)
      return albumsWithStats
    } catch (error) {
      albumLogger.error('❌ Error al obtener álbumes:', error)
      throw error
    }
  }

  async getAlbum(id: string): Promise<AlbumWithStats | null> {
    try {
      albumLogger.info('🔍 Obteniendo álbum:', id)
      const album = await prisma.album.findUnique({
        where: { id },
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      if (!album) return null

      const totalSize = await prisma.image.aggregate({
        where: { albums: { some: { id } } },
        _sum: { size: true }
      })

      const albumWithStats = {
        ...album,
        totalSize: totalSize._sum?.size || 0
      }

      albumLogger.info('✅ Álbum obtenido:', album.name)
      return albumWithStats
    } catch (error) {
      albumLogger.error('❌ Error al obtener álbum:', error)
      throw error
    }
  }

  async createAlbum(data: AlbumCreate): Promise<AlbumWithStats> {
    try {
      albumLogger.info('➕ Creando álbum:', data)
      const album = await prisma.album.create({
        data: {
          ...data,
          emoji: data.emoji || '📸',
          color: data.color || '#3b82f6',
          sortBy: data.sortBy || 'name',
          filters: data.filters || '[]'
        },
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const albumWithStats = {
        ...album,
        totalSize: 0
      }

      albumLogger.info('✅ Álbum creado:', album.name)
      const eventData: EventData = { type: 'create', id: album.id }
      eventsService.emit('albums:modified', eventData)
      return albumWithStats
    } catch (error) {
      albumLogger.error('❌ Error al crear álbum:', error)
      throw error
    }
  }

  async updateAlbum(id: string, data: AlbumUpdate): Promise<AlbumWithStats> {
    try {
      albumLogger.info('📝 Actualizando álbum:', { id, data })
      const album = await prisma.album.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { images: true }
          }
        }
      })

      const totalSize = await prisma.image.aggregate({
        where: { albums: { some: { id } } },
        _sum: { size: true }
      })

      const albumWithStats = {
        ...album,
        totalSize: totalSize._sum?.size || 0
      }

      albumLogger.info('✅ Álbum actualizado:', album.name)
      const eventData: EventData = { type: 'update', id }
      eventsService.emit('albums:modified', eventData)
      return albumWithStats
    } catch (error) {
      albumLogger.error('❌ Error al actualizar álbum:', error)
      throw error
    }
  }

  async deleteAlbum(id: string): Promise<void> {
    try {
      albumLogger.info('🗑️ Eliminando álbum:', id)
      await prisma.album.delete({
        where: { id }
      })
      albumLogger.info('✅ Álbum eliminado:', id)
      const eventData: EventData = { type: 'delete', id }
      eventsService.emit('albums:modified', eventData)
    } catch (error) {
      albumLogger.error('❌ Error al eliminar álbum:', error)
      throw error
    }
  }

  async addImageToAlbum(albumId: string, fileId: string) {
    try {
      await prisma.album.update({
        where: { id: albumId },
        data: {
          images: {
            connect: { id: fileId }
          }
        }
      })

      albumLogger.info('✨ Imagen agregada al álbum:', {
        albumId,
        fileId,
      })

      const eventData: EventData = { type: 'addImage', objectId: albumId, imageId: fileId }
      eventsService.emit('albums:modified', eventData)
    } catch (error) {
      albumLogger.error('❌ Error al agregar imagen al álbum:', {
        error,
        albumId,
        fileId,
      })
      throw error
    }
  }

  async removeImageFromAlbum(albumId: string, fileId: string): Promise<void> {
    try {
      await prisma.album.update({
        where: { id: albumId },
        data: {
          images: {
            disconnect: { id: fileId }
          }
        }
      })
      albumLogger.info('🗑️ Imagen eliminada del álbum:', { albumId, fileId })
      const eventData: EventData = { type: 'removeImage', objectId: albumId, imageId: fileId }
      eventsService.emit('albums:modified', eventData)
    } catch (error) {
      albumLogger.error('❌ Error al eliminar imagen del álbum:', error)
      throw error
    }
  }

  async getAlbumImages(id: string): Promise<FileItem[]> {
    try {
      const images = await prisma.image.findMany({
        where: {
          albums: {
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
      albumLogger.error('❌ Error al obtener imágenes del álbum:', error)
      throw error
    }
  }
}

export const albumService = new AlbumService()
export const { addImageToAlbum } = albumService