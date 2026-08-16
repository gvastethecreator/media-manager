import { serverLogger } from '@/lib/logger/server-logger';
import type { FileMetadata } from '@/types/metadata';

const cacheLogger = serverLogger.withContext('Cache');

// Regex top-level para evitar recreación por llamada
const BACKSLASH_REGEX = /\\/g; // Reemplazar barras invertidas por normales
const DRIVE_REGEX = /([a-z]):\/+?/i; // Normalizar formato de unidad Windows (C:/)
const MULTI_SLASH_REGEX = /\/+?/g; // Eliminar barras duplicadas
const OUTPUTS_U_REGEX = /outpu+ts/gi; // Variaciones de 'outputs' con múltiples 'u'
const OUTPUTS_P_REGEX = /outp+uts/gi; // Variaciones con múltiples 'p'
const SDMATRIX_REGEX = /s+dmatrix/gi; // Variaciones de 'sdmatrix'
const OUTPUTS_PATH_REGEX = /(.*)\/?#outputs\/?(.*)/; // Normalizar segmento #outputs

interface CacheOptions {
	allowStale?: boolean; // Allow returning stale items
	maxSize?: number; // Maximum number of items in cache
	name?: string; // Cache name for logging
	ttl?: number; // Time to live in milliseconds
	updateAgeOnGet?: boolean; // Update item age on get
}

export class CacheManager<T> {
	private readonly cache: Map<string, { value: T; timestamp: number }>;
	private readonly ttl: number;
	private readonly maxSize: number;
	private readonly name: string;
	private readonly updateAgeOnGet: boolean;
	private readonly allowStale: boolean;

	constructor(options: CacheOptions = {}) {
		this.cache = new Map();
		this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes by default
		this.maxSize = options.maxSize || 1000;
		this.name = options.name || 'default';
		// Normalizar flags booleanos opcionales
		this.updateAgeOnGet = options.updateAgeOnGet ?? false;
		this.allowStale = options.allowStale ?? false;
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
			.replace(BACKSLASH_REGEX, '/') // Reemplazar todas las barras invertidas por barras normales
			.replace(DRIVE_REGEX, '$1:/') // Normalizar el formato de unidad Windows (C:/ o C:\)
			.replace(MULTI_SLASH_REGEX, '/'); // Eliminar barras duplicadas

		// 2. Convertir a minúsculas para comparación consistente
		normalizedKey = normalizedKey.toLowerCase();

		// 3. Corregir variaciones específicas observadas
		normalizedKey = normalizedKey
			.replace(OUTPUTS_U_REGEX, 'outputs') // Corregir cualquier variación de 'outputs' con múltiples 'u'
			.replace(OUTPUTS_P_REGEX, 'outputs') // Corregir variaciones con múltiples 'p'
			.replace(SDMATRIX_REGEX, 'sdmatrix'); // Corregir cualquier variación de 'sdmatrix'

		// 4. Asegurar estructura consistente para #outputs
		if (normalizedKey.includes('#outputs') && !normalizedKey.includes('/#outputs/')) {
			normalizedKey = normalizedKey.replace(OUTPUTS_PATH_REGEX, '$1/#outputs/$2');
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
		await Promise.resolve();
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
		await Promise.resolve();
		const normalizedKey = this.normalizeKey(key);
		const item = this.cache.get(normalizedKey);

		if (!item) {
			return;
		}

		const now = Date.now();
		const isExpired = now - item.timestamp > this.ttl;

		if (isExpired && !this.allowStale) {
			this.cache.delete(normalizedKey);
			cacheLogger.debug(`🕒 Cache ${this.name}: Elemento expirado`, { key: normalizedKey });
			return;
		}

		if (this.updateAgeOnGet) {
			item.timestamp = now;
		}

		return item.value;
	}

	async delete(key: string): Promise<void> {
		await Promise.resolve();
		const normalizedKey = this.normalizeKey(key);
		this.cache.delete(normalizedKey);
		cacheLogger.debug(`🗑️ Cache ${this.name}: Elemento eliminado`, { key: normalizedKey });
	}

	async clear(): Promise<void> {
		await Promise.resolve();
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
		await Promise.resolve();
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
	page: number;
	perPage: number;
	query?: string;
	total: number;
}

export const searchCache = new CacheManager<SearchResult>({
	name: 'search',
	ttl: 5 * 60 * 1000, // 5 minutos
	maxSize: 100,
	updateAgeOnGet: false,
	allowStale: true,
});

interface StatsData {
	averageSize: number;
	totalFiles: number;
	totalSize: number;
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

export const worldItemsCache = new CacheManager<EntityData[]>({
	name: 'world-items',
	ttl: 15 * 60 * 1000, // 15 minutos
	maxSize: 200,
	updateAgeOnGet: true,
	allowStale: true,
});
