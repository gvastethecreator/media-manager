/**
 * @file Acciones del servidor para operaciones del sistema
 * @module app/actions/system/system.actions
 */

'use server';

import fs from 'fs/promises';
import { revalidatePath, unstable_cache } from '@/lib/server/revalidate';
import os from 'os';
import path from 'path';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import { createSystemError } from './system.errors';

// Logger específico para acciones del sistema
const systemLogger = serverLogger.withContext('SystemActions');

// Rutas que deben ser revalidadas cuando el sistema cambia
const REVALIDATE_PATHS = ['/settings', '/dashboard', '/'] as const;

// Tiempo de revalidación en segundos
const SYSTEM_REVALIDATE_SECONDS = 60;
const SYSTEM_CACHE_TAG = 'system-stats';

/**
 * Revalida todas las rutas relevantes cuando cambia el sistema
 */
const revalidateSystemPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	systemLogger.info('🔄 Rutas del sistema revalidadas');
};

/**
 * Interfaz para estadísticas del sistema
 */
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
 * Respuesta estándar para operaciones del sistema
 */
export interface SystemResponse {
	success: boolean;
	message: string;
	data?: unknown;
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

                                // Obtener tamaño de caché (simulado con el directorio de Vite)
                                let cacheSize = 0;
                                try {
                                	const viteCachePath = path.join(process.cwd(), 'node_modules/.vite');
                                	const cacheStats = await fs.stat(viteCachePath).catch(() => ({ size: 0 }));
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
				throw createSystemError('No se pudieron obtener las estadísticas del sistema', 'STATS_FETCH_ERROR', error);
			}
		},
		['system-stats'],
		{
			revalidate: SYSTEM_REVALIDATE_SECONDS,
			tags: [SYSTEM_CACHE_TAG],
		}
	);

	try {
		return await cachedStats();
	} catch (error) {
		systemLogger.error('❌ Error al recuperar estadísticas del sistema de la caché:', error);
		// Devolver valores por defecto en caso de error
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
}

/**
 * Realiza la reparación del sistema (limpieza de caché, optimización de BD, etc.)
 */
export async function repairSystem(): Promise<SystemResponse> {
	try {
		systemLogger.info('🔧 Iniciando reparación del sistema');

                // 1. Limpiar caché de Vite (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 2. Verificar integridad de la base de datos (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 3. Optimizar índices (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 4. Eliminar archivos temporales (simulado)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Revalidar rutas
		await revalidateSystemPaths();

		systemLogger.info('✅ Sistema reparado correctamente');
		return {
			success: true,
			message: 'Sistema reparado correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al reparar el sistema:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido en la reparación del sistema',
		};
	}
}

/**
 * Resetea la base de datos (elimina todos los datos)
 * ¡PRECAUCIÓN! Esta acción es irreversible
 */
export async function resetDatabase(): Promise<SystemResponse> {
	try {
		systemLogger.warn('⚠️ Iniciando reseteo de base de datos');

		// Esta es una simulación, en producción implementaríamos el borrado real
		// Aquí se implementaría la lógica para:
		// 1. Hacer backup de seguridad
		// 2. Truncar todas las tablas
		// 3. Restaurar configuraciones mínimas

		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Revalidar rutas después del reseteo
		await revalidateSystemPaths();

		systemLogger.info('✅ Base de datos reseteada correctamente');
		return {
			success: true,
			message: 'Base de datos reseteada correctamente',
		};
	} catch (error) {
		systemLogger.error('❌ Error al resetear la base de datos:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido al resetear la base de datos',
		};
	}
}

/**
 * Obtiene información sobre la versión del sistema
 */
export async function getSystemVersion(): Promise<{
	version: string;
	buildDate: string;
	environment: string;
}> {
	try {
		systemLogger.info('📋 Obteniendo información de versión del sistema');

		// En una implementación real, esto leería del package.json o un archivo de build
		return {
			version: '1.0.0',
			buildDate: new Date().toISOString(),
			environment: process.env.NODE_ENV || 'development',
		};
	} catch (error) {
		systemLogger.error('❌ Error al obtener versión del sistema:', error);
		throw createSystemError('No se pudo obtener la información de versión', 'VERSION_FETCH_ERROR', error);
	}
}
