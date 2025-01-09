import { logger } from '@/lib/logger'
import { thumbnailCache, metadataCache, searchCache } from '@/lib/cache'

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
      switch (event) {
        case 'files:added':
        case 'files:deleted':
        case 'files:modified':
        case 'folders:added':
        case 'folders:deleted':
        case 'folders:modified':
          await Promise.all([
            searchCache.clear(),
            metadataCache.clear()
          ])
          break

        case 'collections:modified':
        case 'favorites:modified':
        case 'tags:modified':
          await searchCache.clear()
          break

        case 'thumbnails:modified':
          await thumbnailCache.clear()
          break

        case 'metadata:modified':
          await metadataCache.clear()
          break

        case 'search:modified':
          await searchCache.clear()
          break
      }

      eventsLogger.info(`🧹 Caché invalidado para evento: ${event}`)
    } catch (error) {
      eventsLogger.error(`❌ Error invalidando caché para ${event}:`, error)
    }
  }
}

export const eventsService = EventsService.getInstance()