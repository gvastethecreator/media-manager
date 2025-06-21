'use server';

/**
 * @file Acciones de consulta para trabajos en cola
 * @module app/actions/queue/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    findQueueJobs,
    findQueueJobsByStatus,
    findRecentQueueJobs,
    getQueueJobById,
} from '@/services/queue-job/queue-job.service';
import {
    type PaginatedQueueJobs,
    type QueueJobExtended,
    type QueueJobFilters,
    type QueueJobPaginationOptions,
    QueueJobStatus,
} from '@/types/entities/queue-job';
import { unstable_cache } from 'next/cache';

// Logger específico para acciones de consulta
const logger = serverLogger.withContext('QueueActions:query');

// Tiempo de caché en segundos
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Interfaz para errores de consulta de cola
 */
export interface QueueQueryErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de consulta de cola (enfoque funcional)
 */
function createQueueQueryError(message: string, code?: string, cause?: unknown): QueueQueryErrorData {
	return {
		name: 'QueueQueryError',
		message,
		code,
		cause,
	};
}

/**
 * Obtiene un trabajo específico por ID
 * @param id - ID del trabajo
 * @returns Trabajo o null si no existe
 */
export async function getQueueJob(id: string): Promise<QueueJobExtended | null> {
	const getCachedJob = unstable_cache(
		async () => {
			try {
				logger.debug('🔍 Buscando trabajo en cola por ID', { id });
				return await getQueueJobById(id);
			} catch (error) {
				logger.error('❌ Error al buscar trabajo en cola:', error);
				throw error;
			}
		},
		['queue-job', id],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-jobs'],
		}
	);

	return getCachedJob();
}

/**
 * Obtiene una lista paginada de trabajos con filtros
 * @param filters - Filtros a aplicar
 * @param pagination - Opciones de paginación
 * @returns Lista paginada de trabajos
 */
export async function getQueueJobs(
	filters: QueueJobFilters = {},
	pagination: QueueJobPaginationOptions = { page: 1, limit: 20 }
): Promise<PaginatedQueueJobs> {
	const getCachedJobs = unstable_cache(
		async () => {
			try {
				logger.debug('📋 Obteniendo lista de trabajos en cola', { filters, pagination });
				return await findQueueJobs(filters, pagination);
			} catch (error) {
				logger.error('❌ Error al obtener lista de trabajos en cola:', error);
				throw error;
			}
		},
		['queue-jobs-list', JSON.stringify(filters), JSON.stringify(pagination)],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-jobs'],
		}
	);

	return getCachedJobs();
}

/**
 * Obtiene trabajos recientes
 */
export async function getRecentQueueJobs(limit = 10): Promise<QueueJobExtended[]> {
	const getCachedRecentJobs = unstable_cache(
		async () => {
			try {
				logger.info('📥 Obteniendo trabajos recientes');

				const jobs = await findRecentQueueJobs(limit);

				logger.info('✅ Trabajos recientes obtenidos:', { count: jobs.length });
				return jobs;
			} catch (error) {
				logger.error('❌ Error al obtener trabajos recientes:', error);
				throw createQueueQueryError('No se pudieron obtener los trabajos recientes', 'RECENT_FAILED', error);
			}
		},
		['queue-jobs-recent', limit.toString()],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-jobs'],
		}
	);

	return getCachedRecentJobs();
}

/**
 * Obtiene trabajos por estado
 */
export async function getQueueJobsByStatus(status: QueueJobStatus, limit = 10): Promise<QueueJobExtended[]> {
	const getCachedJobsByStatus = unstable_cache(
		async () => {
			try {
				logger.info('📥 Obteniendo trabajos por estado:', status);

				const jobs = await findQueueJobsByStatus(status, limit);

				logger.info('✅ Trabajos por estado obtenidos:', { status, count: jobs.length });
				return jobs;
			} catch (error) {
				logger.error('❌ Error al obtener trabajos por estado:', error);
				throw createQueueQueryError('No se pudieron obtener los trabajos por estado', 'STATUS_FAILED', error);
			}
		},
		['queue-jobs-status', status, limit.toString()],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['queue-jobs'],
		}
	);

	return getCachedJobsByStatus();
}

/**
 * Obtiene estadísticas de la cola
 * @returns Estadísticas de la cola
 */
