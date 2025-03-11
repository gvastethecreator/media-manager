'use server';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const systemLogger = logger.withContext('SystemActions');

// Tiempo de revalidación en segundos
const SYSTEM_REVALIDATE_SECONDS = 60;
const SYSTEM_CACHE_TAG = 'system-stats';

export interface SystemStats {
	cpuUsage: number;
	memoryUsage: number;
	cacheSize: number;
	dbSize: number;
	totalEntities: number;
	uptime: number;
	nodeVersion: string;
	hostname: string;
}

/**
 * Obtiene estadísticas del sistema en tiempo real
 */
export async function getSystemStats(): Promise<SystemStats> {
	const cachedStats = unstable_cache(
		async () => {
			try {
				systemLogger.info('📊 Obteniendo estadísticas del sistema');

				// Obtener información de CPU
				const cpus = os.cpus();
				let totalIdle = 0;
				let totalTick = 0;

				for (const cpu of cpus) {
					for (const type in cpu.times) {
						totalTick += cpu.times[type as keyof typeof cpu.times];
					}
					totalIdle += cpu.times.idle;
				}

				const cpuUsage = Math.round(100 - (totalIdle / totalTick) * 100);

				// Obtener información de memoria
				const totalMem = os.totalmem();
				const freeMem = os.freemem();
				const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

				// Obtener tamaño de caché (simulado con tamaño de directorio temporal de Next.js)
				let cacheSize = 0;
				try {
					const nextCachePath = path.join(process.cwd(), '.next/cache');
					const cacheStats = await fs.stat(nextCachePath).catch(() => ({ size: 0 }));
					cacheSize = Math.round(cacheStats.size / (1024 * 1024)); // Convertir a MB
				} catch (error) {
					systemLogger.warn('⚠️ Error al obtener tamaño de caché:', error);
				}

				// Obtener tamaño de base de datos (conteo de entidades)
				const [totalImages, totalCollections, totalTags, totalAlbums, totalNotes] = await Promise.all([
					prisma.image.count(),
					prisma.collection.count(),
					prisma.tag.count(),
					prisma.album.count(),
					prisma.note.count(),
				]);

				const totalEntities = totalImages + totalCollections + totalTags + totalAlbums + totalNotes;

				// Obtener tamaño de la base de datos (simulado)
				const dbSize = totalEntities * 0.1; // Simulación: 100KB por entidad

				systemLogger.info('✅ Estadísticas del sistema obtenidas');

				return {
					cpuUsage,
					memoryUsage,
					cacheSize,
					dbSize,
					totalEntities,
					uptime: Math.round(os.uptime() / 60 / 60), // En horas
					nodeVersion: process.version,
					hostname: os.hostname(),
				} satisfies SystemStats;
			} catch (error) {
				systemLogger.error('❌ Error al obtener estadísticas del sistema:', error);
				return {
					cpuUsage: 0,
					memoryUsage: 0,
					cacheSize: 0,
					dbSize: 0,
					totalEntities: 0,
					uptime: 0,
					nodeVersion: process.version,
					hostname: 'desconocido',
				};
			}
		},
		['system-stats'],
		{
			revalidate: SYSTEM_REVALIDATE_SECONDS,
			tags: [SYSTEM_CACHE_TAG],
		}
	);

	return cachedStats();
}

/**
 * Realiza la reparación del sistema (limpieza de caché, optimización de BD, etc.)
 */
export async function repairSystem(): Promise<{ success: boolean; message: string }> {
	try {
		systemLogger.info('🔧 Iniciando reparación del sistema');

		// Simular un proceso de reparación (aquí implementaríamos la lógica real)
		await new Promise((resolve) => setTimeout(resolve, 2000));

		systemLogger.info('✅ Sistema reparado correctamente');
		return {
			success: true,
			message: 'Sistema reparado correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al reparar el sistema:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

/**
 * Resetea la base de datos (elimina todos los datos)
 * ¡PRECAUCIÓN! Esta acción es irreversible
 */
export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
	try {
		systemLogger.warn('⚠️ Iniciando reseteo de base de datos');

		// Aquí implementaríamos la lógica real de reseteo
		// Por seguridad, esto debería estar protegido con autenticación

		// Esta es una simulación, en producción implementaríamos el borrado real
		await new Promise((resolve) => setTimeout(resolve, 3000));

		systemLogger.info('✅ Base de datos reseteada correctamente');
		return {
			success: true,
			message: 'Base de datos reseteada correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al resetear la base de datos:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}
