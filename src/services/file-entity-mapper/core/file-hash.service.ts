import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { LRUCache } from 'lru-cache';

/**
 * Servicio especializado para cálculo y cache de hashes de archivos
 * Extraído de FileEntityMapperService para mejorar modularidad y testabilidad
 */
export class FileHashService {
	private static instance: FileHashService;
	private hashCache: LRUCache<string, string>;

	private constructor() {
		// Cache de 2000 hashes, con TTL de 30 minutos
		this.hashCache = new LRUCache<string, string>({
			max: 2000,
			ttl: 30 * 60 * 1000, // 30 minutos
		});
	}

	static getInstance(): FileHashService {
		if (!FileHashService.instance) {
			FileHashService.instance = new FileHashService();
		}
		return FileHashService.instance;
	}

	/**
	 * Calcula el hash SHA256 de un archivo con cache inteligente
	 * La clave del cache incluye mtime y size para invalidar si cambia el contenido
	 */
	async calculateFileHash(filePath: string): Promise<string> {
		const stats = await stat(filePath);
		const cacheKey = `${filePath}:${stats.mtimeMs}:${stats.size}`;

		const cached = this.hashCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		const fileBuffer = await readFile(filePath);
		const hash = createHash('sha256').update(fileBuffer).digest('hex');
		this.hashCache.set(cacheKey, hash);

		return hash;
	}

	/**
	 * Limpia el cache de hashes
	 */
	clearCache(): void {
		this.hashCache.clear();
	}

	/**
	 * Obtiene estadísticas del cache
	 */
	getCacheStats() {
		return {
			size: this.hashCache.size,
			max: this.hashCache.max,
		};
	}
}
