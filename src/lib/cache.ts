import { logger } from './logger'

const cacheLogger = logger.withContext('Cache')

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items in cache
  name?: string // Cache name for logging
  updateAgeOnGet?: boolean // Update item age on get
  allowStale?: boolean // Allow returning stale items
}

export class CacheManager<T> {
  private cache: Map<string, { value: T; timestamp: number }>
  private ttl: number
  private maxSize: number
  private name: string
  private updateAgeOnGet: boolean
  private allowStale: boolean

  constructor(options: CacheOptions = {}) {
    this.cache = new Map()
    this.ttl = options.ttl || 5 * 60 * 1000 // 5 minutes by default
    this.maxSize = options.maxSize || 1000
    this.name = options.name || 'default'
    this.updateAgeOnGet = options.updateAgeOnGet || false
    this.allowStale = options.allowStale || false
  }

  async set(key: string, value: T, customTtl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })

    cacheLogger.debug(`✨ Cache ${this.name}: Elemento agregado`, { key })
  }

  async get(key: string): Promise<T | undefined> {
    const item = this.cache.get(key)

    if (!item) {
      return undefined
    }

    const now = Date.now()
    const isExpired = now - item.timestamp > this.ttl

    if (isExpired && !this.allowStale) {
      this.cache.delete(key)
      cacheLogger.debug(`🕒 Cache ${this.name}: Elemento expirado`, { key })
      return undefined
    }

    if (this.updateAgeOnGet) {
      item.timestamp = now
    }

    return item.value
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    cacheLogger.debug(`🗑️ Cache ${this.name}: Elemento eliminado`, { key })
  }

  async clear(): Promise<void> {
    this.cache.clear()
    cacheLogger.info(`🧹 Cache ${this.name}: Limpiado completo`)
  }

  async stop(): Promise<void> {
    await this.clear()
    cacheLogger.info(`⏹️ Cache ${this.name}: Detenido`)
  }

  private evictOldest(): void {
    const oldest = Array.from(this.cache.entries()).reduce((a, b) =>
      a[1].timestamp < b[1].timestamp ? a : b
    )
    this.cache.delete(oldest[0])
    cacheLogger.debug(`♻️ Cache ${this.name}: Elemento más antiguo eliminado`, {
      key: oldest[0],
    })
  }
}

// Instancias de caché predefinidas
export const thumbnailCache = new CacheManager<Buffer>({
  name: 'thumbnails',
  ttl: 30 * 60 * 1000, // 30 minutos
  maxSize: 500,
  updateAgeOnGet: true,
  allowStale: true
})

export const metadataCache = new CacheManager<any>({
  name: 'metadata',
  ttl: 15 * 60 * 1000, // 15 minutos
  maxSize: 1000,
  updateAgeOnGet: true,
  allowStale: true
})

export const searchCache = new CacheManager<any>({
  name: 'search',
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  updateAgeOnGet: false,
  allowStale: true
})

export const statsCache = new CacheManager<any>({
  name: 'stats',
  ttl: 10 * 60 * 1000, // 10 minutos
  maxSize: 100,
  updateAgeOnGet: true,
  allowStale: true
})

export const charactersCache = new CacheManager<any>({
  name: 'characters',
  ttl: 15 * 60 * 1000, // 15 minutos
  maxSize: 200,
  updateAgeOnGet: true,
  allowStale: true
})

export const placesCache = new CacheManager<any>({
  name: 'places',
  ttl: 15 * 60 * 1000, // 15 minutos
  maxSize: 200,
  updateAgeOnGet: true,
  allowStale: true
})

export const objectsCache = new CacheManager<any>({
  name: 'objects',
  ttl: 15 * 60 * 1000, // 15 minutos
  maxSize: 200,
  updateAgeOnGet: true,
  allowStale: true
})
