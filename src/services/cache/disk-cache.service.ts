/**
 * 🎯 Servicio de Cache en Disco Optimizado para Thumbnails
 * Implementación según Plan Mínimo Disruptivo Fase 2
 * 
 * Características:
 * - Cache persistente en public/.cache/thumbs/{size}/{hash}.webp
 * - xxhash64 para deduplicación y nombres de archivo
 * - Headers HTTP optimizados (ETag, Last-Modified, Cache-Control)
 * - Compresión WebP con calidad configurable
 * - Gestión de TTL y limpieza automática
 */

import { createHash } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
// import xxh64 from 'xxhash-wasm'; // TODO: Install xxhash-wasm package
import sharp from 'sharp';
import { thumbsConfig, type ThumbsConfig } from '@/config/thumbs';
import { serverLogger } from '@/lib/logger/server-logger';
import { formatBytes } from '@/lib/utils/format.utils';

const diskCacheLogger = serverLogger.withContext('DiskCache');

export interface DiskCacheEntry {
	hash: string;
	path: string;
	size: string; // 'low' | 'medium' | 'high'
	width: number;
	height: number;
	fileSize: number;
	createdAt: Date;
	lastAccessed: Date;
	mimeType: string;
}

export interface CacheStats {
	totalFiles: number;
	totalSize: number;
	hitRate: number;
	missRate: number;
	oldestFile: Date | null;
	newestFile: Date | null;
}

/**
 * 🔑 Genera hash xxhash64 para contenido
 */
export async function generateContentHash(input: string | Buffer): Promise<string> {
	// TODO: Replace with xxhash64 when package is installed
	// Using MD5 as temporary solution
	const md5 = createHash('md5');
	md5.update(input);
	return md5.digest('hex');
}

/**
 * 📁 Obtiene la ruta del directorio de cache para un tamaño específico
 */
export function getCacheDir(size: keyof ThumbsConfig['sizes']): string {
	return join(thumbsConfig.rootDir, size);
}

/**
 * 📄 Obtiene la ruta completa del archivo de cache
 */
export function getCachePath(hash: string, size: keyof ThumbsConfig['sizes']): string {
	const dir = getCacheDir(size);
	return join(dir, `${hash}.webp`);
}

/**
 * 🏗️ Asegura que el directorio de cache existe
 */
export async function ensureCacheDirectory(size: keyof ThumbsConfig['sizes']): Promise<void> {
	const dir = getCacheDir(size);
	try {
		await fs.mkdir(dir, { recursive: true });
		diskCacheLogger.debug(`Directorio de cache asegurado: ${dir}`);
	} catch (error) {
		diskCacheLogger.error(`Error creando directorio de cache ${dir}:`, error);
		throw new Error(`No se pudo crear directorio de cache: ${error}`);
	}
}

/**
 * 🔍 Verifica si existe un archivo en cache
 */
export async function existsInCache(hash: string, size: keyof ThumbsConfig['sizes']): Promise<boolean> {
	const cachePath = getCachePath(hash, size);
	return existsSync(cachePath);
}

/**
 * 📖 Lee archivo desde cache
 */
export async function readFromCache(hash: string, size: keyof ThumbsConfig['sizes']): Promise<DiskCacheEntry | null> {
	const cachePath = getCachePath(hash, size);
	
	try {
		if (!existsSync(cachePath)) {
			return null;
		}

		const stats = await fs.stat(cachePath);
		const buffer = await fs.readFile(cachePath);
		
		// Obtener metadatos de la imagen
		const metadata = await sharp(buffer).metadata();
		
		// Actualizar último acceso
		await fs.utimes(cachePath, new Date(), stats.mtime);
		
		return {
			hash,
			path: cachePath,
			size,
			width: metadata.width || 0,
			height: metadata.height || 0,
			fileSize: stats.size,
			createdAt: stats.birthtime,
			lastAccessed: new Date(),
			mimeType: 'image/webp',
		};
	} catch (error) {
		diskCacheLogger.error(`Error leyendo desde cache ${cachePath}:`, error);
		return null;
	}
}

/**
 * 💾 Guarda archivo en cache
 */
export async function writeToCache(
	hash: string,
	size: keyof ThumbsConfig['sizes'],
	buffer: Buffer,
	metadata?: { width?: number; height?: number }
): Promise<DiskCacheEntry> {
	await ensureCacheDirectory(size);
	const cachePath = getCachePath(hash, size);
	
	try {
		// Optimizar imagen para WebP con configuración específica
		const optimizedBuffer = await sharp(buffer)
			.webp({
				quality: thumbsConfig.disk.quality,
				effort: 6, // Máximo esfuerzo de compresión
				smartSubsample: true,
			})
			.toBuffer();

		await fs.writeFile(cachePath, optimizedBuffer);
		
		const stats = await fs.stat(cachePath);
		const sharpMetadata = await sharp(optimizedBuffer).metadata();
		
		const entry: DiskCacheEntry = {
			hash,
			path: cachePath,
			size,
			width: metadata?.width || sharpMetadata.width || 0,
			height: metadata?.height || sharpMetadata.height || 0,
			fileSize: stats.size,
			createdAt: stats.birthtime,
			lastAccessed: new Date(),
			mimeType: 'image/webp',
		};

		diskCacheLogger.debug(`Archivo guardado en cache: ${cachePath} (${formatBytes(stats.size)})`);
		return entry;
	} catch (error) {
		diskCacheLogger.error(`Error escribiendo en cache ${cachePath}:`, error);
		throw new Error(`No se pudo escribir en cache: ${error}`);
	}
}

/**
 * 🗑️ Elimina archivo específico de cache
 */
