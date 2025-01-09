import { logger } from '@/lib/logger'
import { thumbnailCache, metadataCache, searchCache, statsCache } from '@/lib/cache'

const eventsLogger = logger.withContext('EventsService')

export type CacheInvalidationEvent =
  | 'files:added'
  | 'files:deleted'
  | 'files:modified'
  | 'folders:added'
  | 'folders:deleted'
  | 'folders:modified'
  | 'collections:modified'
  | 'favorites:modified'
  | 'tags:modified'
  | 'thumbnails:modified'
  | 'metadata:modified'
  | 'search:modified'

type EventCallback = (event: CacheInvalidationEvent) => void

class EventsService {
  private static instance: EventsService
  private listeners: Set<EventCallback> = new Set()
  private lastEventTimestamp: Record<CacheInvalidationEvent, number> = {
    'files:added': 0,
    'files:deleted': 0,
    'files:modified': 0,
    'folders:added': 0,
    'folders:deleted': 0,
    'folders:modified': 0,
    'collections:modified': 0,
    'favorites:modified': 0,
    'tags:modified': 0,
    'thumbnails:modified': 0,
    'metadata:modified': 0,
    'search:modified': 0
  }

  private constructor() { }

  static getInstance(): EventsService {
    if (!EventsService.instance) {
      EventsService.instance = new EventsService()
    }
    return EventsService.instance
  }

  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  emit(event: CacheInvalidationEvent): void {
    const now = Date.now()
    const lastEvent = this.lastEventTimestamp[event]

    // Evitar eventos duplicados en un intervalo corto (500ms)
    if (now - lastEvent < 500) {
      return
    }

    this.lastEventTimestamp[event] = now
    eventsLogger.debug(`🔄 Evento emitido: ${event}`)

    // Invalidar cachés según el tipo de evento
    this.invalidateCache(event)

    // Notificar a los listeners
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        eventsLogger.error(`❌ Error en listener para ${event}:`, error)
      }
    })
  }

  private async invalidateCache(event: CacheInvalidationEvent): Promise<void> {
    try {
      // Agrupar eventos por tipo de caché
      const cacheInvalidations: { [key: string]: string[] } = {
        search: [],
        metadata: [],
        thumbnails: [],
        stats: []
      }

      // Determinar qué cachés necesitan ser invalidados
      switch (event) {
        case 'files:added':
        case 'files:deleted':
        case 'files:modified':
          cacheInvalidations.search.push(event)
          cacheInvalidations.metadata.push(event)
          cacheInvalidations.stats.push(event)
          break

        case 'folders:added':
        case 'folders:deleted':
        case 'folders:modified':
          cacheInvalidations.search.push(event)
          cacheInvalidations.stats.push(event)
          break

        case 'collections:modified':
        case 'favorites:modified':
        case 'tags:modified':
          cacheInvalidations.search.push(event)
          cacheInvalidations.stats.push(event)
          break

        case 'thumbnails:modified':
          cacheInvalidations.thumbnails.push(event)
          break

        case 'metadata:modified':
          cacheInvalidations.metadata.push(event)
          break

        case 'search:modified':
          cacheInvalidations.search.push(event)
          break
      }

      // Invalidar cachés de forma selectiva
      const invalidationPromises: Promise<void>[] = []

      if (cacheInvalidations.search.length > 0) {
        invalidationPromises.push(searchCache.clear())
        eventsLogger.debug('🔄 Invalidando caché de búsqueda:', cacheInvalidations.search)
      }

      if (cacheInvalidations.metadata.length > 0) {
        invalidationPromises.push(metadataCache.clear())
        eventsLogger.debug('🔄 Invalidando caché de metadata:', cacheInvalidations.metadata)
      }

      if (cacheInvalidations.thumbnails.length > 0) {
        invalidationPromises.push(thumbnailCache.clear())
        eventsLogger.debug('🔄 Invalidando caché de thumbnails:', cacheInvalidations.thumbnails)
      }

      if (cacheInvalidations.stats.length > 0) {
        invalidationPromises.push(statsCache.clear())
        eventsLogger.debug('🔄 Invalidando caché de estadísticas:', cacheInvalidations.stats)
      }

      await Promise.all(invalidationPromises)
      eventsLogger.info(`🧹 Cachés invalidados para evento: ${event}`)
    } catch (error) {
      eventsLogger.error(`❌ Error invalidando caché para ${event}:`, error)
    }
  }
}

export const eventsService = EventsService.getInstance()