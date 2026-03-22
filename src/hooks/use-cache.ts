import { useCallback, useEffect, useRef, useState } from 'react';
import {
	CacheConfig,
	CacheEvents,
	CacheManager,
	CacheStatistics,
	getCacheManager,
} from '../services/cache/cache-manager';
import { EntityStatsType } from '../types/file-browser/entity-stats';
import { FileItem } from '../types/file-browser/file-item';

interface UseCacheOptions {
	autoCleanup?: boolean;
	config?: Partial<CacheConfig>;
	enableStatistics?: boolean;
	events?: CacheEvents;
}

interface CacheHookResult {
	cacheDirectoryListing: (path: string, items: FileItem[], ttl?: number) => boolean;

	// File-specific operations
	cacheFileItem: (item: FileItem, ttl?: number) => boolean;
	cacheFileStats: (id: string, stats: EntityStatsType, ttl?: number) => boolean;
	cacheSearchResults: (query: string, results: FileItem[], ttl?: number) => boolean;
	cacheThumbnail: (id: string, thumbnail: string, ttl?: number) => boolean;

	// Management
	cleanup: () => void;
	clear: () => void;
	config: CacheConfig;
	delete: (key: string) => boolean;
	deleteByTag: (tag: string) => number;
	error: Error | null;
	evictLFU: (count?: number) => number;
	evictLRU: (count?: number) => number;
	// Core operations
	get: <T>(key: string) => T | null;

	// Tag operations
	getByTag: (tag: string) => Map<string, any>;
	getCachedDirectoryListing: (path: string) => FileItem[] | null;
	getCachedFileItem: (id: string) => FileItem | null;
	getCachedFileStats: (id: string) => EntityStatsType | null;
	getCachedSearchResults: (query: string) => FileItem[] | null;
	getCachedThumbnail: (id: string) => string | null;

	// Batch operations
	getMultiple: <T>(keys: string[]) => Map<string, T>;
	has: (key: string) => boolean;

	// State
	isReady: boolean;
	loadFromDisk: () => Promise<boolean>;

	// Persistence
	saveToDisk: () => Promise<boolean>;
	set: <T>(key: string, data: T, ttl?: number, tags?: string[]) => boolean;
	setMultiple: <T>(entries: Map<string, T>, ttl?: number, tags?: string[]) => boolean;

	// Statistics and config
	statistics: CacheStatistics;
	updateConfig: (newConfig: Partial<CacheConfig>) => void;
}

