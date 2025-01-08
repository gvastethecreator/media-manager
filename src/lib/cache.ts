import { LRUCache, Entry } from 'lru-cache'
import { logger } from '@/lib/logger'

interface CacheOptions {
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

interface DumpEntry<T> {
  value: CacheEntry<T>
  ttl?: number
  start?: number
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

// Crear una instancia específica para el servicio de caché
const cacheLogger = logger.withContext('CacheManager')

type LRUEntry<T> = { value: CacheEntry<T> }

type DumpedEntry<T> = { value: T; ttl?: number; start?: number }

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
    this.name = options.name || 'default'
    this.defaultTTL = opts.ttl
    this.updateAgeOnGet = opts.updateAgeOnGet
    this.allowStale = opts.allowStale

    cacheLogger.info(`Initializing cache manager: ${this.name}`)

    // Crear instancia de LRUCache con la nueva configuración
    this.cache = new LRUCache({
      max: opts.max,
      ttl: opts.ttl,
      updateAgeOnGet: opts.updateAgeOnGet,
      allowStale: opts.allowStale,
      dispose: (value: CacheEntry<T>, key: string) => {
        cacheLogger.debug(`[${this.name}] Entry disposed:`, { key })
      }
    })

    // Iniciar timers
    this.startCleanupTimer(opts.cleanupInterval)
    this.startStatsTimer(opts.statsInterval)
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined
      if (!entry) {
        this.stats.misses++
        cacheLogger.debug(`[${this.name}] Cache miss:`, { key })
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
      cacheLogger.debug(`[${this.name}] Cache hit:`, { key })
      return entry.value
    } catch (error) {
      cacheLogger.error(`[${this.name}] Error getting cache entry:`, { error, key })
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
      cacheLogger.debug(`[${this.name}] Cache entry set:`, { key, ttl })
    } catch (error) {
      cacheLogger.error(`[${this.name}] Error setting cache entry:`, { error, key })
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key)
      cacheLogger.debug(`[${this.name}] Cache entry deleted:`, { key })
    } catch (error) {
      cacheLogger.error(`[${this.name}] Error deleting cache entry:`, { error, key })
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear()
      this.resetStats()
      cacheLogger.info(`[${this.name}] Cache cleared`)
    } catch (error) {
      cacheLogger.error(`[${this.name}] Error clearing cache:`, error)
    }
  }

  async prune(): Promise<void> {
    try {
      const now = Date.now()
      let pruned = 0
      const dump = this.cache.dump()

      for (const key of Object.keys(dump)) {
        const entry = dump[key]
        if (entry && now - (entry.value as CacheEntry<T>).timestamp > (entry.value as CacheEntry<T>).ttl) {
          await this.delete(key)
          pruned++
        }
      }

      if (pruned > 0) {
        cacheLogger.info(`[${this.name}] Pruned ${pruned} expired entries`)
      }
    } catch (error) {
      cacheLogger.error(`[${this.name}] Error pruning cache:`, error)
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

  private async updateStats(): Promise<void> {
    try {
      const dump = this.cache.dump()
      const entries = Object.fromEntries(
        Object.entries(dump).map(([key, value]) => [
          key,
          { value: value.value as CacheEntry<T> }
        ])
      )

      const now = Date.now()
      const chunkSize = 100
      let totalSize = 0
      let totalTTL = 0
      let minTimestamp = Infinity
      let maxTimestamp = -Infinity

      // Procesar entradas en chunks
      const keys = Object.keys(entries)
      for (let i = 0; i < keys.length; i += chunkSize) {
        const chunk = keys.slice(i, i + chunkSize)

        for (const key of chunk) {
          const entry = entries[key]
          if (!entry?.value) continue

          try {
            totalSize += JSON.stringify(entry.value).length
            totalTTL += entry.value.ttl
            minTimestamp = Math.min(minTimestamp, entry.value.timestamp)
            maxTimestamp = Math.max(maxTimestamp, entry.value.timestamp)
          } catch (error) {
            cacheLogger.warn(`[Cache:${this.name}] Error al procesar entrada en stats:`, {
              error: error instanceof Error ? error.message : String(error)
            })
          }
        }

        // Dar tiempo al event loop
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      this.stats.keys = this.cache.size
      this.stats.size = totalSize
      this.stats.hitRatio = this.stats.hits / (this.stats.hits + this.stats.misses) || 0
      this.stats.avgTTL = keys.length > 0 ? totalTTL / keys.length : 0

      if (keys.length > 0 && minTimestamp !== Infinity && maxTimestamp !== -Infinity) {
        this.stats.oldestEntry = now - minTimestamp
        this.stats.newestEntry = now - maxTimestamp
      }
    } catch (error) {
      cacheLogger.error(`[Cache:${this.name}] Error al actualizar estadísticas:`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private logStats(): void {
    try {
      const stats = {
        ...this.stats,
        hitRatio: `${(this.stats.hitRatio * 100).toFixed(2)}%`,
        oldestEntry: `${(this.stats.oldestEntry / 1000 / 60).toFixed(2)}m`,
        newestEntry: `${(this.stats.newestEntry / 1000 / 60).toFixed(2)}m`,
        avgTTL: `${(this.stats.avgTTL / 1000 / 60).toFixed(2)}m`,
        size: `${(this.stats.size / 1024).toFixed(2)}KB`
      }
      cacheLogger.info(`[Cache:${this.name}] Stats:`, stats)
    } catch (error) {
      cacheLogger.error(`[Cache:${this.name}] Error al generar log de estadísticas:`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private startCleanupTimer(interval: number): void {
    this.cleanupTimer = setInterval(() => {
      this.prune().catch(error =>
        cacheLogger.error(`[Cache:${this.name}] Error en cleanup timer:`, {
          error: error instanceof Error ? error.message : String(error)
        })
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
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
        this.cleanupTimer = undefined
      }
      if (this.statsTimer) {
        clearInterval(this.statsTimer)
        this.statsTimer = undefined
      }
      await this.clear()
    } catch (error) {
      cacheLogger.error(`[Cache:${this.name}] Error al detener caché:`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  getStats(): CacheStats {
    try {
      this.updateStats()
      return { ...this.stats }
    } catch (error) {
      cacheLogger.error(`[Cache:${this.name}] Error al obtener estadísticas:`, {
        error: error instanceof Error ? error.message : String(error)
      })
      return { ...this.stats }
    }
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
      cacheLogger.error('[Cache] Error deteniendo caches:', error)
    )
  })
}
