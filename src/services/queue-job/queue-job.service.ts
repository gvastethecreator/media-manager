/**
 * @file Servicio para gestión de trabajos en cola
 * @module services/queue-job
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { serializeQueueJobMetadata, transformQueueJob, transformQueueJobs } from '@/transformers/queue-job';
import {
	QueueJobStatus,
	type CreateQueueJobInput,
	type PaginatedQueueJobs,
	type QueueJobExtended,
	type QueueJobFilters,
	type QueueJobPaginationOptions,
	type QueueStats,
	type UpdateQueueJobInput,
} from '@/types/entities/queue-job';
import { getPaginationInfo } from '@/utils/pagination';
import type { Prisma } from '@prisma/client';

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

		const queueJob = await prisma.queueJob.create({
			data: {
				queue: data.queue,
				data: data.data,
				maxAttempts: data.maxAttempts,
				priority: data.priority,
				metadata: data.metadata ? serializeQueueJobMetadata(data.metadata) : undefined,
				status: QueueJobStatus.PENDING,
			},
		});

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
		const existingJob = await prisma.queueJob.findUnique({
			where: { id },
		});

		if (!existingJob) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		// Actualizar el trabajo
		const queueJob = await prisma.queueJob.update({
			where: { id },
			data: {
				...data,
				metadata: data.metadata ? serializeQueueJobMetadata(data.metadata) : undefined,
				updatedAt: new Date(),
			},
		});

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

		const queueJob = await prisma.queueJob.findUnique({
			where: { id },
		});

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
		const existingJob = await prisma.queueJob.findUnique({
			where: { id },
		});

		if (!existingJob) {
			throw new QueueJobServiceError('Trabajo en cola no encontrado', 'NOT_FOUND');
		}

		// Eliminar el trabajo
		await prisma.queueJob.delete({
			where: { id },
		});

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
		const existingJob = await prisma.queueJob.findUnique({
			where: { id },
		});

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
		const queueJob = await prisma.queueJob.update({
			where: { id },
			data: {
				status: QueueJobStatus.CANCELLED,
				finishedAt: new Date(),
				updatedAt: new Date(),
			},
		});

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
		const existingJob = await prisma.queueJob.findUnique({
			where: { id },
		});

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
		const queueJob = await prisma.queueJob.update({
			where: { id },
			data: {
				status: QueueJobStatus.RETRYING,
				progress: 0,
				error: null,
				retryAt: new Date(),
				updatedAt: new Date(),
			},
		});

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
		const where: Prisma.QueueJobWhereInput = {};

		if (filters.queue) {
			where.queue = filters.queue;
		}

		if (filters.status) {
			where.status = filters.status;
		}

		if (filters.priority !== undefined) {
			where.priority = filters.priority;
		}

		if (filters.createdAfter) {
			where.createdAt = {
				...where.createdAt,
				gte: filters.createdAfter,
			};
		}

		if (filters.createdBefore) {
			where.createdAt = {
				...where.createdAt,
				lte: filters.createdBefore,
			};
		}

		// Ejecutar consulta para contar total
		const total = await prisma.queueJob.count({ where });

		// Ejecutar consulta para obtener datos
		const queueJobs = await prisma.queueJob.findMany({
			where,
			orderBy: {
				[sortBy]: sortDirection,
			},
			skip,
			take: limit,
		});

		// Calcular información de paginación
		const { totalPages } = getPaginationInfo(total, limit);

		// Transformar resultados
		const transformedJobs = transformQueueJobs(queueJobs);

		logger.info('✅ Trabajos en cola encontrados:', {
			count: transformedJobs.length,
			total,
			page,
			totalPages,
		});

		return {
			items: transformedJobs,
			total,
			page,
			limit,
			totalPages,
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
		const statusCounts = await prisma.queueJob.groupBy({
			by: ['status'],
			_count: {
				_all: true,
			},
		});

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

		// Calcular total y conteo por estado usando for...of en lugar de forEach
		for (const item of statusCounts) {
			const count = item._count._all;
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
			const completedJobs = await prisma.queueJob.findMany({
				where: {
					status: QueueJobStatus.COMPLETED,
					startedAt: { not: null },
					finishedAt: { not: null },
				},
				select: {
					startedAt: true,
					finishedAt: true,
				},
			});

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

		const queueJobs = await prisma.queueJob.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			take: limit,
		});

		logger.info('✅ Trabajos recientes encontrados', { count: queueJobs.length });
		return transformQueueJobs(queueJobs);
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

		const queueJobs = await prisma.queueJob.findMany({
			where: {
				status,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
		});

		logger.info('✅ Trabajos encontrados por estado', { status, count: queueJobs.length });
		return transformQueueJobs(queueJobs);
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
		const statusCounts = await prisma.queueJob.groupBy({
			by: ['status'],
			where: {
				queue,
			},
			_count: {
				_all: true,
			},
		});

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
			const count = item._count._all;
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
		const count = await prisma.queueJob.count({
			where: {
				status: QueueJobStatus.COMPLETED,
				finishedAt: {
					gte: since,
				},
			},
		});
		return count;
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
		const count = await prisma.queueJob.count({
			where: {
				status: QueueJobStatus.FAILED,
				finishedAt: {
					gte: since,
				},
			},
		});
		return count;
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
		const count = await prisma.queueJob.count({
			where: {
				createdAt: {
					gte: since,
				},
			},
		});
		return count;
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
		const completedJobs = await prisma.queueJob.findMany({
			where: {
				status: QueueJobStatus.COMPLETED,
				startedAt: { not: null },
				finishedAt: {
					gte: since,
				},
			},
			select: {
				startedAt: true,
				finishedAt: true,
			},
		});

		return completedJobs
			.map((job) => {
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
