import type { FileMetadata } from '@/types/metadata';
import { logger } from './logger';

const cacheLogger = logger.withContext('Cache');

interface CacheOptions {
	ttl?: number; // Time to live in milliseconds
	maxSize?: number; // Maximum number of items in cache
	name?: string; // Cache name for logging
	updateAgeOnGet?: boolean; // Update item age on get
	allowStale?: boolean; // Allow returning stale items
}

export class CacheManager<T> {
	private cache: Map<string, { value: T; timestamp: number }>;
	private ttl: number;
	private maxSize: number;
	private name: string;
	private updateAgeOnGet: boolean;
	private allowStale: boolean;

	constructor(options: CacheOptions = {}) {
		this.cache = new Map();
		this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes by default
		this.maxSize = options.maxSize || 1000;
		this.name = options.name || 'default';
		this.updateAgeOnGet = options.updateAgeOnGet || false;
		this.allowStale = options.allowStale || false;
	}

	// Función para normalizar las claves para evitar discrepancias
	private normalizeKey(key: string): string {
		if (!key) {
			return '';
		}

		// Almacenar la clave original para logging
		const originalKey = key;

		// 1. Normalizar separadores y eliminar duplicados
		let normalizedKey = key
			.replace(/\\/g, '/') // Reemplazar todas las barras invertidas por barras normales
			.replace(/([a-z]):\/+/i, '$1:/') // Normalizar el formato de unidad Windows (C:/ o C:\)
			.replace(/\/+/g, '/'); // Eliminar barras duplicadas

		// 2. Convertir a minúsculas para comparación consistente
		normalizedKey = normalizedKey.toLowerCase();

		// 3. Corregir variaciones específicas observadas
		normalizedKey = normalizedKey
			.replace(/outpu+ts/gi, 'outputs') // Corregir cualquier variación de 'outputs' con múltiples 'u'
			.replace(/outp+uts/gi, 'outputs') // Corregir variaciones con múltiples 'p'
			.replace(/s+dmatrix/gi, 'sdmatrix'); // Corregir cualquier variación de 'sdmatrix'

		// 4. Asegurar estructura consistente para #outputs
		if (normalizedKey.includes('#outputs') && !normalizedKey.includes('/#outputs/')) {
			normalizedKey = normalizedKey.replace(/(.*)\/?#outputs\/?(.*)/, '$1/#outputs/$2');
		}

		if (originalKey !== normalizedKey) {
			cacheLogger.debug(`🔑 Cache ${this.name}: Normalizando clave:`, {
				original: originalKey,
				normalized: normalizedKey,
			});
		}

		return normalizedKey;
	}

	async set(key: string, value: T, _customTtl?: number): Promise<void> {
		const normalizedKey = this.normalizeKey(key);

		if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		this.cache.set(normalizedKey, {
			value,
			timestamp: Date.now(),
		});

		cacheLogger.debug(`✨ Cache ${this.name}: Elemento agregado`, { key: normalizedKey });
	}

	async get(key: string): Promise<T | undefined> {
		const normalizedKey = this.normalizeKey(key);
		const item = this.cache.get(normalizedKey);

		if (!item) {
			return undefined;
		}

		const now = Date.now();
		const isExpired = now - item.timestamp > this.ttl;

		if (isExpired && !this.allowStale) {
			this.cache.delete(normalizedKey);
			cacheLogger.debug(`🕒 Cache ${this.name}: Elemento expirado`, { key: normalizedKey });
			return undefined;
		}

		if (this.updateAgeOnGet) {
			item.timestamp = now;
		}

		return item.value;
	}

	async delete(key: string): Promise<void> {
		const normalizedKey = this.normalizeKey(key);
		this.cache.delete(normalizedKey);
		cacheLogger.debug(`🗑️ Cache ${this.name}: Elemento eliminado`, { key: normalizedKey });
	}

	async clear(): Promise<void> {
		this.cache.clear();
		cacheLogger.info(`🧹 Cache ${this.name}: Limpiado completo`);
	}

	async stop(): Promise<void> {
		await this.clear();
		cacheLogger.info(`⏹️ Cache ${this.name}: Detenido`);
	}

	private evictOldest(): void {
		const oldest = Array.from(this.cache.entries()).reduce((a, b) => (a[1].timestamp < b[1].timestamp ? a : b));
		this.cache.delete(oldest[0]);
		cacheLogger.debug(`♻️ Cache ${this.name}: Elemento más antiguo eliminado`, {
			key: oldest[0],
		});
	}

	// Método para depuración y diagnóstico del caché
	async diagnose(): Promise<{ total: number; keys: string[] }> {
		const keys = Array.from(this.cache.keys());
		cacheLogger.info(`📊 Cache ${this.name}: Diagnóstico - ${keys.length} elementos`);
		return {
			total: keys.length,
			keys,
		};
	}
}

// Instancias de caché predefinidas
export const thumbnailCache = new CacheManager<Buffer>({
	name: 'thumbnails',
	ttl: 30 * 60 * 1000, // 30 minutos
	maxSize: 500,
	updateAgeOnGet: true,
	allowStale: true,
});

export const metadataCache = new CacheManager<FileMetadata>({
	name: 'metadata',
	ttl: 15 * 60 * 1000, // 15 minutos
	maxSize: 1000,
	updateAgeOnGet: true,
	allowStale: true,
});

interface SearchResult {
	items: unknown[];
	total: number;
	page: number;
	perPage: number;
	query?: string;
}

export const searchCache = new CacheManager<SearchResult>({
	name: 'search',
	ttl: 5 * 60 * 1000, // 5 minutos
	maxSize: 100,
	updateAgeOnGet: false,
	allowStale: true,
});

interface StatsData {
	totalFiles: number;
	totalSize: number;
	averageSize: number;
	[key: string]: number | string | Record<string, number | string>;
}

export const statsCache = new CacheManager<StatsData>({
	name: 'stats',
	ttl: 10 * 60 * 1000, // 10 minutos
	maxSize: 100,
	updateAgeOnGet: true,
	allowStale: true,
});

interface EntityData {
	id: string;
	name: string;
	[key: string]: string | number | boolean | null | undefined;
}

export const charactersCache = new CacheManager<EntityData[]>({
	name: 'characters',
	ttl: 15 * 60 * 1000, // 15 minutos
	maxSize: 200,
	updateAgeOnGet: true,
	allowStale: true,
});

export const placesCache = new CacheManager<EntityData[]>({
	name: 'places',
	ttl: 15 * 60 * 1000, // 15 minutos
	maxSize: 200,
	updateAgeOnGet: true,
	allowStale: true,
});

export const objectsCache = new CacheManager<EntityData[]>({
	name: 'objects',
	ttl: 15 * 60 * 1000, // 15 minutos
	maxSize: 200,
	updateAgeOnGet: true,
	allowStale: true,
});
