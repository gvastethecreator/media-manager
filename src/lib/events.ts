import { EventEmitter } from 'events'

// Eventos de estadísticas
export const STATS_EVENTS = {
  VIEW_INCREMENTED: 'view_incremented',
  DOWNLOAD_INCREMENTED: 'download_incremented',
  STATS_UPDATED: 'stats_updated',
} as const

export type StatsEvents = typeof STATS_EVENTS

export const statsEventEmitter = new EventEmitter()