export const useCache = (options: UseCacheOptions = {}): CacheHookResult => {
	const { config = {}, events = {}, autoCleanup = true, enableStatistics = true } = options;

	const [cacheManager] = useState<CacheManager>(() => getCacheManager(config, events));
	const [statistics, setStatistics] = useState<CacheStatistics>(() => cacheManager.getStatistics());
	const [currentConfig, setCurrentConfig] = useState<CacheConfig>(() => cacheManager.getConfig());
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const statisticsIntervalRef = useRef<number | null>(null);

	// Initialize cache manager
	useEffect(() => {
		const initialize = async () => {
			try {
				await cacheManager.loadFromDisk();
				setIsReady(true);
			} catch (err) {
				setError(err as Error);
				setIsReady(true); // Still ready, just couldn't load from disk
			}
		};

		initialize();
	}, [cacheManager]);

	// Update statistics periodically
	useEffect(() => {
		if (!enableStatistics) {
			return;
		}

		const updateStats = () => {
			try {
				setStatistics(cacheManager.getStatistics());
			} catch (err) {
				setError(err as Error);
			}
		};

		// Update immediately
		updateStats();

		// Then update every 5 seconds
		statisticsIntervalRef.current = window.setInterval(updateStats, 5000);

		return () => {
			if (statisticsIntervalRef.current) {
				clearInterval(statisticsIntervalRef.current);
			}
		};
	}, [cacheManager, enableStatistics]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (autoCleanup) {
				cacheManager.cleanup();
			}
		};
	}, [cacheManager, autoCleanup]);

	// Core operations
	const get = useCallback(
		<T>(key: string): T | null => {
			try {
				return cacheManager.get<T>(key);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	const set = useCallback(
		<T>(key: string, data: T, ttl?: number, tags?: string[]): boolean => {
			try {
				return cacheManager.set(key, data, ttl, tags);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const deleteKey = useCallback(
		(key: string): boolean => {
			try {
				return cacheManager.delete(key);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const has = useCallback(
		(key: string): boolean => {
			try {
				return cacheManager.has(key);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const clear = useCallback((): void => {
		try {
			cacheManager.clear();
		} catch (err) {
			setError(err as Error);
		}
	}, [cacheManager]);

	// Batch operations
	const getMultiple = useCallback(
		<T>(keys: string[]): Map<string, T> => {
			try {
				return cacheManager.getMultiple<T>(keys);
			} catch (err) {
				setError(err as Error);
				return new Map();
			}
		},
		[cacheManager]
	);

	const setMultiple = useCallback(
		<T>(entries: Map<string, T>, ttl?: number, tags?: string[]): boolean => {
			try {
				return cacheManager.setMultiple(entries, ttl, tags);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	// Tag operations
	const getByTag = useCallback(
		(tag: string): Map<string, any> => {
			try {
				return cacheManager.getByTag(tag);
			} catch (err) {
				setError(err as Error);
				return new Map();
			}
		},
		[cacheManager]
	);

	const deleteByTag = useCallback(
		(tag: string): number => {
			try {
				return cacheManager.deleteByTag(tag);
			} catch (err) {
				setError(err as Error);
				return 0;
			}
		},
		[cacheManager]
	);

	// File-specific operations
	const cacheFileItem = useCallback(
		(item: FileItem, ttl?: number): boolean => {
			try {
				return cacheManager.cacheFileItem(item, ttl);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const getCachedFileItem = useCallback(
		(id: string): FileItem | null => {
			try {
				return cacheManager.getCachedFileItem(id);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	const cacheDirectoryListing = useCallback(
		(path: string, items: FileItem[], ttl?: number): boolean => {
			try {
				return cacheManager.cacheDirectoryListing(path, items, ttl);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const getCachedDirectoryListing = useCallback(
		(path: string): FileItem[] | null => {
			try {
				return cacheManager.getCachedDirectoryListing(path);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	const cacheFileStats = useCallback(
		(id: string, stats: EntityStatsType, ttl?: number): boolean => {
			try {
				return cacheManager.cacheFileStats(id, stats, ttl);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const getCachedFileStats = useCallback(
		(id: string): EntityStatsType | null => {
			try {
				return cacheManager.getCachedFileStats(id);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	const cacheThumbnail = useCallback(
		(id: string, thumbnail: string, ttl?: number): boolean => {
			try {
				return cacheManager.cacheThumbnail(id, thumbnail, ttl);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const getCachedThumbnail = useCallback(
		(id: string): string | null => {
			try {
				return cacheManager.getCachedThumbnail(id);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	const cacheSearchResults = useCallback(
		(query: string, results: FileItem[], ttl?: number): boolean => {
			try {
				return cacheManager.cacheSearchResults(query, results, ttl);
			} catch (err) {
				setError(err as Error);
				return false;
			}
		},
		[cacheManager]
	);

	const getCachedSearchResults = useCallback(
		(query: string): FileItem[] | null => {
			try {
				return cacheManager.getCachedSearchResults(query);
			} catch (err) {
				setError(err as Error);
				return null;
			}
		},
		[cacheManager]
	);

	// Management operations
	const cleanup = useCallback((): void => {
		try {
			cacheManager.cleanup();
		} catch (err) {
			setError(err as Error);
		}
	}, [cacheManager]);

	const evictLRU = useCallback(
		(count?: number): number => {
			try {
				return cacheManager.evictLRU(count);
			} catch (err) {
				setError(err as Error);
				return 0;
			}
		},
		[cacheManager]
	);

	const evictLFU = useCallback(
		(count?: number): number => {
			try {
				return cacheManager.evictLFU(count);
			} catch (err) {
				setError(err as Error);
				return 0;
			}
		},
		[cacheManager]
	);

	// Configuration
	const updateConfig = useCallback(
		(newConfig: Partial<CacheConfig>): void => {
			try {
				cacheManager.updateConfig(newConfig);
				setCurrentConfig(cacheManager.getConfig());
			} catch (err) {
				setError(err as Error);
			}
		},
		[cacheManager]
	);

	// Persistence
	const saveToDisk = useCallback(async (): Promise<boolean> => {
		try {
			return await cacheManager.saveToDisk();
		} catch (err) {
			setError(err as Error);
			return false;
		}
	}, [cacheManager]);

	const loadFromDisk = useCallback(async (): Promise<boolean> => {
		try {
			return await cacheManager.loadFromDisk();
		} catch (err) {
			setError(err as Error);
			return false;
		}
	}, [cacheManager]);

	return {
		// Core operations
		get,
		set,
		delete: deleteKey,
		has,
		clear,

		// Batch operations
		getMultiple,
		setMultiple,

		// Tag operations
		getByTag,
		deleteByTag,

		// File-specific operations
		cacheFileItem,
		getCachedFileItem,
		cacheDirectoryListing,
		getCachedDirectoryListing,
		cacheFileStats,
		getCachedFileStats,
		cacheThumbnail,
		getCachedThumbnail,
		cacheSearchResults,
		getCachedSearchResults,

		// Management
		cleanup,
		evictLRU,
		evictLFU,

		// Statistics and config
		statistics,
		config: currentConfig,
		updateConfig,

		// Persistence
		saveToDisk,
		loadFromDisk,

		// State
		isReady,
		error,
	};
};

// Specialized hooks for common use cases
export const useFileCache = (options: UseCacheOptions = {}) => {
	const cache = useCache(options);

	return {
		cacheFile: cache.cacheFileItem,
		getFile: cache.getCachedFileItem,
		cacheDirectory: cache.cacheDirectoryListing,
		getDirectory: cache.getCachedDirectoryListing,
		cacheStats: cache.cacheFileStats,
		getStats: cache.getCachedFileStats,
		cacheThumbnail: cache.cacheThumbnail,
		getThumbnail: cache.getCachedThumbnail,
		clearFileCache: () => cache.deleteByTag('file'),
		clearDirectoryCache: () => cache.deleteByTag('directory'),
		clearStatsCache: () => cache.deleteByTag('stats'),
		clearThumbnailCache: () => cache.deleteByTag('thumbnail'),
		statistics: cache.statistics,
		isReady: cache.isReady,
		error: cache.error,
	};
};

export const useSearchCache = (options: UseCacheOptions = {}) => {
	const cache = useCache(options);

	return {
		cacheResults: cache.cacheSearchResults,
		getResults: cache.getCachedSearchResults,
		clearSearchCache: () => cache.deleteByTag('search'),
		statistics: cache.statistics,
		isReady: cache.isReady,
		error: cache.error,
	};
};

export const useCacheStatistics = () => {
	const cache = useCache({ enableStatistics: true });

	return {
		statistics: cache.statistics,
		config: cache.config,
		updateConfig: cache.updateConfig,
		cleanup: cache.cleanup,
		evictLRU: cache.evictLRU,
		evictLFU: cache.evictLFU,
		clear: cache.clear,
		isReady: cache.isReady,
		error: cache.error,
	};
};
