/**
 * @file File Browser Cache Service
 * @module services/cache/file-browser-cache
 * @description Sistema de caché especializado para el navegador de archivos con LRU eviction
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileItem } from '@/types/file-browser/file-item';

const cacheLogger = clientLogger.withContext('FileBrowserCache');

// Configuración del caché
interface CacheConfig {
	maxThumbnails: number;
	maxMetadata: number;
	maxDirectoryListings: number;
	thumbnailTTL: number; // Time to live en ms
	metadataTTL: number;
	directoryTTL: number;
	cleanupInterval: number;
}

const DEFAULT_CONFIG: CacheConfig = {
	maxThumbnails: 500,
	maxMetadata: 1000,
	maxDirectoryListings: 100,
	thumbnailTTL: 30 * 60 * 1000, // 30 minutos
	metadataTTL: 15 * 60 * 1000, // 15 minutos
	directoryTTL: 5 * 60 * 1000, // 5 minutos
	cleanupInterval: 60 * 1000, // 1 minuto
};

// Tipos de entrada de caché
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	accessCount: number;
	lastAccessed: number;
	size: number; // Tamaño estimado en bytes
}

interface ThumbnailCacheEntry extends CacheEntry<string> {
	quality: 'low' | 'medium' | 'high';
	dimensions: { width: number; height: number };
}

interface MetadataCacheEntry extends CacheEntry<Partial<AnyEntityWithStats>> {
	entityType: string;
}

interface DirectoryCacheEntry extends CacheEntry<FileItem[]> {
	path: string;
	itemCount: number;
}

// Implementación de caché LRU
class LRUCache<K, V extends CacheEntry<any>> {
	private readonly cache = new Map<K, V>();
	private readonly maxSize: number;
	private readonly ttl: number;

	constructor(maxSize: number, ttl: number) {
		this.maxSize = maxSize;
		this.ttl = ttl;
	}

	get(key: K): V['data'] | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		// Verificar TTL
		if (Date.now() - entry.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}

		// Actualizar estadísticas de acceso
		entry.lastAccessed = Date.now();
		entry.accessCount++;

		// Mover al final (más reciente)
		this.cache.delete(key);
		this.cache.set(key, entry);

		return entry.data;
	}

	set(key: K, data: V['data'], metadata: Partial<V> = {}): void {
		const entry = {
			data,
			timestamp: Date.now(),
			accessCount: 1,
			lastAccessed: Date.now(),
			size: this.estimateSize(data),
			...metadata,
		} as V;

		// Si ya existe, actualizar
		if (this.cache.has(key)) {
			this.cache.delete(key);
		}

		// Verificar límite de tamaño
		while (this.cache.size >= this.maxSize) {
			this.evictLeastRecentlyUsed();
		}

		this.cache.set(key, entry);
	}

	has(key: K): boolean {
		const entry = this.cache.get(key);
		if (!entry) {
			return false;
		}

		// Verificar TTL
		if (Date.now() - entry.timestamp > this.ttl) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: K): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	size(): number {
		return this.cache.size;
	}

	// Estadísticas del caché
	getStats() {
		const entries = Array.from(this.cache.values());
		const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
		const avgAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length || 0;

		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			totalSizeBytes: totalSize,
			averageAccessCount: avgAccessCount,
			oldestEntry: Math.min(...entries.map((e) => e.timestamp)),
			newestEntry: Math.max(...entries.map((e) => e.timestamp)),
		};
	}

	// Limpiar entradas expiradas
	cleanup(): number {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.ttl) {
				this.cache.delete(key);
				cleaned++;
			}
		}

		return cleaned;
	}

	public evictLeastRecentlyUsed(): void {
		let oldestKey: K | null = null;
		let oldestTime = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (entry.lastAccessed < oldestTime) {
				oldestTime = entry.lastAccessed;
				oldestKey = key;
			}
		}

		if (oldestKey !== null) {
			this.cache.delete(oldestKey);
		}
	}

	private estimateSize(data: any): number {
		if (typeof data === 'string') {
			return data.length * 2; // UTF-16
		}
		if (Array.isArray(data)) {
			return data.length * 100; // Estimación para arrays
		}
		if (typeof data === 'object') {
			return JSON.stringify(data).length * 2;
		}
		return 50; // Valor por defecto
	}
}

/**
 * Servicio de caché especializado para el navegador de archivos
 */
