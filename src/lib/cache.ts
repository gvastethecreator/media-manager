import LRUCache from 'lru-cache'

interface CacheOptions {
  max?: number
  ttl?: number
  updateAgeOnGet?: boolean
  allowStale?: boolean
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

class CacheManager<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>
  private defaultTTL: number
  private updateAgeOnGet: boolean
  private allowStale: boolean

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 1000 * 60 * 60 // 1 hora por defecto
    this.updateAgeOnGet = options.updateAgeOnGet ?? true
    this.allowStale = options.allowStale ?? false

    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: options.max || 500,
      ttlAutopurge: true,
      allowStale: this.allowStale,
      updateAgeOnGet: this.updateAgeOnGet,
      ttl: this.defaultTTL,
    })
  }

  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl && !this.allowStale) {
      this.cache.delete(key)
      return undefined
    }

    if (this.updateAgeOnGet) {
      entry.timestamp = now
      this.cache.set(key, entry)
    }

    return entry.value
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async prune(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys())
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async size(): Promise<number> {
    return this.cache.size
  }
}

// Crear instancias específicas para diferentes tipos de caché
export const thumbnailCache = new CacheManager<string>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 horas
  updateAgeOnGet: true,
  allowStale: true // Permitir usar thumbnails expirados mientras se regeneran
})

export const metadataCache = new CacheManager<Record<string, any>>({
  max: 5000,
  ttl: 1000 * 60 * 60, // 1 hora
  updateAgeOnGet: true
})

export const searchCache = new CacheManager<any[]>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutos
  updateAgeOnGet: false // No actualizar edad en búsquedas
})

// Limpiar caches periódicamente
const cleanupInterval = 1000 * 60 * 15 // 15 minutos

if (typeof window !== 'undefined') {
  setInterval(() => {
    Promise.all([
      thumbnailCache.prune(),
      metadataCache.prune(),
      searchCache.prune()
    ]).catch(console.error)
  }, cleanupInterval)
}
