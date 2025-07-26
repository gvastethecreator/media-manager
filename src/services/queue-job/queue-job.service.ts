/**
 * @file Servicio para gestión de trabajos en cola
 * @module services/queue-job
 */

import * as crypto from 'crypto';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { queueJobs } from '@/lib/database/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { getPaginationInfo } from '@/lib/utils/pagination';
import { serializeQueueJobMetadata, transformQueueJob, transformQueueJobs } from '@/transformers/queue-job';
import {
	type CreateQueueJobInput,
	type PaginatedQueueJobs,
	type QueueJobExtended,
	type QueueJobFilters,
	type QueueJobPaginationOptions,
	QueueJobStatus,
	type QueueStats,
	type UpdateQueueJobInput,
} from '@/types/entities/queue-job';

// Logger específico para el servicio
const logger = serverLogger.withContext('QueueJobService');

/**
 * Clase de error personalizada para operaciones de QueueJob
 */
export class QueueJobServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'QueueJobServiceError';
	}
}

/**
 * Crea un nuevo trabajo en la cola
 * @param data - Datos para la creación del trabajo
 * @returns El trabajo creado y transformado
 */
export async function createQueueJob(data: CreateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.info('📋 Creando nuevo trabajo en cola:', { queue: data.queue });

		const [queueJob] = await db
			.insert(queueJobs)
			.values({
				id: crypto.randomUUID(), // Generate UUID for id
				queue: data.queue,
				data: JSON.stringify(data.data), // Store data as JSON string
				maxAttempts: data.maxAttempts,
				priority: data.priority,
				metadata: data.metadata ? serializeQueueJobMetadata(data.metadata) : null,
				status: QueueJobStatus.PENDING,
			})
			.returning();

		logger.info('✅ Trabajo en cola creado:', { id: queueJob.id, queue: queueJob.queue });
		return transformQueueJob(queueJob);
	} catch (error) {
		logger.error('❌ Error al crear trabajo en cola:', error);
		throw new QueueJobServiceError('No se pudo crear el trabajo en cola', 'CREATE_FAILED', error);
	}
}

/**
 * Actualiza un trabajo en la cola existente
 * @param id - ID del trabajo a actualizar
 * @param data - Datos para actualizar
 * @returns El trabajo actualizado y transformado
 */
export async function updateQueueJob(id: string, data: UpdateQueueJobInput): Promise<QueueJobExtended> {
	try {
		logger.info('📝 Actualizando trabajo en cola:', { id, data });

		// Verificar que el trabajo existe
		const existingJob = await db.select().from(queueJobs).where(eq(queueJobs.id, id));

		if (existingJob.length === 0) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		// Actualizar el trabajo
		const [queueJob] = await db
			.update(queueJobs)
			.set({
				...data,
				data: data.data ? JSON.stringify(data.data) : existingJob[0].data, // Handle data as JSON string
				metadata: data.metadata ? serializeQueueJobMetadata(data.metadata) : null,
				updatedAt: sql`(strftime('%s', 'now'))`,
			})
			.where(eq(queueJobs.id, id))
			.returning();

		logger.info('✅ Trabajo en cola actualizado:', { id });
		return transformQueueJob(queueJob);
	} catch (error) {
		logger.error('❌ Error al actualizar trabajo en cola:', { id, error });
		throw new QueueJobServiceError('No se pudo actualizar el trabajo en cola', 'UPDATE_FAILED', error);
	}
}

/**
 * Obtiene un trabajo en cola por ID
 * @param id - ID del trabajo a obtener
 * @returns El trabajo transformado o null si no existe
 */
export async function getQueueJobById(id: string): Promise<QueueJobExtended | null> {
	try {
		logger.info('🔍 Buscando trabajo en cola por ID:', { id });

		const [queueJob] = await db.select().from(queueJobs).where(eq(queueJobs.id, id));

		if (!queueJob) {
			logger.info('⚠️ Trabajo en cola no encontrado:', { id });
			return null;
		}

		logger.info('✅ Trabajo en cola encontrado:', { id });
		return transformQueueJob(queueJob);
	} catch (error) {
		logger.error('❌ Error al buscar trabajo en cola:', { id, error });
		throw new QueueJobServiceError('Error al buscar trabajo en cola', 'FETCH_FAILED', error);
	}
}

