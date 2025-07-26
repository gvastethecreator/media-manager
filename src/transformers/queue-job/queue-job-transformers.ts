/**
 * @file Transformadores para trabajos en cola
 * @module transformers/queue-job
 
 */

import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import { es } from 'date-fns/locale';
import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeJsonField, serializeJsonField } from '@/lib/utils/transformers/common';
import { type QueueJobExtended, type QueueJobMetadata, QueueJobStatus } from '@/types/entities/queue-job';

// Tipo local equivalente a Drizzle (migración a Drizzle)
type DrizzleQueueJob = {
	id: string;
	queue: string;
	data: string; // JSON
	status: string; // Drizzle devuelve string, no enum
	attempts: number;
	maxAttempts: number;
	error?: string | null;
	progress: number;
	startedAt?: Date | null;
	finishedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	priority: number;
	metadata?: string | null; // JSON
	retryAt?: Date | null;
};

const logger = serverLogger.withContext('QueueJobTransformer');

/**
 * Formatea una fecha para mostrar en la UI
 * ✅ MIGRADO A DRIZZLE
 * @param date - Fecha a formatear
 * @returns Fecha formateada
 */
export function formatQueueJobDate(date: Date | null): string | undefined {
	if (!date) return undefined;
	return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Calcula el tiempo transcurrido entre dos fechas
 * ✅ MIGRADO A DRIZZLE
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
 * Serializa la metadata de un trabajo para almacenar en la base de datos
 * ✅ MIGRADO A DRIZZLE
 * @param metadata - Metadata a serializar
 * @returns Metadata serializada como string JSON
 */
export function serializeQueueJobMetadata(metadata: QueueJobMetadata | undefined): string | undefined {
	if (!metadata) return undefined;
	return serializeJsonField(metadata, undefined);
}

/**
 * Parsea y valida la metadata del trabajo
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns Metadata validada
 */
export function parseQueueJobMetadata(job: DrizzleQueueJob): QueueJobMetadata | undefined {
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
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns true si el trabajo está activo
 */
export function isQueueJobActive(job: DrizzleQueueJob): boolean {
	return job.status === 'pending' || job.status === 'processing';
}

/**
 * Determina si un trabajo puede ser reintentado
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns true si el trabajo puede ser reintentado
 */
export function canRetryQueueJob(job: DrizzleQueueJob): boolean {
	return (
		job.status === 'failed' &&
		job.attempts < job.maxAttempts &&
		(!job.retryAt || job.retryAt <= new Date())
	);
}

/**
 * Determina si un trabajo puede ser cancelado
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns true si el trabajo puede ser cancelado
 */
export function canCancelQueueJob(job: DrizzleQueueJob): boolean {
	return job.status === 'pending' || job.status === 'retrying';
}

/**
 * Transforma un QueueJob de Drizzle a un objeto extendido para UI
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns Trabajo extendido con datos adicionales para UI
 */
export function transformQueueJob(job: DrizzleQueueJob): QueueJobExtended {
	const createdAt = new Date(job.createdAt);
	const updatedAt = new Date(job.updatedAt);
	const startedAt = job.startedAt ? new Date(job.startedAt) : null;
	const finishedAt = job.finishedAt ? new Date(job.finishedAt) : null;
	const retryAt = job.retryAt ? new Date(job.retryAt) : null;

	return {
		...job,
		status: job.status as QueueJobStatus, // Convertir string a enum
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
 * Transforma una lista de QueueJobs de Drizzle a objetos extendidos
 * ✅ MIGRADO A DRIZZLE
 * @param jobs - Lista de trabajos de Drizzle
 * @returns Lista de trabajos extendidos
 */
export function transformQueueJobs(jobs: DrizzleQueueJob[]): QueueJobExtended[] {
	return jobs.map(transformQueueJob);
}

/**
 * Calcula el tiempo restante estimado basado en el progreso actual
 * ✅ MIGRADO A DRIZZLE
 * @param job - Trabajo de Drizzle
 * @returns Tiempo restante estimado formateado
 */
function calculateEstimatedTimeRemaining(job: DrizzleQueueJob): string | undefined {
	if (!job.startedAt || job.progress <= 0) return undefined;

	const elapsedMs = Date.now() - job.startedAt.getTime();
	const progressPercent = job.progress / 100;
	const estimatedTotalMs = elapsedMs / progressPercent;
	const remainingMs = estimatedTotalMs - elapsedMs;

	const duration = intervalToDuration({ start: 0, end: remainingMs });
	return formatDuration(duration, { locale: es });
}
