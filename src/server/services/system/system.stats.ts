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
import { serverLogger } from '@/lib/logger/server-logger';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import type { DatabaseEntityStats, SystemRuntimeStats } from './system.types';
import { requireDatabaseUrl, resolveLocalDatabaseFilePath } from '@/lib/drizzle/database-url';

// Logger con contexto
const systemLogger = serverLogger.withContext('SystemStats');

function getDatabaseFileCandidates(): string[] {
	const resolvedPath = resolveLocalDatabaseFilePath(requireDatabaseUrl());
	if (!resolvedPath) return [];

	return [resolvedPath, `${resolvedPath}-wal`, `${resolvedPath}-shm`];
}

async function getExistingFileSize(filePath: string): Promise<number> {
	try {
		return (await fs.stat(filePath)).size;
	} catch {
		return 0;
	}
}

async function getDirectorySize(dirPath: string): Promise<number> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		let totalSize = 0;

		for (const entry of entries) {
			const entryPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				totalSize += await getDirectorySize(entryPath);
				continue;
			}

			if (entry.isFile()) {
				totalSize += await getExistingFileSize(entryPath);
			}
		}

		return totalSize;
	} catch {
		return 0;
	}
}

async function getDatabaseSize(): Promise<number> {
	const sizes = await Promise.all(getDatabaseFileCandidates().map((filePath) => getExistingFileSize(filePath)));
	return sizes.reduce((total, size) => total + size, 0);
}

async function getDiskMetrics(targetPath: string): Promise<{ available: number; total: number; used: number } | null> {
	try {
		const fsStats = await fs.statfs(targetPath);
		const blockSize = Number(fsStats.bsize);
		const total = Number(fsStats.blocks) * blockSize;
		const available = Number(fsStats.bavail) * blockSize;
		const used = Math.max(total - available, 0);

		if (!Number.isFinite(total) || !Number.isFinite(available)) {
			return null;
		}

		return { total, available, used };
	} catch (error) {
		systemLogger.warn('⚠️ No se pudo obtener información real de disco', { error, targetPath });
		return null;
	}
}

async function getCacheSize(): Promise<number> {
	const cacheDirectories = [
		path.join(process.cwd(), '.vite'),
		path.join(process.cwd(), 'node_modules', '.vite'),
		path.join(process.cwd(), '.bun'),
	];

	const sizes = await Promise.all(cacheDirectories.map((dirPath) => getDirectorySize(dirPath)));
	return Math.round(sizes.reduce((total, size) => total + size, 0) / (1024 * 1024));
}

/**
 * Obtiene estadísticas del sistema compatibles con frontend
 * Incluye conteos de entidades y estimaciones de almacenamiento
 */
export async function getSystemStats(): Promise<DatabaseEntityStats> {
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
			db.select({ count: count() }).from(images).where(visibleImageLifecycleCondition()),
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

		const dbSize = await getDatabaseSize();
		const diskMetrics = await getDiskMetrics(process.cwd());
		const storageUsed = diskMetrics?.used ?? dbSize;
		const storageAvailable = diskMetrics?.available ?? 0;

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
			lastBackup: undefined,
		} satisfies DatabaseEntityStats;
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

		const cacheSize = await getCacheSize();

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
			db.select({ count: count() }).from(images).where(visibleImageLifecycleCondition()),
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

		const dbSize = Math.round((await getDatabaseSize()) / (1024 * 1024));

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
		} satisfies SystemRuntimeStats;
	} catch (error) {
		systemLogger.error('❌ Error al obtener estadísticas de runtime del sistema:', error);
		throw createSystemError(
			'No se pudieron obtener las estadísticas de runtime del sistema',
			'STATS_FETCH_ERROR',
			error
		);
	}
}