/**
 * Elimina un trabajo en cola
 * @param id - ID del trabajo a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteQueueJob(id: string): Promise<boolean> {
	try {
		logger.info('🗑️ Eliminando trabajo en cola:', { id });

		// Verificar que el trabajo existe
		const existingJob = await db.select().from(queueJobs).where(eq(queueJobs.id, id));

		if (existingJob.length === 0) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		// Eliminar el trabajo
		await db.delete(queueJobs).where(eq(queueJobs.id, id));

		logger.info('✅ Trabajo en cola eliminado:', { id });
		return true;
	} catch (error) {
		logger.error('❌ Error al eliminar trabajo en cola:', { id, error });
		throw new QueueJobServiceError('No se pudo eliminar el trabajo en cola', 'DELETE_FAILED', error);
	}
}

/**
 * Cancela un trabajo en cola pendiente
 * @param id - ID del trabajo a cancelar
 * @returns El trabajo actualizado
 */
export async function cancelQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.info('🚫 Cancelando trabajo en cola:', { id });

		// Verificar que el trabajo existe y puede ser cancelado
		const [existingJob] = await db.select().from(queueJobs).where(eq(queueJobs.id, id));

		if (!existingJob) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		if (existingJob.status !== QueueJobStatus.PENDING && existingJob.status !== QueueJobStatus.RETRYING) {
			throw new QueueJobServiceError(
				'No se puede cancelar un trabajo que no está pendiente o en reintento',
				'INVALID_STATUS'
			);
		}

		// Cancelar el trabajo
		const [queueJob] = await db
			.update(queueJobs)
			.set({
				status: QueueJobStatus.CANCELLED,
				finishedAt: sql`(strftime('%s', 'now'))`,
				updatedAt: sql`(strftime('%s', 'now'))`,
			})
			.where(eq(queueJobs.id, id))
			.returning();

		logger.info('✅ Trabajo en cola cancelado:', { id });
		return transformQueueJob(queueJob);
	} catch (error) {
		logger.error('❌ Error al cancelar trabajo en cola:', { id, error });
		throw new QueueJobServiceError('No se pudo cancelar el trabajo en cola', 'CANCEL_FAILED', error);
	}
}

/**
 * Reintenta un trabajo en cola fallido
 * @param id - ID del trabajo a reintentar
 * @returns El trabajo actualizado
 */
export async function retryQueueJob(id: string): Promise<QueueJobExtended> {
	try {
		logger.info('🔄 Reintentando trabajo en cola:', { id });

		// Verificar que el trabajo existe y puede ser reintentado
		const [existingJob] = await db.select().from(queueJobs).where(eq(queueJobs.id, id));

		if (!existingJob) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		if (existingJob.status !== QueueJobStatus.FAILED) {
			throw new QueueJobServiceError('Solo se pueden reintentar trabajos fallidos', 'INVALID_STATUS');
		}

		if (existingJob.attempts >= existingJob.maxAttempts) {
			throw new QueueJobServiceError('Se ha excedido el número máximo de intentos', 'MAX_ATTEMPTS_EXCEEDED');
		}

		// Reintentar el trabajo
		const [queueJob] = await db
			.update(queueJobs)
			.set({
				status: QueueJobStatus.RETRYING,
				progress: 0,
				error: null,
				retryAt: sql`(strftime('%s', 'now'))`,
				updatedAt: sql`(strftime('%s', 'now'))`,
			})
			.where(eq(queueJobs.id, id))
			.returning();

		logger.info('✅ Trabajo en cola preparado para reintento:', { id });
		return transformQueueJob(queueJob);
	} catch (error) {
		logger.error('❌ Error al reintentar trabajo en cola:', { id, error });
		throw new QueueJobServiceError('No se pudo reintentar el trabajo en cola', 'RETRY_FAILED', error);
	}
}

/**
 * Busca trabajos en cola con filtros y paginación
 * @param filters - Filtros de búsqueda
 * @param pagination - Opciones de paginación
 * @returns Resultado paginado de trabajos
 */
