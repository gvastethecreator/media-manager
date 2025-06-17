/**
 * @file Transformadores para trabajos en cola
 * @module transformers/queue-job
 */

import type { QueueJob } from '@prisma/client';
import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import { es } from 'date-fns/locale';
import { serverLogger } from '@/lib/logger/server-logger';
import { type QueueJobExtended, type QueueJobMetadata, QueueJobStatus } from '@/types/entities/queue-job';
import { deserializeJsonField, serializeJsonField } from '@/utils/transformers/common';

const logger = serverLogger.withContext('QueueJobTransformer');

/**
 * Formatea una fecha para mostrar en la UI
 * @param date - Fecha a formatear
 * @returns Fecha formateada
 */
export function formatQueueJobDate(date: Date | null): string | undefined {
	if (!date) return undefined;
	return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Calcula el tiempo transcurrido entre dos fechas
 * @param start - Fecha de inicio
 * @param end - Fecha de fin
 * @returns Duración formateada
 */
export function calculateDuration(start: Date | null, end: Date | null): string | undefined {
	if (!start) return undefined;
	const endDate = end || new Date();
	const duration = intervalToDuration({ start, end: endDate });
	return formatDuration(duration, { locale: es });
}

/**
 * Parsea y valida la metadata del trabajo
 * @param job - Trabajo de Prisma
 * @returns Metadata validada
 */
export function parseQueueJobMetadata(job: QueueJob): QueueJobMetadata | undefined {
	if (!job.metadata) return undefined;

	try {
		return deserializeJsonField(job.metadata, {});
	} catch (error) {
		logger.error('Error parsing queue job metadata:', error);
		return undefined;
	}
}

/**
 * Determina si un trabajo está activo
 * @param job - Trabajo de Prisma
 * @returns true si el trabajo está activo
 */
export function isQueueJobActive(job: QueueJob): boolean {
	return job.status === QueueJobStatus.PENDING || job.status === QueueJobStatus.PROCESSING;
}

/**
 * Determina si un trabajo puede ser reintentado
 * @param job - Trabajo de Prisma
 * @returns true si el trabajo puede ser reintentado
 */
export function canRetryQueueJob(job: QueueJob): boolean {
	return (
		job.status === QueueJobStatus.FAILED &&
		job.attempts < job.maxAttempts &&
		(!job.retryAt || job.retryAt <= new Date())
	);
}

/**
 * Determina si un trabajo puede ser cancelado
 * @param job - Trabajo de Prisma
 * @returns true si el trabajo puede ser cancelado
 */
export function canCancelQueueJob(job: QueueJob): boolean {
	return job.status === QueueJobStatus.PENDING || job.status === QueueJobStatus.RETRYING;
}

/**
 * Transforma un QueueJob de Prisma a un objeto extendido para UI
 * @param job - Trabajo de Prisma
 * @returns Trabajo extendido con datos adicionales para UI
 */
export function transformQueueJob(job: QueueJob): QueueJobExtended {
	const createdAt = new Date(job.createdAt);
	const updatedAt = new Date(job.updatedAt);
	const startedAt = job.startedAt ? new Date(job.startedAt) : null;
	const finishedAt = job.finishedAt ? new Date(job.finishedAt) : null;
	const retryAt = job.retryAt ? new Date(job.retryAt) : null;

	return {
		...job,
		parsedMetadata: parseQueueJobMetadata(job),
		formattedCreatedAt: formatQueueJobDate(createdAt),
		formattedUpdatedAt: formatQueueJobDate(updatedAt),
		formattedStartedAt: formatQueueJobDate(startedAt),
		formattedFinishedAt: formatQueueJobDate(finishedAt),
		formattedRetryAt: formatQueueJobDate(retryAt),
		elapsedTime: calculateDuration(startedAt, finishedAt),
		estimatedTimeRemaining: job.progress > 0 ? calculateEstimatedTimeRemaining(job) : undefined,
		isActive: isQueueJobActive(job),
		canRetry: canRetryQueueJob(job),
		canCancel: canCancelQueueJob(job),
	};
}

/**
 * Transforma una lista de QueueJobs de Prisma a objetos extendidos
 * @param jobs - Lista de trabajos de Prisma
 * @returns Lista de trabajos extendidos
 */
export function transformQueueJobs(jobs: QueueJob[]): QueueJobExtended[] {
	return jobs.map(transformQueueJob);
}

/**
 * Calcula el tiempo restante estimado basado en el progreso actual
 * @param job - Trabajo de Prisma
 * @returns Tiempo restante estimado formateado
 */
function calculateEstimatedTimeRemaining(job: QueueJob): string | undefined {
	if (!job.startedAt || job.progress <= 0) return undefined;

	const elapsedMs = Date.now() - job.startedAt.getTime();
	const progressPercent = job.progress / 100;
	const estimatedTotalMs = elapsedMs / progressPercent;
	const remainingMs = estimatedTotalMs - elapsedMs;

	const duration = intervalToDuration({ start: 0, end: remainingMs });
	return formatDuration(duration, { locale: es });
}

/**
 * Serializa la metadata de un trabajo para almacenar en la base de datos
 * @param metadata - Metadata a serializar
 * @returns Metadata serializada como string JSON
 */
export function serializeQueueJobMetadata(metadata: QueueJobMetadata | undefined): string | undefined {
	if (!metadata) return undefined;
	return serializeJsonField(metadata, undefined);
}
