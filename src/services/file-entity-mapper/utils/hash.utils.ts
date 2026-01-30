import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { LRUCache } from 'lru-cache';

/**
 * Caché global para hashes de archivos
 */
const hashCache = new LRUCache<string, string>({ max: 500 });

/**
 * Calcula hash SHA-256 de un archivo con cacheo inteligente
 * Cache key incluye mtime y size para invalidar si cambia contenido
 */
export async function calculateFileHash(filePath: string): Promise<string> {
	const stats = await stat(filePath);
	const cacheKey = `${filePath}:${stats.mtimeMs}:${stats.size}`;
	const cached = hashCache.get(cacheKey);
	if (cached) {
		return cached;
	}
	const fileBuffer = await readFile(filePath);
	const hash = createHash('sha256').update(fileBuffer).digest('hex');
	hashCache.set(cacheKey, hash);
	return hash;
}

/**
 * Limpia la caché de hashes (útil para tests)
 */
export function clearHashCache(): void {
	hashCache.clear();
}
