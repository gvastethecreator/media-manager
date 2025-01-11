import { EventEmitter } from 'events'

// Eventos de estadísticas
export const STATS_EVENTS = {
  VIEW_INCREMENTED: 'view_incremented',
  DOWNLOAD_INCREMENTED: 'download_incremented',
  STATS_UPDATED: 'stats_updated',
} as const

export type StatsEvents = typeof STATS_EVENTS

export const statsEventEmitter = new EventEmitter()

// Eventos de entidades
export const ENTITY_EVENTS = {
  CHARACTER_CREATED: 'character_created',
  CHARACTER_UPDATED: 'character_updated',
  CHARACTER_DELETED: 'character_deleted',

  PLACE_CREATED: 'place_created',
  PLACE_UPDATED: 'place_updated',
  PLACE_DELETED: 'place_deleted',

  OBJECT_CREATED: 'object_created',
  OBJECT_UPDATED: 'object_updated',
  OBJECT_DELETED: 'object_deleted',

  ACTIVITY_LOGGED: 'activity_logged'
} as const

export type EntityEvents = typeof ENTITY_EVENTS

export const entityEventEmitter = new EventEmitter()

// Eventos de cola
export const QUEUE_EVENTS = {
  JOB_CREATED: 'job_created',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  JOB_FAILED: 'job_failed',
  JOB_RETRYING: 'job_retrying',
  JOB_CANCELLED: 'job_cancelled'
} as const

export type QueueEvents = typeof QUEUE_EVENTS

export const queueEventEmitter = new EventEmitter()
