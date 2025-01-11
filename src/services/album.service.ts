import type { Album as PrismaAlbum } from '@prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'

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

export interface AlbumWithStats {
  id: string
  name: string
  emoji: string
  description: string | null
  color: string
  shortcut: string | null
  sortBy: string
  filters: string
  createdAt: Date
  updatedAt: Date
  count: number
  size: string
}

export interface AlbumWithImages extends AlbumWithStats {
  images: FileItem[]
}

export const albumService = {
  async getAlbums(): Promise<AlbumWithStats[]> {
    try {
      albumLogger.info('📔 Obteniendo lista de álbumes')
      const response = await fetch('/api/albums')
      if (!response.ok) {
        throw new Error('Failed to fetch albums')
      }
      const albums = await response.json()
      albumLogger.info(`✅ ${albums.length} álbumes obtenidos`)
      return albums
    } catch (error) {
      albumLogger.error('❌ Error al obtener álbumes:', error)
      throw error
    }
  },

  async getAlbum(id: string): Promise<AlbumWithStats | null> {
    try {
      albumLogger.info('🔍 Obteniendo álbum:', id)
      const response = await fetch(`/api/albums/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch album')
      }
      const album = await response.json()
      albumLogger.info('✅ Álbum obtenido:', album.name)
      return album
    } catch (error) {
      albumLogger.error('❌ Error al obtener álbum:', error)
      throw error
    }
  },

  async createAlbum(data: AlbumCreate): Promise<AlbumWithStats> {
    try {
      albumLogger.info('➕ Creando álbum:', data)
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create album')
      }

      const album = await response.json()
      albumLogger.info('✅ Álbum creado:', album.name)
      return album
    } catch (error) {
      albumLogger.error('❌ Error al crear álbum:', error)
      throw error
    }
  },

  async updateAlbum(id: string, data: AlbumUpdate): Promise<AlbumWithStats> {
    try {
      albumLogger.info('📝 Actualizando álbum:', { id, data })
      const response = await fetch(`/api/albums/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update album')
      }

      const album = await response.json()
      albumLogger.info('✅ Álbum actualizado:', album.name)
      return album
    } catch (error) {
      albumLogger.error('❌ Error al actualizar álbum:', error)
      throw error
    }
  },

  async deleteAlbum(id: string): Promise<void> {
    try {
      albumLogger.info('🗑️ Eliminando álbum:', id)
      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete album')
      }
      albumLogger.info('✅ Álbum eliminado:', id)
    } catch (error) {
      albumLogger.error('❌ Error al eliminar álbum:', error)
      throw error
    }
  },

  async getAlbumStats(id: string): Promise<{ count: number; size: string }> {
    try {
      albumLogger.info('📊 Obteniendo estadísticas de álbum:', id)
      const response = await fetch(`/api/albums/${id}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch album stats')
      }
      const stats = await response.json()
      albumLogger.info('✅ Estadísticas obtenidas:', stats)
      return stats
    } catch (error) {
      albumLogger.error('❌ Error al obtener estadísticas:', error)
      throw error
    }
  },

  async updateAlbumStats(id: string): Promise<void> {
    try {
      albumLogger.info('🔄 Actualizando estadísticas de álbum:', id)
      const response = await fetch(`/api/albums/${id}/stats`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update album stats')
      }
      albumLogger.info('✅ Estadísticas actualizadas')
    } catch (error) {
      albumLogger.error('❌ Error al actualizar estadísticas:', error)
      throw error
    }
  }
}