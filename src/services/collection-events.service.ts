import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
import { Collection } from '@prisma/client'

const collectionEventsLogger = logger.withContext('CollectionEventsService')

export const COLLECTION_EVENTS = {
  COLLECTION_CREATED: 'collection:created',
  COLLECTION_UPDATED: 'collection:updated',
  COLLECTION_DELETED: 'collection:deleted',
  IMAGE_ADDED: 'collection:image:added',
  IMAGE_REMOVED: 'collection:image:removed'
} as const

export type CollectionEventType = typeof COLLECTION_EVENTS[keyof typeof COLLECTION_EVENTS]

export interface CollectionEventData {
  collection?: Collection
  collectionId?: string
  imageId?: string
}

class CollectionEventsService extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(20)
  }

  emit(event: CollectionEventType, data: CollectionEventData) {
    collectionEventsLogger.info('📢 Emitiendo evento:', { event, data })
    return super.emit(event, data)
  }

  on(event: CollectionEventType, listener: (data: CollectionEventData) => void) {
    collectionEventsLogger.info('👂 Suscribiendo a evento:', { event })
    return super.on(event, listener)
  }

  off(event: CollectionEventType, listener: (data: CollectionEventData) => void) {
    collectionEventsLogger.info('🔕 Desuscribiendo de evento:', { event })
    return super.off(event, listener)
  }
}

export const collectionEventsService = new CollectionEventsService()