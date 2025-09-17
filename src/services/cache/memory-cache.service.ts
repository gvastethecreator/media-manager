/**
 * 🧠 Servicio de Cache en Memoria Optimizado para Thumbnails
 * Implementación LRU con métricas y eviction inteligente
 * Según Plan Mínimo Disruptivo Fase 2
 */

import { LRUCache } from 'lru-cache';
import { thumbsConfig } from '@/config/thumbs';
import { serverLogger } from '@/lib/logger/server-logger';
import { formatBytes } from '@/lib/utils/format.utils';

const memoryCacheLogger = serverLogger.withContext('MemoryCache');

export interface MemoryCacheEntry {
	buffer: Buffer;
	width: number;
	height: number;
	format: string;
	hash: string;
	size: string; // 'low' | 'medium' | 'high'
	createdAt: Date;
	accessCount: number;
}

export interface MemoryCacheStats {
	size: number;
	maxSize: number;
	itemCount: number;
	hitRate: number;
	missRate: number;
	totalHits: number;
	totalMisses: number;
	memoryUsage: number; // bytes
	averageAccessCount: number;
}

/**
 * 🔍 Calcula el tamaño estimado de una entrada en memoria
 */
function calculateEntrySize(entry: MemoryCacheEntry): number {
	// Buffer size + overhead estimado para metadatos y strings
	return entry.buffer.length + 200;
}

/**
 * 🎯 Servicio de Cache en Memoria con LRU y métricas
 */
export class ThumbnailMemoryCache {
	private cache: LRUCache<string, MemoryCacheEntry>;
	private hitCount = 0;
	private missCount = 0;
	private startTime = Date.now();

	constructor() {
		this.cache = new LRUCache<string, MemoryCacheEntry>({
			max: thumbsConfig.memory.maxEntries,
			maxSize: 50 * 1024 * 1024, // 50MB máximo en memoria
			sizeCalculation: calculateEntrySize,
			ttl: thumbsConfig.memory.ttlMs,
			updateAgeOnGet: true,
			allowStale: false,
			dispose: (value, key) => {
				memoryCacheLogger.debug(`Entrada evicted de memoria: ${key} (${formatBytes(value.buffer.length)})`);
			},
		});

		memoryCacheLogger.info('🧠 Cache en memoria inicializado:', {
			maxEntries: thumbsConfig.memory.maxEntries,
			maxSize: '50MB',
			ttl: `${thumbsConfig.memory.ttlMs / 1000 / 60} minutos`,
		});
	}

	/**
	 * 🔑 Genera clave única para cache
	 */
	private generateCacheKey(hash: string, size: string): string {
		return `${hash}:${size}`;
	}

	/**
	 * 📖 Obtiene entrada del cache
	 */
	get(hash: string, size: string): MemoryCacheEntry | null {
		const key = this.generateCacheKey(hash, size);
		const entry = this.cache.get(key);

		if (entry) {
			this.hitCount++;
			entry.accessCount++;
			memoryCacheLogger.debug(`Cache HIT: ${key} (accesos: ${entry.accessCount})`);
			return entry;
		}

		this.missCount++;
		memoryCacheLogger.debug(`Cache MISS: ${key}`);
		return null;
	}

	/**
	 * 💾 Guarda entrada en cache
	 */
	set(
		hash: string,
		size: string,
		buffer: Buffer,
		metadata: { width: number; height: number; format: string }
	): boolean {
		const key = this.generateCacheKey(hash, size);
		
		const entry: MemoryCacheEntry = {
			buffer,
			width: metadata.width,
			height: metadata.height,
			format: metadata.format,
			hash,
			size,
			createdAt: new Date(),
			accessCount: 1,
		};

		try {
			this.cache.set(key, entry);
			memoryCacheLogger.debug(`Entrada guardada en memoria: ${key} (${formatBytes(buffer.length)})`);
			return true;
		} catch (error) {
			memoryCacheLogger.warn(`No se pudo guardar en memoria: ${key}`, error);
			return false;
		}
	}

	/**
	 * 🗑️ Elimina entrada específica
	 */
	delete(hash: string, size: string): boolean {
		const key = this.generateCacheKey(hash, size);
		const deleted = this.cache.delete(key);
		
		if (deleted) {
			memoryCacheLogger.debug(`Entrada eliminada de memoria: ${key}`);
		}
		
		return deleted;
	}

