/**
 * @file Estadísticas del sistema
 * @description Compatible con Vite + React - ✅ MIGRADO A DRIZZLE
 */

import { count, gte, sum } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { collections, folders, images, tags } from '@/lib/drizzle/schema';
import { formatBytes } from '@/lib/utils/format.utils';

/**
 * Obtiene el total de archivos indexados en la base de datos
 */
export async function getIndexedFilesCount(): Promise<number> {
	try {
		const [result] = await db.select({ count: count() }).from(images);

		return result.count;
	} catch (error) {
		console.error('Error al obtener conteo de archivos:', error);
		return 0;
	}
}

/**
 * Obtiene el uso total de espacio en disco de los archivos indexados
 */
export async function getTotalSpaceUsed(): Promise<{
	raw: number;
	formatted: string;
}> {
	try {
		const [result] = await db.select({ totalSize: sum(images.size) }).from(images);

		const totalBytes = Number(result.totalSize) || 0;

		return {
			raw: totalBytes,
			formatted: formatBytes(totalBytes),
		};
	} catch (error) {
		console.error('Error al calcular espacio usado:', error);
		return {
			raw: 0,
			formatted: formatBytes(0),
		};
	}
}

/**
 * Obtiene el número de carpetas monitoreadas
 */
export async function getMonitoredFoldersCount(): Promise<number> {
	try {
		const [result] = await db.select({ count: count() }).from(folders);

		return result.count;
	} catch (error) {
		console.error('Error al obtener carpetas monitoreadas:', error);
		return 0;
	}
}

/**
 * Obtiene el número de colecciones creadas
 */
export async function getCollectionsCount(): Promise<number> {
	try {
		const [result] = await db.select({ count: count() }).from(collections);

		return result.count;
	} catch (error) {
		console.error('Error al obtener colecciones:', error);
		return 0;
	}
}

/**
 * Obtiene el número de etiquetas en el sistema
 */
export async function getTagsCount(): Promise<number> {
	try {
		const [result] = await db.select({ count: count() }).from(tags);

		return result.count;
	} catch (error) {
		console.error('Error al obtener etiquetas:', error);
		return 0;
	}
}

/**
 * Obtiene datos históricos de archivos indexados por día (últimos 7 días)
 */
export async function getFilesHistoricalData(): Promise<
	Array<{
		date: string;
		count: number;
	}>
> {
	try {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const files = await db
			.select({ createdAt: images.createdAt })
			.from(images)
			.where(gte(images.createdAt, sevenDaysAgo));

		// Agrupar por día
		const groupedByDay = files.reduce<Record<string, number>>((acc, file) => {
			const date = file.createdAt.toISOString().split('T')[0];
			acc[date] = (acc[date] || 0) + 1;
			return acc;
		}, {});

		// Crear array para los últimos 7 días
		const result = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			result.unshift({
				date: dateStr,
				count: groupedByDay[dateStr] || 0,
			});
		}

		return result;
	} catch (error) {
		console.error('Error al obtener datos históricos:', error);
		return [];
	}
}

/**
 * Obtiene datos históricos de etiquetas (últimos 7 días)
 */
export async function getTagsHistoricalData(): Promise<
	Array<{
		date: string;
		count: number;
	}>
> {
	try {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const tagsData = await db.select({ createdAt: tags.createdAt }).from(tags).where(gte(tags.createdAt, sevenDaysAgo));

		// Agrupar por día
		const groupedByDay = tagsData.reduce<Record<string, number>>((acc, tag) => {
			const date = tag.createdAt.toISOString().split('T')[0];
			acc[date] = (acc[date] || 0) + 1;
			return acc;
		}, {});

		// Crear array acumulativo para los últimos 7 días
		const result = [];
		let accumulator = 0;

		for (let i = 0; i < 7; i++) {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			const dateStr = date.toISOString().split('T')[0];
			accumulator += groupedByDay[dateStr] || 0;
			result.push({
				date: dateStr,
				count: accumulator,
			});
		}

		return result;
	} catch (error) {
		console.error('Error al obtener datos históricos de etiquetas:', error);
		return [];
	}
}

/**
 * Obtiene métricas del sistema (simuladas)
 */
export async function getSystemMetrics(): Promise<{
	cpuUsage: number;
	memoryUsage: number;
	queueSize: number;
}> {
	// Simular métricas del sistema ya que no tenemos acceso real
	return {
		cpuUsage: Math.floor(Math.random() * 100),
		memoryUsage: Math.floor(Math.random() * 100),
		queueSize: Math.floor(Math.random() * 10),
	};
}