export async function findQueueJobs(
	filters: QueueJobFilters = {},
	pagination: QueueJobPaginationOptions = {}
): Promise<PaginatedQueueJobs> {
	try {
		logger.info('🔍 Buscando trabajos en cola:', { filters, pagination });

		// Configurar opciones de paginación
		const page = pagination.page || 1;
		const limit = pagination.limit || 10;
		const skip = (page - 1) * limit;
		const sortBy = pagination.sortBy || 'createdAt';
		const sortDirection = pagination.sortDirection || 'desc';

		// Construir condiciones de filtro
		const whereConditions = [];

		if (filters.queue) {
			whereConditions.push(eq(queueJobs.queue, filters.queue));
		}

		if (filters.status) {
			whereConditions.push(eq(queueJobs.status, filters.status));
		}

		if (filters.priority !== undefined) {
			whereConditions.push(eq(queueJobs.priority, filters.priority));
		}

		if (filters.createdAfter) {
			whereConditions.push(gte(queueJobs.createdAt, filters.createdAfter));
		}

		if (filters.createdBefore) {
			whereConditions.push(lte(queueJobs.createdAt, filters.createdBefore));
		}

		const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

		// Ejecutar consulta para contar total
		const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(queueJobs).where(finalWhere);
		const total = totalResult.count;

		// Ejecutar consulta para obtener datos
		const queueJobsData = await db
			.select()
			.from(queueJobs)
			.where(finalWhere)
			.orderBy(sortDirection === 'asc' ? queueJobs[sortBy] : sql`${queueJobs[sortBy]} DESC`)
			.offset(skip)
			.limit(limit);

		// Calcular información de paginación
		const { totalPages } = getPaginationInfo(page, limit, total);

		// Transformar resultados
		const transformedJobs = transformQueueJobs(queueJobsData);

		logger.info('✅ Trabajos en cola encontrados:', {
			count: transformedJobs.length,
			total,
			page,
			totalPages,
		});

		return {
			items: transformedJobs,
			total,
			pagination: {
				page,
				limit,
				total,
				totalPages,
			},
		};
	} catch (error) {
		logger.error('❌ Error al buscar trabajos en cola:', error);
		throw new QueueJobServiceError('Error al buscar trabajos en cola', 'SEARCH_FAILED', error);
	}
}

/**
 * Obtiene estadísticas de la cola de trabajos
 * @returns Estadísticas de la cola
 */
export async function getQueueStats(): Promise<QueueStats> {
	try {
		logger.info('📊 Obteniendo estadísticas de la cola');

		// Obtener conteo por estado
		const statusCounts = await db
			.select({
				status: queueJobs.status,
				count: sql<number>`count(*)`,
			})
			.from(queueJobs)
			.groupBy(queueJobs.status);

		// Inicializar estadísticas
		const stats: QueueStats = {
			total: 0,
			pending: 0,
			processing: 0,
			completed: 0,
			failed: 0,
			retrying: 0,
			cancelled: 0,
			paused: 0,
		};

		// Calcular total y conteo por estado
		for (const item of statusCounts) {
			const count = item.count;
			stats.total += count;

			switch (item.status) {
				case QueueJobStatus.PENDING:
					stats.pending = count;
					break;
				case QueueJobStatus.PROCESSING:
					stats.processing = count;
					break;
				case QueueJobStatus.COMPLETED:
					stats.completed = count;
					break;
				case QueueJobStatus.FAILED:
					stats.failed = count;
					break;
				case QueueJobStatus.RETRYING:
					stats.retrying = count;
					break;
				case QueueJobStatus.CANCELLED:
					stats.cancelled = count;
					break;
				case QueueJobStatus.PAUSED:
					stats.paused = count;
					break;
			}
		}

		// Calcular tasas de éxito y fallo si hay trabajos completados o fallidos
		const processedJobs = stats.completed + stats.failed;
		if (processedJobs > 0) {
			stats.successRate = (stats.completed / processedJobs) * 100;
			stats.failureRate = (stats.failed / processedJobs) * 100;
		}

		// Calcular tiempo promedio de procesamiento
		if (stats.completed > 0) {
			const completedJobs = await db
				.select()
				.from(queueJobs)
				.where(
					and(
						eq(queueJobs.status, QueueJobStatus.COMPLETED),
						sql`${queueJobs.startedAt} IS NOT NULL`,
						sql`${queueJobs.finishedAt} IS NOT NULL`
					)
				);

			if (completedJobs.length > 0) {
				const totalTime = completedJobs.reduce((sum, job) => {
					if (job.startedAt && job.finishedAt) {
						return sum + (job.finishedAt.getTime() - job.startedAt.getTime());
					}
					return sum;
				}, 0);

				stats.averageProcessingTime = totalTime / completedJobs.length;
			}
		}

		logger.info('✅ Estadísticas de cola obtenidas:', stats);
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas de cola:', error);
		throw new QueueJobServiceError('Error al obtener estadísticas de cola', 'STATS_FAILED', error);
	}
}

