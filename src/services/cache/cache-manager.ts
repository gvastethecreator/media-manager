import { EntityStatsType } from '../../types/file-browser/entity-stats';
import { FileItem } from '../../types/file-browser/file-item';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
	accessCount: number;
	lastAccessed: number;
	size: number;
	tags: string[];
}

interface CacheConfig {
	maxSize: number; // Maximum cache size in bytes
	maxEntries: number; // Maximum number of entries
	defaultTtl: number; // Default TTL in milliseconds
	cleanupInterval: number; // Cleanup interval in milliseconds
	compressionEnabled: boolean;
	persistToDisk: boolean;
	diskCachePath?: string;
}

interface CacheStatistics {
	hits: number;
	misses: number;
	evictions: number;
	totalSize: number;
	entryCount: number;
	hitRate: number;
	averageAccessTime: number;
	memoryUsage: number;
}

interface CacheEvents {
	onHit?: (key: string, entry: CacheEntry<any>) => void;
	onMiss?: (key: string) => void;
	onSet?: (key: string, entry: CacheEntry<any>) => void;
	onEvict?: (key: string, entry: CacheEntry<any>) => void;
	onClear?: () => void;
	onError?: (error: Error, operation: string) => void;
}

type CacheKey = string;
type CacheValue = any;

export class CacheManager {
	private cache = new Map<CacheKey, CacheEntry<CacheValue>>();
	private config: CacheConfig;
	private statistics: CacheStatistics;
	private events: CacheEvents;
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;
	private accessTimes: number[] = [];

	constructor(config: Partial<CacheConfig> = {}, events: CacheEvents = {}) {
		this.config = {
			maxSize: 100 * 1024 * 1024, // 100MB
			maxEntries: 10_000,
			defaultTtl: 30 * 60 * 1000, // 30 minutes
			cleanupInterval: 5 * 60 * 1000, // 5 minutes
			compressionEnabled: false,
			persistToDisk: false,
			...config,
		};

		this.events = events;

		this.statistics = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalSize: 0,
			entryCount: 0,
			hitRate: 0,
			averageAccessTime: 0,
			memoryUsage: 0,
		};

