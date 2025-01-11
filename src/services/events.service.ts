import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'

const eventsLogger = logger.withContext('EventsService')

export type EventType = 'create' | 'update' | 'delete' | 'addImage' | 'removeImage'

export interface EventData {
  type: EventType
  id?: string
  objectId?: string
  imageId?: string
  data?: any
}

export type CacheInvalidationEvent =
  | 'collections:modified'
  | 'tags:modified'
  | 'albums:modified'
  | 'characters:modified'
  | 'places:modified'
  | 'objects:modified'
  | 'favorites:modified'
  | 'images:modified'
  | 'files:modified'
  | 'folders:modified'

class EventsService extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(20)
  }

  emit(event: CacheInvalidationEvent, data?: EventData) {
    eventsLogger.info('📢 Emitiendo evento:', { event, data })
    return super.emit(event, data)
  }

  on(event: CacheInvalidationEvent, listener: (data?: EventData) => void) {
    eventsLogger.info('👂 Suscribiendo a evento:', { event })
    return super.on(event, listener)
  }

  off(event: CacheInvalidationEvent, listener: (data?: EventData) => void) {
    eventsLogger.info('🔕 Desuscribiendo de evento:', { event })
    return super.off(event, listener)
  }
}

export const eventsService = new EventsService()