	/**
	 * 🔍 Verifica si existe en cache
	 */
	has(hash: string, size: string): boolean {
		const key = this.generateCacheKey(hash, size);
		return this.cache.has(key);
	}

	/**
	 * 🧹 Limpia cache completamente
	 */
	clear(): void {
		const sizeBefore = this.cache.size;
		this.cache.clear();
		this.hitCount = 0;
		this.missCount = 0;
		this.startTime = Date.now();
		
		memoryCacheLogger.info(`🧹 Cache en memoria limpiado: ${sizeBefore} entradas eliminadas`);
	}

	/**
	 * 🔄 Forza eviction de entradas menos usadas
	 */
	evictLRU(count = 10): number {
		let evicted = 0;
		const entries = Array.from(this.cache.entries());
		
		// Ordenar por último acceso y número de accesos
		entries.sort((a, b) => {
			const aEntry = a[1];
			const bEntry = b[1];
			
			// Primero por fecha de creación (más viejo primero)
			const ageComparison = aEntry.createdAt.getTime() - bEntry.createdAt.getTime();
			if (ageComparison !== 0) return ageComparison;
			
			// Luego por conteo de accesos (menos accesos primero)
			return aEntry.accessCount - bEntry.accessCount;
		});

		for (let i = 0; i < Math.min(count, entries.length); i++) {
			const [key] = entries[i];
			if (this.cache.delete(key)) {
				evicted++;
			}
		}

		memoryCacheLogger.info(`🔄 Evicted ${evicted} entradas LRU del cache en memoria`);
		return evicted;
	}

	/**
	 * 📊 Obtiene estadísticas del cache
	 */
	getStats(): MemoryCacheStats {
		const total = this.hitCount + this.missCount;
		const hitRate = total > 0 ? this.hitCount / total : 0;
		const missRate = total > 0 ? this.missCount / total : 0;

		// Calcular uso de memoria y promedio de accesos
		let totalMemoryUsage = 0;
		let totalAccessCount = 0;
		const entries = Array.from(this.cache.values());

		for (const entry of entries) {
			totalMemoryUsage += calculateEntrySize(entry);
			totalAccessCount += entry.accessCount;
		}

		const averageAccessCount = entries.length > 0 ? totalAccessCount / entries.length : 0;

		return {
			size: this.cache.size,
			maxSize: this.cache.max,
			itemCount: entries.length,
			hitRate,
			missRate,
			totalHits: this.hitCount,
			totalMisses: this.missCount,
			memoryUsage: totalMemoryUsage,
			averageAccessCount,
		};
	}

	/**
	 * 🔧 Optimiza el cache automáticamente
	 */
	optimize(): { evicted: number; reason: string } {
		const stats = this.getStats();
		
		// Si está al 90% de capacidad, evict 20% de entradas menos usadas
		const usageRatio = stats.size / stats.maxSize;
		
		if (usageRatio >= 0.9) {
			const evictCount = Math.floor(stats.maxSize * 0.2);
			const evicted = this.evictLRU(evictCount);
			
			memoryCacheLogger.info(`🔧 Optimización automática: evicted ${evicted} entradas (uso ${(usageRatio * 100).toFixed(1)}%)`);
			
			return {
				evicted,
				reason: `High usage ratio: ${(usageRatio * 100).toFixed(1)}%`,
			};
		}

		return { evicted: 0, reason: 'No optimization needed' };
	}

	/**
	 * 📝 Imprime reporte detallado
	 */
	printReport(): void {
		const stats = this.getStats();
		const uptime = Date.now() - this.startTime;

		memoryCacheLogger.info('📊 Reporte Cache en Memoria:', {
			items: `${stats.itemCount}/${stats.maxSize}`,
			memory: formatBytes(stats.memoryUsage),
			hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
			missRate: `${(stats.missRate * 100).toFixed(1)}%`,
			averageAccess: stats.averageAccessCount.toFixed(1),
			uptime: `${Math.floor(uptime / 1000 / 60)} minutos`,
		});
	}
}

// Instancia singleton
export const thumbnailMemoryCache = new ThumbnailMemoryCache();

// Optimización automática cada 5 minutos
if (thumbsConfig.memory.enabled) {
	setInterval(() => {
		thumbnailMemoryCache.optimize();
	}, 5 * 60 * 1000);
}