/**
 * Verifica si un trabajo coincide con los criterios de filtro
 * @param job - Trabajo a verificar
 * @param filters - Filtros a aplicar
 * @returns true si el trabajo coincide con los filtros
 */
export function matchesFilters(job: QueueJobExtended, filters: QueueJobFilters = {}): boolean {
	// Si no hay filtros, siempre coincide
	if (Object.keys(filters).length === 0) {
		return true;
	}

	// Verificar coincidencia con cada filtro
	if (filters.queue && job.queue !== filters.queue) {
		return false;
	}

	if (filters.status && job.status !== filters.status) {
		return false;
	}

	if (filters.priority !== undefined && job.priority !== filters.priority) {
		return false;
	}

	if (filters.createdAfter && new Date(job.createdAt) < new Date(filters.createdAfter)) {
		return false;
	}

	if (filters.createdBefore && new Date(job.createdAt) > new Date(filters.createdBefore)) {
		return false;
	}

	// Si pasó todas las verificaciones, coincide con los filtros
	return true;
}

/**
 * Busca trabajos recientes, limitados por cantidad
 * @param limit - Número máximo de trabajos a devolver
 * @returns Lista de trabajos recientes
 */
export async function findRecentQueueJobs(limit = 5): Promise<QueueJobExtended[]> {
	try {
		logger.info('🕒 Buscando trabajos recientes', { limit });

		const queueJobsData = await db.select().from(queueJobs).orderBy(sql`${queueJobs.createdAt} DESC`).limit(limit);

		logger.info('✅ Trabajos recientes encontrados', { count: queueJobsData.length });
		return transformQueueJobs(queueJobsData);
	} catch (error) {
		logger.error('❌ Error al buscar trabajos recientes:', error);
		throw new QueueJobServiceError('Error al buscar trabajos recientes', 'FETCH_RECENT_FAILED', error);
	}
}

/**
 * Busca trabajos por estado, limitados por cantidad
 * @param status - Estado de los trabajos a buscar
 * @param limit - Número máximo de trabajos a devolver
 * @returns Lista de trabajos con el estado especificado
 */
export async function findQueueJobsByStatus(status: QueueJobStatus, limit = 10): Promise<QueueJobExtended[]> {
	try {
		logger.info('🔍 Buscando trabajos por estado', { status, limit });

		const queueJobsData = await db
			.select()
			.from(queueJobs)
			.where(eq(queueJobs.status, status))
			.orderBy(sql`${queueJobs.updatedAt} DESC`)
			.limit(limit);

		logger.info('✅ Trabajos encontrados por estado', { status, count: queueJobsData.length });
		return transformQueueJobs(queueJobsData);
	} catch (error) {
		logger.error('❌ Error al buscar trabajos por estado:', { status, error });
		throw new QueueJobServiceError('Error al buscar trabajos por estado', 'FETCH_BY_STATUS_FAILED', error);
	}
}

/**
 * Obtiene estadísticas para una cola específica
 * @param queue - Nombre de la cola
 * @returns Estadísticas de la cola específica
 */
