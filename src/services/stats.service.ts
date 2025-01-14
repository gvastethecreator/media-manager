import { logger } from '@/lib/logger'
import {
  getSystemStats,
  getImageStats,
  incrementImageView,
  incrementImageDownload,
  invalidateStats,
  type GeneralStats,
} from '@/app/actions/stats.actions'
import { EventEmitter } from 'events'

const statsLogger = logger.withContext('StatsService')

// Eventos de estadísticas
export const STATS_EVENTS = {
  VIEW_INCREMENTED: 'view_incremented',
  DOWNLOAD_INCREMENTED: 'download_incremented',
  STATS_UPDATED: 'stats_updated',
  COLLECTION_CHANGE: 'collection_change',
  TAG_CHANGE: 'tag_change',
  FAVORITE_CHANGE: 'favorite_change',
  STATS_UPDATE_NEEDED: 'stats_update_needed',
  FOLDER_CHANGE: 'folder_change',
  ALBUM_CHANGE: 'album_change',
  CHARACTER_CHANGE: 'character_change',
  PLACE_CHANGE: 'place_change',
  OBJECT_CHANGE: 'object_change'
} as const

export type StatsEventType = (typeof STATS_EVENTS)[keyof typeof STATS_EVENTS]
export type StatsUpdateEvent =
  | 'collection_change'
  | 'tag_change'
  | 'favorite_change'
  | 'folder_change'
  | 'album_change'
  | 'character_change'
  | 'place_change'
  | 'object_change'
export type StatsEvents = typeof STATS_EVENTS

export const statsEventEmitter = new EventEmitter()
statsEventEmitter.setMaxListeners(50)

export class StatsService extends EventEmitter {
  private static instance: StatsService
  private isUpdating: boolean = false

  private constructor() {
    super()
    statsLogger.info('🚀 Inicializando StatsService')
    this.setMaxListeners(50)
  }

  static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService()
    }
    return StatsService.instance
  }

  async invalidateStats() {
    await invalidateStats()
  }

  async getGeneralStats(): Promise<GeneralStats> {
    try {
      const stats = await getSystemStats()
      this.emit(STATS_EVENTS.STATS_UPDATED, stats)
      return stats
    } catch (error) {
      statsLogger.error('Error al obtener estadísticas generales', { error })
      this.emit('error', error)
      throw error
    }
  }

  async getOrCreateImageStats(imageId: string) {
    try {
      return await getImageStats(imageId)
    } catch (error) {
      statsLogger.error('Error al obtener estadísticas de imagen', {
        error,
        imageId,
      })
      this.emit('error', error)
      throw error
    }
  }

  async incrementViewCount(imageId: string) {
    try {
      const stats = await incrementImageView(imageId)
      this.emit(STATS_EVENTS.VIEW_INCREMENTED, { imageId, stats })
      return stats
    } catch (error) {
      statsLogger.error('Error al incrementar vistas', { error, imageId })
      this.emit('error', error)
      throw error
    }
  }

  async incrementDownloadCount(imageId: string) {
    try {
      const stats = await incrementImageDownload(imageId)
      this.emit(STATS_EVENTS.DOWNLOAD_INCREMENTED, {
        imageId,
        stats,
      })
      return stats
    } catch (error) {
      statsLogger.error('Error al incrementar descargas', { error, imageId })
      this.emit('error', error)
      throw error
    }
  }
}

export const statsService = StatsService.getInstance()
