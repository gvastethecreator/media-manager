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
  IMAGE_VIEW: 'image_view',
  IMAGE_DOWNLOAD: 'image_download',
  IMAGE_ADD: 'image_add',
  IMAGE_DELETE: 'image_delete',
  TAG_CHANGE: 'tag_change',
  COLLECTION_CHANGE: 'collection_change',
  FOLDER_CHANGE: 'folder_change',
  FAVORITE_CHANGE: 'favorite_change',
} as const

type EventType = (typeof STATS_EVENTS)[keyof typeof STATS_EVENTS]

type EventGroups = {
  COUNTS: readonly EventType[]
  METADATA: readonly EventType[]
  ACTIVITY: readonly EventType[]
}

const EVENT_IMPACTS: EventGroups = {
  COUNTS: [
    STATS_EVENTS.IMAGE_ADD,
    STATS_EVENTS.IMAGE_DELETE,
    STATS_EVENTS.FOLDER_CHANGE
  ],
  METADATA: [
    STATS_EVENTS.TAG_CHANGE,
    STATS_EVENTS.COLLECTION_CHANGE
  ],
  ACTIVITY: [
    STATS_EVENTS.IMAGE_VIEW,
    STATS_EVENTS.IMAGE_DOWNLOAD,
    STATS_EVENTS.FAVORITE_CHANGE
  ]
} as const

class StatsEventEmitter extends EventEmitter {
  private static instance: StatsEventEmitter
  private lastUpdate: number = 0
  private updateInterval: number = 5000
  private shouldUpdate: boolean = false
  private pendingEvents: Map<EventType, number> = new Map()
  private updateTimeout: NodeJS.Timeout | null = null
  private isUpdating: boolean = false

  private constructor() {
    super()
    this.setupEventHandlers()
  }

  public static getInstance(): StatsEventEmitter {
    if (!StatsEventEmitter.instance) {
      StatsEventEmitter.instance = new StatsEventEmitter()
    }
    return StatsEventEmitter.instance
  }

  private setupEventHandlers() {
    Object.values(STATS_EVENTS).forEach(event => {
      this.on(event, () => {
        const now = Date.now()
        const lastEventTime = this.pendingEvents.get(event) || 0

        // Evitar eventos duplicados en un intervalo corto (1 segundo)
        if (now - lastEventTime < 1000) {
          return
        }

        this.pendingEvents.set(event, now)
        this.shouldUpdate = true
        this.debouncedUpdate()
      })
    })
  }

  private shouldTriggerUpdate(events: EventType[]): boolean {
    // Si hay eventos que afectan conteos, siempre actualizar
    if (events.some(event => EVENT_IMPACTS.COUNTS.includes(event))) {
      return true
    }

    // Para eventos de metadata, acumular hasta tener varios
    const metadataEvents = events.filter(event =>
      EVENT_IMPACTS.METADATA.includes(event)
    )
    if (metadataEvents.length > 2) {
      return true
    }

    // Para eventos de actividad, no trigger inmediato
    const activityEvents = events.filter(event =>
      EVENT_IMPACTS.ACTIVITY.includes(event)
    )
    if (activityEvents.length > 0) {
      return false
    }

    return false
  }

  private debouncedUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    const events = Array.from(this.pendingEvents.keys())
    const shouldTrigger = this.shouldTriggerUpdate(events)

    // Ajustar el delay según el tipo de eventos
    const delay = shouldTrigger ? this.updateInterval : this.updateInterval * 2

    this.updateTimeout = setTimeout(() => {
      this.checkUpdate()
    }, delay)
  }

  private checkUpdate() {
    const now = Date.now()
    if (this.shouldUpdate && now - this.lastUpdate >= this.updateInterval && !this.isUpdating) {
      this.shouldUpdate = false
      this.lastUpdate = now
      this.isUpdating = true

      const events = Array.from(this.pendingEvents.keys()) as EventType[]
      if (this.shouldTriggerUpdate(events)) {
        this.emit('stats_update_needed', events)
        statsLogger.debug('🔄 Actualizando estadísticas:', { events })
      }

      this.pendingEvents.clear()

      setTimeout(() => {
        this.isUpdating = false
      }, this.updateInterval)
    }
  }
}

export const statsEventEmitter = StatsEventEmitter.getInstance()

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
