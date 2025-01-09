import { EventEmitter } from 'events'
import { statsCache } from '@/lib/cache'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('StatsService')

export interface ImageStats {
  id: string
  imageId: string
  views: number
  downloads: number
  lastViewed: Date
  createdAt: Date
  updatedAt: Date
}

export interface ThumbnailStats {
  processed: number
  optimized: number
  cleaned: number
  totalSaved: number
  totalFreed: number
  errors: number
}

// Eventos que pueden causar actualización de estadísticas
export const STATS_EVENTS = {
  IMAGE_VIEW: 'IMAGE_VIEW',
  IMAGE_DOWNLOAD: 'IMAGE_DOWNLOAD',
  IMAGE_ADD: 'IMAGE_ADD',
  IMAGE_DELETE: 'IMAGE_DELETE',
  TAG_CHANGE: 'TAG_CHANGE',
  COLLECTION_CHANGE: 'COLLECTION_CHANGE',
  FOLDER_CHANGE: 'FOLDER_CHANGE',
  FAVORITE_CHANGE: 'FAVORITE_CHANGE',
} as const

export type StatsEventType = keyof typeof STATS_EVENTS;

class StatsEventEmitter extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit('stats_update_needed', [event], ...args);
  }
}

export const statsEventEmitter = new StatsEventEmitter();

export const statsService = {
  async getOrCreateImageStats(imageId: string): Promise<ImageStats> {
    try {
      const response = await fetch(`/api/stats/image?imageId=${imageId}`)
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de imagen')
      }
      return response.json()
    } catch (error) {
      statsLogger.error('❌ Error al obtener estadísticas de imagen:', error)
      throw error
    }
  },

  async incrementViewCount(imageId: string): Promise<ImageStats> {
    try {
      const response = await fetch(`/api/stats/image?imageId=${imageId}&action=view`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Error al incrementar vistas')
      }
      statsEventEmitter.emit(STATS_EVENTS.IMAGE_VIEW)
      return response.json()
    } catch (error) {
      statsLogger.error('❌ Error al incrementar vistas:', error)
      throw error
    }
  },

  async incrementDownloadCount(imageId: string): Promise<ImageStats> {
    try {
      const response = await fetch(`/api/stats/image?imageId=${imageId}&action=download`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Error al incrementar descargas')
      }
      statsEventEmitter.emit(STATS_EVENTS.IMAGE_DOWNLOAD)
      return response.json()
    } catch (error) {
      statsLogger.error('❌ Error al incrementar descargas:', error)
      throw error
    }
  },

  async getCachedStats(key: string) {
    try {
      const cached = await statsCache.get(key)
      if (cached) {
        return cached
      }
      return null
    } catch (error) {
      statsLogger.error('❌ Error al obtener estadísticas cacheadas:', error)
      return null
    }
  },

  async setCachedStats(key: string, data: Record<string, unknown>) {
    try {
      await statsCache.set(key, data)
    } catch (error) {
      statsLogger.error('❌ Error al cachear estadísticas:', error)
    }
  },

  async getGeneralStats() {
    const cacheKey = 'general_stats'

    try {
      // Intentar obtener del caché primero
      const cached = await this.getCachedStats(cacheKey)
      if (cached) {
        const cacheAge = Date.now() - (cached as any).timestamp
        // Usar caché si tiene menos de 1 minuto
        if (cacheAge < 60000) {
          statsLogger.debug('✅ Usando estadísticas cacheadas (edad: ${Math.round(cacheAge/1000)}s)')
          return cached
        }
      }

      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }

      const stats = await response.json()
      await this.setCachedStats(cacheKey, stats)
      statsLogger.debug('📊 Estadísticas actualizadas desde API')
      return stats
    } catch (error) {
      // Si hay un error, intentar usar el caché aunque sea antiguo
      const cached = await this.getCachedStats(cacheKey)
      if (cached) {
        statsLogger.warn('⚠️ Usando caché antiguo debido a error:', error)
        return cached
      }

      statsLogger.error('❌ Error al obtener estadísticas:', error)
      throw error
    }
  }
}
