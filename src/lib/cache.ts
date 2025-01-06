import LRUCache from 'lru-cache'
import { cacheLogger as logger } from './utils'

export interface CacheOptions {
  /** Número máximo de elementos en caché */
  max?: number
  /** Tiempo de vida en milisegundos */
  ttl?: number
  /** Actualizar edad al obtener */
  updateAgeOnGet?: boolean
  /** Permitir valores expirados */
  allowStale?: boolean
  /** Nombre para identificación */
  name?: string
  /** Intervalo de limpieza en ms */
  cleanupInterval?: number
  /** Intervalo de log de stats en ms */
  statsInterval?: number
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  key: string
  hits?: number
}

interface CacheStats {
  hits: number
  misses: number
  keys: number
  size: number
  hitRatio: number
  avgTTL: number
  oldestEntry: number
  newestEntry: number
}

const DEFAULT_OPTIONS: Required<Omit<CacheOptions, 'name'>> = {
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hora
  updateAgeOnGet: true,
  allowStale: false,
  cleanupInterval: 1000 * 60 * 15, // 15 minutos
  statsInterval: 1000 * 60 * 5 // 5 minutos
}

class CacheManager<T = unknown> {
  private cache: LRUCache<string, CacheEntry<T>>
  private defaultTTL: number
  private updateAgeOnGet: boolean
  private allowStale: boolean
  private name: string
  private cleanupTimer?: NodeJS.Timeout
  private statsTimer?: NodeJS.Timeout
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    size: 0,
    hitRatio: 0,
    avgTTL: 0,
    oldestEntry: 0,
    newestEntry: 0
  }

  constructor(options: CacheOptions = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    this.defaultTTL = opts.ttl
    this.updateAgeOnGet = opts.updateAgeOnGet
    this.allowStale = opts.allowStale
    this.name = options.name || 'default'

    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: opts.max,
      ttlAutopurge: true,
      allowStale: this.allowStale,
      updateAgeOnGet: this.updateAgeOnGet,
      ttl: this.defaultTTL,
    })

    // Iniciar timers
    this.startCleanupTimer(opts.cleanupInterval)
    this.startStatsTimer(opts.statsInterval)
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const entry = this.cache.get(key)
      if (!entry) {
        this.stats.misses++
        return undefined
      }

      const now = Date.now()
      if (now - entry.timestamp > entry.ttl && !this.allowStale) {
        this.cache.delete(key)
        this.stats.misses++
        return undefined
      }

      if (this.updateAgeOnGet) {
        entry.timestamp = now
        entry.hits = (entry.hits || 0) + 1
        this.cache.set(key, entry)
      }

      this.stats.hits++
      this.updateStats()
      return entry.value
    } catch (error) {
      logger.error(`[Cache:${this.name}] Error en get:`, { error, key })
      return undefined
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
        key,
        hits: 0
      }

      this.cache.set(key, entry)
      this.updateStats()
    } catch (error) {
      logger.error(`[Cache:${this.name}] Error en set:`, { error, key })
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key)
      this.updateStats()
    } catch (error) {
      logger.error(`[Cache:${this.name}] Error en delete:`, { error, key })
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear()
      this.resetStats()
    } catch (error) {
      logger.error(`[Cache:${this.name}] Error en clear:`, error)
    }
  }

  async prune(): Promise<void> {
    try {
      const now = Date.now()
      let pruned = 0
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
          pruned++
        }
      }
      if (pruned > 0) {
        logger.info(`[Cache:${this.name}] Eliminadas ${pruned} entradas expiradas`)
        this.updateStats()
      }
    } catch (error) {
      logger.error(`[Cache:${this.name}] Error en prune:`, error)
    }
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      size: 0,
      hitRatio: 0,
      avgTTL: 0,
      oldestEntry: 0,
      newestEntry: 0
    }
  }

  private updateStats(): void {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    this.stats.keys = this.cache.size
    this.stats.size = entries.reduce((acc, [_, entry]) => acc + JSON.stringify(entry.value).length, 0)
    this.stats.hitRatio = this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    this.stats.avgTTL = entries.reduce((acc, [_, entry]) => acc + entry.ttl, 0) / entries.length || 0

    if (entries.length > 0) {
      const timestamps = entries.map(([_, entry]) => entry.timestamp)
      this.stats.oldestEntry = now - Math.min(...timestamps)
      this.stats.newestEntry = now - Math.max(...timestamps)
    }
  }

  private logStats(): void {
    const stats = {
      ...this.stats,
      hitRatio: `${(this.stats.hitRatio * 100).toFixed(2)}%`,
      oldestEntry: `${(this.stats.oldestEntry / 1000 / 60).toFixed(2)}m`,
      newestEntry: `${(this.stats.newestEntry / 1000 / 60).toFixed(2)}m`,
      avgTTL: `${(this.stats.avgTTL / 1000 / 60).toFixed(2)}m`,
      size: `${(this.stats.size / 1024).toFixed(2)}KB`
    }
    logger.info(`[Cache:${this.name}] Stats:`, stats)
  }

  private startCleanupTimer(interval: number): void {
    this.cleanupTimer = setInterval(() => {
      this.prune().catch(error =>
        logger.error(`[Cache:${this.name}] Error en cleanup timer:`, error)
      )
    }, interval)
  }

  private startStatsTimer(interval: number): void {
    if (process.env.NODE_ENV === 'development') {
      this.statsTimer = setInterval(() => {
        this.logStats()
      }, interval)
    }
  }

  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer)
    }
  }

  getStats(): CacheStats {
    this.updateStats()
    return { ...this.stats }
  }
}

// Crear instancias específicas para diferentes tipos de caché
export const thumbnailCache = new CacheManager<string>({
  name: 'thumbnails',
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 horas
  updateAgeOnGet: true,
  allowStale: true // Permitir usar thumbnails expirados mientras se regeneran
})

export const metadataCache = new CacheManager<Record<string, unknown>>({
  name: 'metadata',
  max: 5000,
  ttl: 1000 * 60 * 60, // 1 hora
  updateAgeOnGet: true
})

export const searchCache = new CacheManager<unknown[]>({
  name: 'search',
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutos
  updateAgeOnGet: false // No actualizar edad en búsquedas
})

// Limpiar caches al cerrar la aplicación
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    Promise.all([
      thumbnailCache.stop(),
      metadataCache.stop(),
      searchCache.stop()
    ]).catch(error =>
      logger.error('[Cache] Error deteniendo caches:', error)
    )
  })
}
