/**
 * @file Caché de respuestas de carpetas
 * @module lib/folder-cache
 * @description Sistema de caché para respuestas de carpetas con LRU
 */

import { clientLogger } from '@/lib/logger/client-logger';

const cacheLogger = clientLogger.withContext('FolderCache');

/**
 * Clase para implementar un caché LRU (Least Recently Used)
 * para respuestas de carpetas y otros datos
 */
class FolderResponseCache {
  private cache: Map<string, any>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    cacheLogger.info(`🔄 Inicializando caché con tamaño máximo ${maxSize}`);
  }

  /**
   * Obtiene un valor de la caché
   * @param key Clave para buscar
   * @returns El valor almacenado o undefined si no existe
   */
  get(key: string): any {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Actualizar el orden LRU
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      cacheLogger.debug(`✅ Cache hit: ${key}`);
      return value;
    }

    this.misses++;
    cacheLogger.debug(`❌ Cache miss: ${key}`);
    return undefined;
  }

  /**
   * Almacena un valor en la caché
   * @param key Clave para almacenar
   * @param value Valor a almacenar
   */
  set(key: string, value: any): void {
    // Si la clave ya existe, eliminarla primero para actualizar el orden LRU
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Si la caché está llena, eliminar la entrada más antigua
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        cacheLogger.debug(`🧹 Eliminando entrada más antigua: ${oldestKey}`);
      }
    }

    this.cache.set(key, value);
    cacheLogger.debug(`💾 Cache set: ${key}`);
  }

  /**
   * Elimina una entrada específica de la caché
   * @param key Clave a eliminar
   * @returns true si se eliminó la entrada, false si no existía
   */
  delete(key: string): boolean {
    cacheLogger.debug(`🗑️ Eliminando de caché: ${key}`);
    return this.cache.delete(key);
  }

  /**
   * Elimina todas las entradas de la caché que coincidan con un patrón
   * @param pattern Patrón para filtrar las claves (opcional)
   */
  clear(pattern?: string): void {
    if (!pattern) {
      cacheLogger.info('🧹 Limpiando toda la caché');
      this.cache.clear();
      return;
    }

    // Eliminar solo las entradas que coincidan con el patrón
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    cacheLogger.info(`🧹 Limpiadas ${keysToDelete.length} entradas con patrón: ${pattern}`);
  }

  /**
   * Obtiene estadísticas de la caché
   * @returns Objeto con estadísticas
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: hitRate,
      hits: this.hits,
      misses: this.misses,
      totalRequests
    };
  }
}

// Exportar una instancia única para toda la aplicación
export const folderResponseCache = new FolderResponseCache(200);

// 🚀 Cache específico para listas de carpetas (puede tener un TTL diferente o tamaño)
export const folderListCache = new FolderResponseCache(50); // Tamaño menor, podría ser más volátil

// 🚀 Funciones para generar claves de cache consistentes

/**
 * Genera una clave de caché para una lista de carpetas, opcionalmente con filtros.
 * @param filters Filtros aplicados a la lista de carpetas.
 * @returns Clave de caché para la lista de carpetas.
 */
export function getFolderListCacheKey(filters?: Record<string, any>): string {
  if (filters && Object.keys(filters).length > 0) {
    // Crear una cadena consistente a partir de los filtros
    const filterString = Object.entries(filters)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${String(value)}`)
      .join('|');
    return `folders:list:${filterString}`;
  }
  return 'folders:list:all';
}

/**
 * Genera una clave de caché para una carpeta específica.
 * @param folderId ID de la carpeta.
 * @param operationTipo de operación (ej. 'get', 'metadata'). Opcional.
 * @returns Clave de caché para la carpeta.
 */
export function getFolderCacheKey(folderId: string, operation?: string): string {
  if (operation) {
    return `folder:${folderId}:${operation}`;
  }
  return `folder:${folderId}`;
}