export class FileBrowserCacheService {
	private readonly thumbnailCache: LRUCache<string, ThumbnailCacheEntry>;
	private readonly metadataCache: LRUCache<string, MetadataCacheEntry>;
	private readonly directoryCache: LRUCache<string, DirectoryCacheEntry>;
	private config: CacheConfig;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(config: Partial<CacheConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		this.thumbnailCache = new LRUCache(this.config.maxThumbnails, this.config.thumbnailTTL);
		this.metadataCache = new LRUCache(this.config.maxMetadata, this.config.metadataTTL);
		this.directoryCache = new LRUCache(this.config.maxDirectoryListings, this.config.directoryTTL);

		this.startCleanupInterval();
		cacheLogger.info('FileBrowserCacheService inicializado', this.config);
	}

	// Gestión de thumbnails
	cacheThumbnail(
		entityId: string,
		thumbnailUrl: string,
		quality: 'low' | 'medium' | 'high' = 'medium',
		dimensions: { width: number; height: number } = { width: 0, height: 0 }
	): void {
		this.thumbnailCache.set(entityId, thumbnailUrl, {
			quality,
			dimensions,
		});
		cacheLogger.debug(`Thumbnail cacheado: ${entityId}`, { quality, dimensions });
	}

	getThumbnail(entityId: string): string | null {
		return this.thumbnailCache.get(entityId);
	}

	hasThumbnail(entityId: string): boolean {
		return this.thumbnailCache.has(entityId);
	}

	// Gestión de metadata
	cacheMetadata(entityId: string, metadata: Partial<AnyEntityWithStats>, entityType: string): void {
		this.metadataCache.set(entityId, metadata, {
			entityType,
		});
		cacheLogger.debug(`Metadata cacheada: ${entityId}`, { entityType });
	}

	getMetadata(entityId: string): Partial<AnyEntityWithStats> | null {
		return this.metadataCache.get(entityId);
	}

	hasMetadata(entityId: string): boolean {
		return this.metadataCache.has(entityId);
	}

	// Gestión de listados de directorios
	cacheDirectoryListing(path: string, items: FileItem[]): void {
		this.directoryCache.set(path, items, {
			path,
			itemCount: items.length,
		});
		cacheLogger.debug(`Directorio cacheado: ${path}`, { itemCount: items.length });
	}

	getDirectoryListing(path: string): FileItem[] | null {
		return this.directoryCache.get(path);
	}

	hasDirectoryListing(path: string): boolean {
		return this.directoryCache.has(path);
	}

	// Operaciones de limpieza
	invalidateEntity(entityId: string): void {
		this.thumbnailCache.delete(entityId);
		this.metadataCache.delete(entityId);
		cacheLogger.debug(`Entidad invalidada: ${entityId}`);
	}

	invalidateDirectory(path: string): void {
		this.directoryCache.delete(path);
		cacheLogger.debug(`Directorio invalidado: ${path}`);
	}

	clearThumbnails(): void {
		this.thumbnailCache.clear();
		cacheLogger.info('Cache de thumbnails limpiado');
	}

	clearMetadata(): void {
		this.metadataCache.clear();
		cacheLogger.info('Cache de metadata limpiado');
	}

	clearDirectories(): void {
		this.directoryCache.clear();
		cacheLogger.info('Cache de directorios limpiado');
	}

	clearAll(): void {
		this.clearThumbnails();
		this.clearMetadata();
		this.clearDirectories();
		cacheLogger.info('Todos los caches limpiados');
	}

	// Estadísticas y monitoreo
	getStats() {
		return {
			thumbnails: this.thumbnailCache.getStats(),
			metadata: this.metadataCache.getStats(),
			directories: this.directoryCache.getStats(),
			config: this.config,
		};
	}

