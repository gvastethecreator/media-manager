import { logger } from '@/lib/logger'
import {
  getGeneralStats,
  getImageStats,
  incrementImageView,
  incrementImageDownload,
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

class StatsService {
  async getGeneralStats(): Promise<GeneralStats> {
    try {
      const stats = await getGeneralStats()
      statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED, stats)
      return stats
    } catch (error) {
      statsLogger.error('Error al obtener estadísticas generales', { error })
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
      throw error
    }
  }

  async incrementViewCount(imageId: string) {
    try {
      const stats = await incrementImageView(imageId)
      statsEventEmitter.emit(STATS_EVENTS.VIEW_INCREMENTED, { imageId, stats })
      return stats
    } catch (error) {
      statsLogger.error('Error al incrementar vistas', { error, imageId })
      throw error
    }
  }

  async incrementDownloadCount(imageId: string) {
    try {
      const stats = await incrementImageDownload(imageId)
      statsEventEmitter.emit(STATS_EVENTS.DOWNLOAD_INCREMENTED, {
        imageId,
        stats,
      })
      return stats
    } catch (error) {
      statsLogger.error('Error al incrementar descargas', { error, imageId })
      throw error
    }
  }

  // Métodos para emitir eventos de cambios
  emitCollectionChange(imageId: string) {
    statsEventEmitter.emit('collection_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['collection_change'])
  }

  emitTagChange(imageId: string) {
    statsEventEmitter.emit('tag_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['tag_change'])
  }

  emitFavoriteChange(imageId: string) {
    statsEventEmitter.emit('favorite_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['favorite_change'])
  }

  emitFolderChange(folderId: string) {
    statsEventEmitter.emit('folder_change', { folderId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['folder_change'])
  }

  emitAlbumChange(imageId: string) {
    statsEventEmitter.emit('album_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['album_change'])
  }

  emitCharacterChange(imageId: string) {
    statsEventEmitter.emit('character_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['character_change'])
  }

  emitPlaceChange(imageId: string) {
    statsEventEmitter.emit('place_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['place_change'])
  }

  emitObjectChange(imageId: string) {
    statsEventEmitter.emit('object_change', { imageId })
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['object_change'])
  }
}

export const statsService = new StatsService()