export async function removeFromCache(hash: string, size: keyof ThumbsConfig['sizes']): Promise<boolean> {
	const cachePath = getCachePath(hash, size);
	
	try {
		if (existsSync(cachePath)) {
			await fs.unlink(cachePath);
			diskCacheLogger.debug(`Archivo eliminado del cache: ${cachePath}`);
			return true;
		}
		return false;
	} catch (error) {
		diskCacheLogger.error(`Error eliminando archivo de cache ${cachePath}:`, error);
		return false;
	}
}

/**
 * 🧹 Limpia archivos expirados del cache
 */
export async function cleanExpiredCache(): Promise<{ removed: number; spaceSaved: number }> {
	const sizes = Object.keys(thumbsConfig.sizes) as Array<keyof ThumbsConfig['sizes']>;
	let totalRemoved = 0;
	let totalSpaceSaved = 0;
	const ttl = thumbsConfig.ttlMs;
	const cutoffTime = new Date(Date.now() - ttl);

	diskCacheLogger.info('🧹 Iniciando limpieza de cache expirado...');

	for (const size of sizes) {
		const cacheDir = getCacheDir(size);
		
		try {
			if (!existsSync(cacheDir)) continue;
			
			const files = await fs.readdir(cacheDir);
			
			for (const file of files) {
				if (!file.endsWith('.webp')) continue;
				
				const filePath = join(cacheDir, file);
				const stats = await fs.stat(filePath);
				
				// Eliminar si está expirado (usando lastAccessed o birthtime)
				const lastAccess = stats.atime > stats.birthtime ? stats.atime : stats.birthtime;
				
				if (lastAccess < cutoffTime) {
					await fs.unlink(filePath);
					totalRemoved++;
					totalSpaceSaved += stats.size;
					
					diskCacheLogger.debug(`Archivo expirado eliminado: ${filePath}`);
				}
			}
		} catch (error) {
			diskCacheLogger.error(`Error limpiando directorio ${cacheDir}:`, error);
		}
	}

	diskCacheLogger.info(`🧹 Limpieza completada: ${totalRemoved} archivos, ${formatBytes(totalSpaceSaved)} liberados`);
	
	return {
		removed: totalRemoved,
		spaceSaved: totalSpaceSaved,
	};
}

/**
 * 📊 Obtiene estadísticas del cache en disco
 */
export async function getCacheStats(): Promise<CacheStats> {
	const sizes = Object.keys(thumbsConfig.sizes) as Array<keyof ThumbsConfig['sizes']>;
	let totalFiles = 0;
	let totalSize = 0;
	let oldestFile: Date | null = null;
	let newestFile: Date | null = null;

	for (const size of sizes) {
		const cacheDir = getCacheDir(size);
		
		try {
			if (!existsSync(cacheDir)) continue;
			
			const files = await fs.readdir(cacheDir);
			
			for (const file of files) {
				if (!file.endsWith('.webp')) continue;
				
				const filePath = join(cacheDir, file);
				const stats = await fs.stat(filePath);
				
				totalFiles++;
				totalSize += stats.size;
				
				if (!oldestFile || stats.birthtime < oldestFile) {
					oldestFile = stats.birthtime;
				}
				if (!newestFile || stats.birthtime > newestFile) {
					newestFile = stats.birthtime;
				}
			}
		} catch (error) {
			diskCacheLogger.error(`Error obteniendo stats de ${cacheDir}:`, error);
		}
	}

	return {
		totalFiles,
		totalSize,
		hitRate: 0, // Se calculará externamente con métricas de uso
		missRate: 0,
		oldestFile,
		newestFile,
	};
}

/**
 * 🗑️ Limpia completamente el cache
 */
export async function clearCache(): Promise<{ removed: number; spaceSaved: number }> {
	const sizes = Object.keys(thumbsConfig.sizes) as Array<keyof ThumbsConfig['sizes']>;
	let totalRemoved = 0;
	let totalSpaceSaved = 0;

	diskCacheLogger.info('🗑️ Iniciando limpieza completa del cache...');

	for (const size of sizes) {
		const cacheDir = getCacheDir(size);
		
		try {
			if (!existsSync(cacheDir)) continue;
			
			const files = await fs.readdir(cacheDir);
			
			for (const file of files) {
				if (!file.endsWith('.webp')) continue;
				
				const filePath = join(cacheDir, file);
				const stats = await fs.stat(filePath);
				
				await fs.unlink(filePath);
				totalRemoved++;
				totalSpaceSaved += stats.size;
			}
		} catch (error) {
			diskCacheLogger.error(`Error limpiando directorio ${cacheDir}:`, error);
		}
	}

	diskCacheLogger.info(`🗑️ Limpieza completa: ${totalRemoved} archivos, ${formatBytes(totalSpaceSaved)} liberados`);
	
	return {
		removed: totalRemoved,
		spaceSaved: totalSpaceSaved,
	};
}

/**
 * 🚀 Inicializa el sistema de cache en disco
 */
export async function initializeDiskCache(): Promise<void> {
	diskCacheLogger.info('🚀 Inicializando sistema de cache en disco...');
	
	const sizes = Object.keys(thumbsConfig.sizes) as Array<keyof ThumbsConfig['sizes']>;
	
	// Crear todos los directorios necesarios
	await Promise.all(sizes.map(ensureCacheDirectory));
	
	// Obtener estadísticas iniciales
	const stats = await getCacheStats();
	
	diskCacheLogger.info('✅ Cache en disco inicializado:', {
		rootDir: thumbsConfig.rootDir,
		sizes,
		totalFiles: stats.totalFiles,
		totalSize: formatBytes(stats.totalSize),
		config: {
			quality: thumbsConfig.disk.quality,
			ttl: `${thumbsConfig.ttlMs / 1000 / 60 / 60 / 24} días`,
		},
	});
}