	// Configuración dinámica
	updateConfig(newConfig: Partial<CacheConfig>): void {
		this.config = { ...this.config, ...newConfig };
		cacheLogger.info('Configuración de cache actualizada', this.config);
	}

	/**
	 * Clear expired entries from all caches
	 */
	clearExpired(): void {
		const beforeStats = this.getStats();

		this.thumbnailCache.cleanup();
		this.metadataCache.cleanup();
		this.directoryCache.cleanup();

		const afterStats = this.getStats();
		const clearedCount =
			beforeStats.thumbnails.size -
			afterStats.thumbnails.size +
			(beforeStats.metadata.size - afterStats.metadata.size) +
			(beforeStats.directories.size - afterStats.directories.size);

		if (clearedCount > 0) {
			cacheLogger.info(`🧹 Cleared ${clearedCount} expired cache entries`);
		}
	}

	/**
	 * Optimize cache by removing least recently used entries if memory usage is high
	 */
	optimizeMemoryUsage(): void {
		const stats = this.getStats();
		const totalMemoryMB =
			(stats.thumbnails.totalSizeBytes + stats.metadata.totalSizeBytes + stats.directories.totalSizeBytes) /
			(1024 * 1024);

		// If using more than 50MB, clear some entries
		if (totalMemoryMB > 50) {
			// Clear oldest entries from each cache
			const thumbnailsToRemove = Math.floor(stats.thumbnails.size * 0.3);
			const metadataToRemove = Math.floor(stats.metadata.size * 0.3);
			const directoriesToRemove = Math.floor(stats.directories.size * 0.3);

			// Clear oldest entries by forcing eviction
			for (let i = 0; i < thumbnailsToRemove; i++) {
				this.thumbnailCache.evictLeastRecentlyUsed();
			}
			for (let i = 0; i < metadataToRemove; i++) {
				this.metadataCache.evictLeastRecentlyUsed();
			}
			for (let i = 0; i < directoriesToRemove; i++) {
				this.directoryCache.evictLeastRecentlyUsed();
			}

			cacheLogger.info(`🧹 Optimized cache memory usage (was ${totalMemoryMB.toFixed(1)}MB)`);
		}
	}

	/**
	 * Preload cache with frequently accessed items
	 */
	async preloadFrequentItems(items: string[]): Promise<void> {
		cacheLogger.info(`🚀 Preloading ${items.length} frequent items`);

		for (const item of items) {
			// This would typically load from a persistent store or API
			// For now, we'll just mark them as accessed
			if (this.hasMetadata(item)) {
				this.getMetadata(item); // This updates access count
			}
		}
	}

	// Gestión del intervalo de limpieza
	private startCleanupInterval(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		this.cleanupInterval = setInterval(() => {
			// Clear expired entries
			this.clearExpired();

			// Optimize memory usage
			this.optimizeMemoryUsage();

			const thumbnailsCleaned = this.thumbnailCache.cleanup();
			const metadataCleaned = this.metadataCache.cleanup();
			const directoriesCleaned = this.directoryCache.cleanup();

			const totalCleaned = thumbnailsCleaned + metadataCleaned + directoriesCleaned;
			if (totalCleaned > 0) {
				cacheLogger.debug(`Limpieza automática: ${totalCleaned} entradas eliminadas`, {
					thumbnails: thumbnailsCleaned,
					metadata: metadataCleaned,
					directories: directoriesCleaned,
				});
			}
		}, this.config.cleanupInterval);
	}

	// Destructor
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.clearAll();
		cacheLogger.info('FileBrowserCacheService destruido');
	}
}

// Instancia singleton
let instance: FileBrowserCacheService | null = null;

export const getFileBrowserCache = (config?: Partial<CacheConfig>): FileBrowserCacheService => {
	if (!instance) {
		instance = new FileBrowserCacheService(config);
	}
	return instance;
};

export const resetFileBrowserCache = (): void => {
	if (instance) {
		instance.destroy();
		instance = null;
	}
};

// Exportar tipos
export type { CacheConfig, ThumbnailCacheEntry, MetadataCacheEntry, DirectoryCacheEntry };