export async function getQueueStatsByQueue(queue: string): Promise<QueueStats> {
	try {
		logger.info('📊 Obteniendo estadísticas para cola específica', { queue });

		// Obtener conteo por estado para la cola específica
		const statusCounts = await db
			.select({
				status: queueJobs.status,
				count: sql<number>`count(*)`,
			})
			.from(queueJobs)
			.where(eq(queueJobs.queue, queue))
			.groupBy(queueJobs.status);

		// Inicializar estadísticas
		const stats: QueueStats = {
			total: 0,
			pending: 0,
			processing: 0,
			completed: 0,
			failed: 0,
			retrying: 0,
			cancelled: 0,
			paused: 0,
			queue,
		};

		// Calcular total y conteo por estado
		for (const item of statusCounts) {
			const count = item.count;
			stats.total += count;

			switch (item.status) {
				case QueueJobStatus.PENDING:
					stats.pending = count;
					break;
				case QueueJobStatus.PROCESSING:
					stats.processing = count;
					break;
				case QueueJobStatus.COMPLETED:
					stats.completed = count;
					break;
				case QueueJobStatus.FAILED:
					stats.failed = count;
					break;
				case QueueJobStatus.RETRYING:
					stats.retrying = count;
					break;
				case QueueJobStatus.CANCELLED:
					stats.cancelled = count;
					break;
				case QueueJobStatus.PAUSED:
					stats.paused = count;
					break;
			}
		}

		// Calcular tasas de éxito y fallo si hay trabajos completados o fallidos
		const processedJobs = stats.completed + stats.failed;
		if (processedJobs > 0) {
			stats.successRate = (stats.completed / processedJobs) * 100;
			stats.failureRate = (stats.failed / processedJobs) * 100;
		}

		logger.info('✅ Estadísticas obtenidas para cola específica', { queue, stats });
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas para cola específica:', { queue, error });
		throw new QueueJobServiceError('Error al obtener estadísticas para cola específica', 'QUEUE_STATS_FAILED', error);
	}
}

/**
 * Cuenta los trabajos completados después de una fecha determinada
 * @param since - Fecha de inicio para contar
 * @returns Número de trabajos completados
 */
export async function countCompletedJobs(since: Date): Promise<number> {
	try {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(queueJobs)
			.where(and(eq(queueJobs.status, QueueJobStatus.COMPLETED), gte(queueJobs.finishedAt, since)));
		return result.count;
	} catch (error) {
		logger.error('❌ Error al contar trabajos completados:', error);
		throw new QueueJobServiceError('Error al contar trabajos completados', 'COUNT_COMPLETED_FAILED', error);
	}
}

/**
 * Cuenta los trabajos fallidos después de una fecha determinada
 * @param since - Fecha de inicio para contar
 * @returns Número de trabajos fallidos
 */
export async function countFailedJobs(since: Date): Promise<number> {
	try {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(queueJobs)
			.where(and(eq(queueJobs.status, QueueJobStatus.FAILED), gte(queueJobs.finishedAt, since)));
		return result.count;
	} catch (error) {
		logger.error('❌ Error al contar trabajos fallidos:', error);
		throw new QueueJobServiceError('Error al contar trabajos fallidos', 'COUNT_FAILED_FAILED', error);
	}
}

/**
 * Cuenta el total de trabajos después de una fecha determinada
 * @param since - Fecha de inicio para contar
 * @returns Número total de trabajos
 */
export async function countTotalJobs(since: Date): Promise<number> {
	try {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(queueJobs)
			.where(gte(queueJobs.createdAt, since));
		return result.count;
	} catch (error) {
		logger.error('❌ Error al contar total de trabajos:', error);
		throw new QueueJobServiceError('Error al contar total de trabajos', 'COUNT_TOTAL_FAILED', error);
	}
}

/**
 * Busca los tiempos de procesamiento de trabajos completados después de una fecha determinada
 * @param since - Fecha de inicio para buscar
 * @returns Array de tiempos de procesamiento en milisegundos
 */
export async function findProcessingTimes(since: Date): Promise<number[]> {
	try {
		const completedJobs = await db
			.select()
			.from(queueJobs)
			.where(
				and(
					eq(queueJobs.status, QueueJobStatus.COMPLETED),
					sql`${queueJobs.startedAt} IS NOT NULL`,
					gte(queueJobs.finishedAt, since)
				)
			);

		return completedJobs
			.map((job: (typeof completedJobs)[0]) => {
				if (job.startedAt && job.finishedAt) {
					return job.finishedAt.getTime() - job.startedAt.getTime();
				}
				return 0;
			})
			.filter((time) => time > 0);
	} catch (error) {
		logger.error('❌ Error al buscar tiempos de procesamiento:', error);
		throw new QueueJobServiceError('Error al buscar tiempos de procesamiento', 'FIND_PROCESSING_TIMES_FAILED', error);
	}
}
