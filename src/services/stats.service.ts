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

export type CacheInvalidationEvent =
  | "collections:modified"
  | "tags:modified"
  | "favorites:modified"
  | "albums:modified"
  | "characters:modified"
  | "places:modified"
  | "objects:modified";

export enum EVENTS {
  UPDATE_NEEDED = 'update_needed',
  STATS_UPDATED = 'stats_updated',
  ERROR = 'error'
}

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

  emitUpdateNeeded(events: CacheInvalidationEvent | CacheInvalidationEvent[]) {
    const eventArray = Array.isArray(events) ? events : [events];
    statsLogger.info('🔄 Emitiendo necesidad de actualización:', { events: eventArray })
    this.emit(EVENTS.UPDATE_NEEDED, eventArray)
  }

  onUpdateNeeded(callback: (events: CacheInvalidationEvent[]) => void): void {
    this.on(EVENTS.UPDATE_NEEDED, callback)
  }

  offUpdateNeeded(callback: (events: CacheInvalidationEvent[]) => void): void {
    this.off(EVENTS.UPDATE_NEEDED, callback)
  }

  onStatsUpdated(callback: (stats: any) => void): void {
    this.on(EVENTS.STATS_UPDATED, callback)
  }

  offStatsUpdated(callback: (stats: any) => void): void {
    this.off(EVENTS.STATS_UPDATED, callback)
  }

  onError(callback: (error: any) => void): void {
    this.on(EVENTS.ERROR, callback)
  }

  offError(callback: (error: any) => void): void {
    this.off(EVENTS.ERROR, callback)
  }

  async getGeneralStats(): Promise<GeneralStats> {
    try {
      const stats = await getGeneralStats()
      this.emit(STATS_EVENTS.STATS_UPDATED, stats)
      return stats
    } catch (error) {
      statsLogger.error('Error al obtener estadísticas generales', { error })
      this.emit(EVENTS.ERROR, error)
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
      this.emit(EVENTS.ERROR, error)
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
      this.emit(EVENTS.ERROR, error)
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
      this.emit(EVENTS.ERROR, error)
      throw error
    }
  }

  // Métodos para emitir eventos de cambios
  emitCollectionChange(imageId: string) {
    this.emit(STATS_EVENTS.COLLECTION_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['collection_change'])
  }

  emitTagChange(imageId: string) {
    this.emit(STATS_EVENTS.TAG_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['tag_change'])
  }

  emitFavoriteChange(imageId: string) {
    this.emit(STATS_EVENTS.FAVORITE_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['favorite_change'])
  }

  emitFolderChange(folderId: string) {
    this.emit(STATS_EVENTS.FOLDER_CHANGE, { folderId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['folder_change'])
  }

  emitAlbumChange(imageId: string) {
    this.emit(STATS_EVENTS.ALBUM_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['album_change'])
  }

  emitCharacterChange(imageId: string) {
    this.emit(STATS_EVENTS.CHARACTER_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['character_change'])
  }

  emitPlaceChange(imageId: string) {
    this.emit(STATS_EVENTS.PLACE_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['place_change'])
  }

  emitObjectChange(imageId: string) {
    this.emit(STATS_EVENTS.OBJECT_CHANGE, { imageId })
    this.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['object_change'])
  }
}

export const statsService = StatsService.getInstance()
