import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
import { ProcessStatus } from './folder.service'

const eventsLogger = logger.withContext('EventsService')

export type EventType =
  | 'create' | 'update' | 'delete' | 'addImage' | 'removeImage'
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
  | 'folder:progress'
  | 'folder:error'
  | 'folder:complete'
  | 'folder:stats';

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
  | 'folder:progress'
  | 'folder:error'
  | 'folder:complete'
  | 'folder:stats'

class EventsService extends EventEmitter {
  private static instance: EventsService

  private constructor() {
    super()
    this.setMaxListeners(20)
  }

  static getInstance(): EventsService {
    if (!EventsService.instance) {
      EventsService.instance = new EventsService()
    }
    return EventsService.instance
  }

  emit(event: EventType, ...args: any[]): boolean {
    return super.emit(event, ...args)
  }

  on(event: EventType, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  off(event: EventType, listener: (...args: any[]) => void): this {
    return super.off(event, listener)
  }

  // Métodos específicos para eventos de progreso
  emitProgress(status: ProcessStatus): boolean {
    return this.emit('folder:progress', status)
  }

  onProgress(listener: (status: ProcessStatus) => void): this {
    return this.on('folder:progress', listener)
  }

  offProgress(listener: (status: ProcessStatus) => void): this {
    return this.off('folder:progress', listener)
  }
}

export const eventsService = EventsService.getInstance()