'use server';

/**
 * @file Acciones para estadísticas de trabajos en cola
 * @module app/actions/queue/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import * as QueueJobService from '@/services/queue-job.service';
import type { QueueStats } from '@/types/entities/queue-job';
import { QueueJobStatus } from '@/types/entities/queue-job';
import { unstable_cache } from 'next/cache';

// Logger específico para acciones de estadísticas
const logger = serverLogger.withContext('QueueActions:stats');

// Tiempo de caché en segundos
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Interfaz para errores de estadísticas de cola
 */
export interface QueueStatsErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de estadísticas de cola (enfoque funcional)
 */
function createQueueStatsError(message: string, code?: string, cause?: unknown): QueueStatsErrorData {
	return {
		name: 'QueueStatsError',
		message,
		code,
		cause,
	};
}

/**
 * Obtiene estadísticas de colas
 * @returns Estadísticas generales de todas las colas
 */
export async function getQueueStats(): Promise<QueueStats> {
	const getCachedStats = unstable_cache(
		async () => {
			try {
				logger.debug('📊 Obteniendo estadísticas de cola');
				return await QueueJobService.getQueueStats();
			} catch (error) {
				logger.error('❌ Error al obtener estadísticas de cola:', error);
				throw error;
			}
		},
		['queue-stats-general'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-stats'],
		}
	);

	return getCachedStats();
}

/**
 * Obtiene estadísticas por cola específica
 */
export async function getQueueStatsByQueue(queue: string): Promise<Record<string, number>> {
	const getCachedQueueStats = unstable_cache(
		async () => {
			try {
				logger.info('📊 Obteniendo estadísticas de cola:', queue);

				// Obtener conteo por estado para la cola específica
				const stats = await QueueJobService.getQueueStatsByQueue(queue);

				// Asegurar que todos los estados tengan un valor
				for (const status of Object.values(QueueJobStatus)) {
					if (!stats[status]) {
						stats[status] = 0;
					}
				}

				logger.info('✅ Estadísticas de cola obtenidas:', { queue, stats });
				return stats;
			} catch (error) {
				logger.error('❌ Error al obtener estadísticas de cola:', error);
				throw createQueueStatsError('No se pudieron obtener las estadísticas de la cola', 'QUEUE_STATS_FAILED', error);
			}
		},
		['queue-stats', queue],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-stats'],
		}
	);

	return getCachedQueueStats();
}

/**
 * Obtiene estadísticas de rendimiento de la cola
 */
export async function getQueuePerformanceStats(): Promise<{
	averageProcessingTime: number;
	successRate: number;
	failureRate: number;
	throughput: number;
}> {
	const getCachedPerformanceStats = unstable_cache(
		async () => {
			try {
				logger.info('📊 Obteniendo estadísticas de rendimiento');

				// Obtener trabajos completados en la última hora
				const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

				const [completedJobs, failedJobs, totalJobs, processingTimes] = await Promise.all([
					// Trabajos completados
					QueueJobService.countCompletedJobs(oneHourAgo),
					// Trabajos fallidos
					QueueJobService.countFailedJobs(oneHourAgo),
					// Total de trabajos procesados
					QueueJobService.countTotalJobs(oneHourAgo),
					// Tiempos de procesamiento
					QueueJobService.findProcessingTimes(oneHourAgo),
				]);

				// Calcular tiempo promedio de procesamiento
				const totalProcessingTime = processingTimes.reduce((acc, job) => {
					if (job.startedAt && job.completedAt) {
						return acc + (job.completedAt.getTime() - job.startedAt.getTime());
					}
					return acc;
				}, 0);

				const averageProcessingTime =
					processingTimes.length > 0
						? totalProcessingTime / processingTimes.length / 1000 // Convertir a segundos
						: 0;

				// Calcular tasas de éxito y fallo
				const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
				const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

				// Calcular throughput (trabajos por hora)
				const throughput = totalJobs;

				const stats = {
					averageProcessingTime,
					successRate,
					failureRate,
					throughput,
				};

				logger.info('✅ Estadísticas de rendimiento obtenidas:', stats);
				return stats;
			} catch (error) {
				logger.error('❌ Error al obtener estadísticas de rendimiento:', error);
				throw createQueueStatsError(
					'No se pudieron obtener las estadísticas de rendimiento',
					'PERFORMANCE_STATS_FAILED',
					error
				);
			}
		},
		['queue-performance-stats'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-stats'],
		}
	);

	return getCachedPerformanceStats();
}
