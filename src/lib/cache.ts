import { LRUCache } from 'lru-cache'

interface CacheOptions {
  max?: number
  ttl?: number
}

interface CacheEntry {
  value: any
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache: Map<string, CacheEntry>
  private max: number
  private defaultTTL: number

  constructor(options: CacheOptions = {}) {
    this.cache = new Map()
    this.max = options.max || 500
    this.defaultTTL = options.ttl || 1000 * 60 * 60 // 1 hora por defecto
  }

  async get(key: string): Promise<any | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Verificar si el valor ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Si alcanzamos el límite, eliminar la entrada más antigua
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

// Crear instancias específicas para diferentes tipos de caché
export const thumbnailCache = new CacheManager({
  max: 1000, // Máximo 1000 thumbnails en caché
  ttl: 1000 * 60 * 60 * 24, // 24 horas
})

export const metadataCache = new CacheManager({
  max: 5000, // Máximo 5000 metadatos en caché
  ttl: 1000 * 60 * 60, // 1 hora
})

export const searchCache = new CacheManager({
  max: 100, // Máximo 100 resultados de búsqueda
  ttl: 1000 * 60 * 5, // 5 minutos
})
