/**
 * @file Sistema de cache inteligente para carpetas
 * @module lib/folder-cache
 * @description Cache optimizado para mejorar el rendimiento de consultas de carpetas ⚡
 */

import { serverLogger } from './logger/server-logger';

// Logger específico para el cache
const cacheLogger = serverLogger.withContext('FolderCache');

/**
 * Interfaz para entrada de cache
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * Interfaz para estadísticas de cache
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageAccessTime: number;
}

/**
 * 🚀 OPTIMIZACIÓN: Cache inteligente con TTL, LRU y estadísticas
 */
export class FolderCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    averageAccessTime: 0
  };

  constructor(
    private maxSize: number = 1000,
    private defaultTtl: number = 5 * 60 * 1000 // 5 minutos
  ) {
    // Limpiar cache expirado cada 2 minutos
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  /**
   * Obtiene un valor del cache
   */
  get<T>(key: string): T | null {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      cacheLogger.debug('Cache miss:', { key });
      return null;
    }

    // Verificar TTL
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      cacheLogger.debug('Cache expired:', { key, age: now - entry.timestamp });
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = now;
    this.stats.hits++;
    this.updateHitRate();

    const accessTime = Date.now() - startTime;
    this.updateAverageAccessTime(accessTime);

    cacheLogger.debug('Cache hit:', { key, accessCount: entry.accessCount });
    return entry.data;
  }

  /**
   * Almacena un valor en el cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.defaultTtl;

    // Verificar límite de tamaño (LRU eviction)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccess: now
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    cacheLogger.debug('Cache set:', {
      key,
      ttl: entryTtl,
      size: this.cache.size
    });
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
      cacheLogger.info('Cache invalidated:', { key });
    }
    return deleted;
  }

  /**
   * Invalida múltiples entradas que coinciden con un patrón
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.stats.size = this.cache.size;
      cacheLogger.info('Cache pattern invalidated:', { pattern: pattern.toString(), count });
    }

    return count;
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.cache.size;
      cacheLogger.info('Cache cleanup completed:', { cleaned, remaining: this.cache.size });
    }
  }

  /**
   * Evita la entrada menos recientemente usada (LRU)
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      cacheLogger.debug('LRU eviction:', { key: oldestKey });
    }
  }

  /**
   * Actualiza la tasa de aciertos
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? (this.stats.hits / this.stats.totalRequests) * 100
      : 0;
  }

  /**
   * Actualiza el tiempo promedio de acceso
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalTime = this.stats.averageAccessTime * (this.stats.hits - 1) + accessTime;
    this.stats.averageAccessTime = totalTime / this.stats.hits;
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.size = 0;
    cacheLogger.info('Cache cleared:', { previousSize: size });
  }

  /**
   * Obtiene el tamaño actual del cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * 🚀 INSTANCIAS DE CACHE OPTIMIZADAS
 */

// Cache principal para respuestas de carpetas
export const folderResponseCache = new FolderCache(500, 5 * 60 * 1000); // 5 min TTL

// Cache para estadísticas de carpetas (más corto)
export const folderStatsCache = new FolderCache(1000, 2 * 60 * 1000); // 2 min TTL

// Cache para listados de carpetas
export const folderListCache = new FolderCache(200, 3 * 60 * 1000); // 3 min TTL

/**
 * 🚀 HELPERS DE CACHE OPTIMIZADOS
 */

/**
 * Genera una clave de cache para una carpeta
 */
export function getFolderCacheKey(id: string, operation: string = 'get'): string {
  return `folder:${operation}:${id}`;
}

/**
 * Genera una clave de cache para estadísticas de carpeta
 */
export function getFolderStatsCacheKey(id: string): string {
  return `folder:stats:${id}`;
}

/**
 * Genera una clave de cache para listado de carpetas
 */
export function getFolderListCacheKey(filters?: any): string {
  const filterStr = filters ? JSON.stringify(filters) : 'all';
  return `folders:list:${Buffer.from(filterStr).toString('base64')}`;
}

/**
 * Invalida el cache relacionado con una carpeta específica
 */
export function invalidateFolderCache(folderId: string): void {
  folderResponseCache.invalidatePattern(`folder:.*:${folderId}`);
  folderStatsCache.invalidate(getFolderStatsCacheKey(folderId));
  folderListCache.invalidatePattern('folders:list:.*');

  cacheLogger.info('Folder cache invalidated:', { folderId });
}

/**
 * Invalida todo el cache de carpetas
 */
export function invalidateAllFolderCache(): void {
  folderResponseCache.clear();
  folderStatsCache.clear();
  folderListCache.clear();

  cacheLogger.info('All folder cache invalidated');
}

/**
 * Obtiene estadísticas combinadas de todos los caches
 */
export function getAllCacheStats() {
  return {
    folderResponse: folderResponseCache.getStats(),
    folderStats: folderStatsCache.getStats(),
    folderList: folderListCache.getStats()
  };
}
