/**
 * Funciones de estadísticas del sistema (runtime + DB)
 */

import { count } from 'drizzle-orm';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { db } from '@/lib/drizzle';
import {
	albums,
	audios,
	characters,
	collections,
	folders,
	images,
	notes,
	tags,
	videos,
} from '@/lib/drizzle/schema/index';
import { createSystemError } from '@/lib/errors/system';
import type { RuntimeSystemStats, SystemRuntimeStats } from './system.types';

// Logger simplificado
const systemLogger = {
	info: (msg: string) => console.log(`[SYSTEM] ${msg}`),
	error: (msg: string, error?: any) => console.error(`[SYSTEM ERROR] ${msg}`, error),
	warn: (msg: string, error?: any) => console.warn(`[SYSTEM WARN] ${msg}`, error),
};

/**
 * Obtiene estadísticas del sistema compatibles con frontend
 * Incluye conteos de entidades y estimaciones de almacenamiento
 */
export async function getSystemStats(): Promise<RuntimeSystemStats> {
	try {
		systemLogger.info('📊 Obteniendo estadísticas del sistema (Frontend compatible)');

		// Obtener estadísticas reales de la base de datos (8 entidades en paralelo)
		const [
			imagesResult,
			videosResult,
			audiosResult,
			foldersResult,
			albumsResult,
			charactersResult,
			collectionsResult,
			tagsResult,
		] = await Promise.all([
			db.select({ count: count() }).from(images),
			db.select({ count: count() }).from(videos),
			db.select({ count: count() }).from(audios),
			db.select({ count: count() }).from(folders),
			db.select({ count: count() }).from(albums),
			db.select({ count: count() }).from(characters),
			db.select({ count: count() }).from(collections),
			db.select({ count: count() }).from(tags),
		]);

		const totalImages = imagesResult[0]?.count || 0;
		const totalVideos = videosResult[0]?.count || 0;
		const totalAudio = audiosResult[0]?.count || 0;
		const totalFolders = foldersResult[0]?.count || 0;
		const totalAlbums = albumsResult[0]?.count || 0;
		const totalCharacters = charactersResult[0]?.count || 0;
		const totalCollections = collectionsResult[0]?.count || 0;
		const totalTags = tagsResult[0]?.count || 0;

		// Calcular tamaño de almacenamiento (estimado)
		const totalEntities =
			totalImages +
			totalVideos +
			totalAudio +
			totalFolders +
			totalAlbums +
			totalCharacters +
			totalCollections +
			totalTags;
		const storageUsed = totalEntities * 1024 * 100; // Estimación: 100KB por entidad
		const storageAvailable = 1024 * 1024 * 1024; // 1GB simulado disponible
		const dbSize = totalEntities * 512; // Estimación: 512 bytes por entidad

		systemLogger.info('✅ Estadísticas del sistema obtenidas');

		return {
			totalImages,
			totalVideos,
			totalAudio,
			totalFolders,
			totalAlbums,
			totalCharacters,
			totalCollections,
			totalTags,
			storageUsed,
			storageAvailable,
			dbSize,
			lastBackup: undefined, // TODO: Implementar sistema de backup
		} as unknown as RuntimeSystemStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas del sistema:', error);
		throw createSystemError('No se pudieron obtener las estadísticas del sistema', 'STATS_FETCH_ERROR', error);
	}
}

/**
 * Obtiene estadísticas de tiempo de ejecución del sistema (CPU, memoria, caché, DB)
 */
export async function getSystemRuntimeStats(): Promise<SystemRuntimeStats> {
	try {
		systemLogger.info('📊 Obteniendo estadísticas de runtime del sistema');

		// Obtener información de CPU
		const cpus = os.cpus();
		let totalIdle = 0;
		let totalTick = 0;

		for (const cpu of cpus) {
			for (const type in cpu.times) {
				if (Object.hasOwn(cpu.times, type)) {
					totalTick += cpu.times[type as keyof typeof cpu.times];
				}
			}
			totalIdle += cpu.times.idle;
		}

		const cpuUsage = Math.round(100 - (totalIdle / totalTick) * 100);

		// Obtener información de memoria
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

		// Obtener tamaño de caché (simulado con el directorio de Vite)
		let cacheSize = 0;
		try {
			const viteCachePath = path.join(process.cwd(), '.vite');
			const cacheStats = await fs.stat(viteCachePath).catch(() => ({ size: 0 }));
			cacheSize = Math.round(cacheStats.size / (1024 * 1024)); // Convertir a MB
		} catch (error) {
			systemLogger.warn('⚠️ Error al obtener tamaño de caché:', error);
		}

		// Obtener estadísticas reales de la base de datos (8 entidades en paralelo)
		const [
			imagesResult,
			collectionsResult,
			tagsResult,
			albumsResult,
			notesResult,
			foldersResult,
			videosResult,
			audiosResult,
		] = await Promise.all([
			db.select({ count: count() }).from(images),
			db.select({ count: count() }).from(collections),
			db.select({ count: count() }).from(tags),
			db.select({ count: count() }).from(albums),
			db.select({ count: count() }).from(notes),
			db.select({ count: count() }).from(folders),
			db.select({ count: count() }).from(videos),
			db.select({ count: count() }).from(audios),
		]);

		const totalImages = imagesResult[0]?.count || 0;
		const totalCollections = collectionsResult[0]?.count || 0;
		const totalTags = tagsResult[0]?.count || 0;
		const totalAlbums = albumsResult[0]?.count || 0;
		const totalNotes = notesResult[0]?.count || 0;
		const totalFolders = foldersResult[0]?.count || 0;
		const totalVideos = videosResult[0]?.count || 0;
		const totalAudio = audiosResult[0]?.count || 0;

		const totalEntities =
			totalImages + totalCollections + totalTags + totalAlbums + totalNotes + totalFolders + totalVideos + totalAudio;

		// Obtener tamaño de la base de datos (estimado basado en entidades)
		const dbSize = totalEntities * 0.5; // Estimación: 500 bytes por entidad

		systemLogger.info('✅ Estadísticas de runtime del sistema obtenidas');

		return {
			cpuUsage,
			memoryUsage,
			cacheSize,
			dbSize,
			totalEntities,
			uptime: Math.round(os.uptime() / 60 / 60), // En horas
			nodeVersion: process.version,
			hostname: os.hostname(),
		} as unknown as SystemRuntimeStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas de runtime del sistema:', error);
		throw createSystemError(
			'No se pudieron obtener las estadísticas de runtime del sistema',
			'STATS_FETCH_ERROR',
			error
		);
	}
}