		this.startCleanupTimer();
		this.loadFromDisk();
	}

	// Core cache operations
	get<T>(key: CacheKey): T | null {
		const startTime = performance.now();

		try {
			const entry = this.cache.get(key);

			if (!entry) {
				this.statistics.misses++;
				this.events.onMiss?.(key);
				return null;
			}

			// Check if entry has expired
			if (this.isExpired(entry)) {
				this.cache.delete(key);
				this.updateStatistics();
				this.statistics.misses++;
				this.events.onMiss?.(key);
				return null;
			}

			// Update access information
			entry.accessCount++;
			entry.lastAccessed = Date.now();

			this.statistics.hits++;
			this.recordAccessTime(performance.now() - startTime);
			this.events.onHit?.(key, entry);

			return entry.data as T;
		} catch (error) {
			this.events.onError?.(error as Error, 'get');
			return null;
		}
	}

	set<T>(key: CacheKey, data: T, ttl?: number, tags: string[] = []): boolean {
		try {
			const entryTtl = ttl ?? this.config.defaultTtl;
			const size = this.calculateSize(data);

			// Check if we need to make space
			if (!this.canFit(size)) {
				this.evictEntries(size);
			}

			const entry: CacheEntry<T> = {
				data,
				timestamp: Date.now(),
				ttl: entryTtl,
				accessCount: 0,
				lastAccessed: Date.now(),
				size,
				tags,
			};

			// Remove existing entry if it exists
			if (this.cache.has(key)) {
				const oldEntry = this.cache.get(key);
				if (oldEntry) {
					this.statistics.totalSize -= oldEntry.size;
				}
			}

			this.cache.set(key, entry);
			this.statistics.totalSize += size;
			this.updateStatistics();
			this.events.onSet?.(key, entry);

			return true;
		} catch (error) {
			this.events.onError?.(error as Error, 'set');
			return false;
		}
	}

	delete(key: CacheKey): boolean {
		try {
			const entry = this.cache.get(key);
			if (entry) {
				this.cache.delete(key);
				this.statistics.totalSize -= entry.size;
				this.updateStatistics();
				this.events.onEvict?.(key, entry);
				return true;
			}
			return false;
		} catch (error) {
			this.events.onError?.(error as Error, 'delete');
			return false;
		}
	}

	has(key: CacheKey): boolean {
		const entry = this.cache.get(key);
		return entry ? !this.isExpired(entry) : false;
	}

	clear(): void {
		try {
			this.cache.clear();
			this.statistics.totalSize = 0;
			this.statistics.entryCount = 0;
			this.events.onClear?.();
		} catch (error) {
			this.events.onError?.(error as Error, 'clear');
		}
	}

	// Advanced operations
	getMultiple<T>(keys: CacheKey[]): Map<CacheKey, T> {
		const results = new Map<CacheKey, T>();

		for (const key of keys) {
			const value = this.get<T>(key);
			if (value !== null) {
				results.set(key, value);
			}
		}

		return results;
	}

	setMultiple<T>(entries: Map<CacheKey, T>, ttl?: number, tags: string[] = []): boolean {
		let success = true;

		for (const [key, value] of entries) {
			if (!this.set(key, value, ttl, tags)) {
				success = false;
			}
		}

		return success;
	}

	getByTag(tag: string): Map<CacheKey, CacheValue> {
		const results = new Map<CacheKey, CacheValue>();

		for (const [key, entry] of this.cache) {
			if (entry.tags.includes(tag) && !this.isExpired(entry)) {
				results.set(key, entry.data);
			}
		}

		return results;
	}

	deleteByTag(tag: string): number {
		let deletedCount = 0;
		const keysToDelete: CacheKey[] = [];

		for (const [key, entry] of this.cache) {
			if (entry.tags.includes(tag)) {
				keysToDelete.push(key);
			}
		}

		for (const key of keysToDelete) {
			if (this.delete(key)) {
				deletedCount++;
			}
		}

		return deletedCount;
	}

	// File-specific cache methods
	cacheFileItem(item: FileItem, ttl?: number): boolean {
		return this.set(`file:${item.id}`, item, ttl, ['file', 'item']);
	}

	getCachedFileItem(id: string): FileItem | null {
		return this.get<FileItem>(`file:${id}`);
	}

	cacheDirectoryListing(path: string, items: FileItem[], ttl?: number): boolean {
		return this.set(`dir:${path}`, items, ttl, ['directory', 'listing']);
	}

	getCachedDirectoryListing(path: string): FileItem[] | null {
		return this.get<FileItem[]>(`dir:${path}`);
	}

	cacheFileStats(id: string, stats: EntityStatsType, ttl?: number): boolean {
		return this.set(`stats:${id}`, stats, ttl, ['stats', 'file']);
	}

	getCachedFileStats(id: string): EntityStatsType | null {
		return this.get<EntityStatsType>(`stats:${id}`);
	}

	cacheThumbnail(id: string, thumbnail: string, ttl?: number): boolean {
		return this.set(`thumb:${id}`, thumbnail, ttl, ['thumbnail', 'image']);
	}

	getCachedThumbnail(id: string): string | null {
		return this.get<string>(`thumb:${id}`);
	}

	cacheSearchResults(query: string, results: FileItem[], ttl?: number): boolean {
		const key = `search:${this.hashString(query)}`;
		return this.set(key, results, ttl, ['search', 'results']);
	}

	getCachedSearchResults(query: string): FileItem[] | null {
		const key = `search:${this.hashString(query)}`;
		return this.get<FileItem[]>(key);
	}

	// Cache management
	cleanup(): void {
		const now = Date.now();
		const keysToDelete: CacheKey[] = [];

		for (const [key, entry] of this.cache) {
			if (this.isExpired(entry)) {
				keysToDelete.push(key);
			}
		}

		for (const key of keysToDelete) {
			this.delete(key);
		}
	}

	evictLRU(count = 1): number {
		const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

		let evicted = 0;
		for (let i = 0; i < Math.min(count, entries.length); i++) {
			const [key] = entries[i];
			if (this.delete(key)) {
				evicted++;
				this.statistics.evictions++;
			}
		}

		return evicted;
	}

	evictLFU(count = 1): number {
		const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.accessCount - b.accessCount);

		let evicted = 0;
		for (let i = 0; i < Math.min(count, entries.length); i++) {
			const [key] = entries[i];
			if (this.delete(key)) {
				evicted++;
				this.statistics.evictions++;
			}
		}

		return evicted;
	}

	// Statistics and monitoring
	getStatistics(): CacheStatistics {
		this.updateStatistics();
		return { ...this.statistics };
	}

	getConfig(): CacheConfig {
		return { ...this.config };
	}

	updateConfig(newConfig: Partial<CacheConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// Restart cleanup timer if interval changed
		if (newConfig.cleanupInterval !== undefined) {
			this.stopCleanupTimer();
			this.startCleanupTimer();
		}
	}

	// Persistence
	async saveToDisk(): Promise<boolean> {
		if (!this.config.persistToDisk || typeof window === 'undefined') {
			return false;
		}

		try {
			const data = {
				cache: Array.from(this.cache.entries()),
				statistics: this.statistics,
				timestamp: Date.now(),
			};

			localStorage.setItem('cache-manager-data', JSON.stringify(data));
			return true;
		} catch (error) {
			this.events.onError?.(error as Error, 'saveToDisk');
			return false;
		}
	}

	async loadFromDisk(): Promise<boolean> {
		if (!this.config.persistToDisk || typeof window === 'undefined') {
			return false;
		}

		try {
			const stored = localStorage.getItem('cache-manager-data');
			if (!stored) {
				return false;
			}

			const data = JSON.parse(stored);

			// Check if data is not too old (24 hours)
			if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
				localStorage.removeItem('cache-manager-data');
				return false;
			}

			this.cache = new Map(data.cache);
			this.statistics = { ...this.statistics, ...data.statistics };

			return true;
		} catch (error) {
			this.events.onError?.(error as Error, 'loadFromDisk');
			return false;
		}
	}

	// Utility methods
	private isExpired(entry: CacheEntry<any>): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private calculateSize(data: any): number {
		try {
			return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
		} catch {
			return 1000; // Default size for non-serializable data
		}
	}

	private canFit(size: number): boolean {
		return (
			this.statistics.totalSize + size <= this.config.maxSize && this.statistics.entryCount < this.config.maxEntries
		);
	}

	private evictEntries(requiredSize: number): void {
		// First, try to clean up expired entries
		this.cleanup();

		// If still not enough space, evict LRU entries
		while (
			(this.statistics.totalSize + requiredSize > this.config.maxSize ||
				this.statistics.entryCount >= this.config.maxEntries) &&
			this.cache.size > 0
		) {
			this.evictLRU(1);
		}
	}

	private updateStatistics(): void {
		this.statistics.entryCount = this.cache.size;
		this.statistics.hitRate = this.statistics.hits / (this.statistics.hits + this.statistics.misses) || 0;
		this.statistics.averageAccessTime =
			this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length || 0;
		this.statistics.memoryUsage = this.statistics.totalSize;
	}

	private recordAccessTime(time: number): void {
		this.accessTimes.push(time);
		if (this.accessTimes.length > 1000) {
			this.accessTimes = this.accessTimes.slice(-500); // Keep last 500 measurements
		}
	}

	private hashString(str: string): string {
		// Hash sin bitwise: rolling multiplicative hash en módulo 2^32
		let hash = 2_166_136_261; // base
		for (let i = 0; i < str.length; i++) {
			const code = str.charCodeAt(i);
			hash = (hash * 16_777_619) % 4_294_967_296;
			hash = (hash + code) % 4_294_967_296;
		}
		return Math.floor(hash).toString(36);
	}

	private startCleanupTimer(): void {
		this.cleanupTimer = setInterval(() => {
			this.cleanup();
			if (this.config.persistToDisk) {
				this.saveToDisk();
			}
		}, this.config.cleanupInterval);
	}

	private stopCleanupTimer(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
	}

	// Cleanup on destruction
	destroy(): void {
		this.stopCleanupTimer();
		if (this.config.persistToDisk) {
			this.saveToDisk();
		}
		this.cache.clear();
	}
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export const getCacheManager = (config?: Partial<CacheConfig>, events?: CacheEvents): CacheManager => {
	if (!cacheManagerInstance) {
		cacheManagerInstance = new CacheManager(config, events);
	}
	return cacheManagerInstance;
};

export const resetCacheManager = (): void => {
	if (cacheManagerInstance) {
		cacheManagerInstance.destroy();
		cacheManagerInstance = null;
	}
};

// Export types
export type { CacheConfig, CacheStatistics, CacheEvents, CacheEntry };
