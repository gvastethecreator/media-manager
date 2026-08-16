/**
 * @file Tipos canónicos para la entidad QueueJob
 * @module types/entities/queue-job/types
 * @description Estructura unificada y validada para QueueJob.
 * Última migración: 2025-06-18
 */

import { QueueJobStatus } from './enums';

/**
 * Tipo base canónico para QueueJob
 */
export interface QueueJobBase {
	attempts: number;
	createdAt: Date;
	data: string;
	error?: string | null;
	finishedAt?: Date | null;
	id: string;
	idempotencyKey?: string | null;
	maxAttempts: number;
	metadata?: string | null;
	priority: number;
	progress: number;
	queue: string;
	retryAt?: Date | null;
	startedAt?: Date | null;
	status: QueueJobStatus;
	updatedAt: Date;
}

/**
 * Tipo para metadata del trabajo
 */
export interface QueueJobMetadata {
	customData?: Record<string, unknown>;
	processId?: string;
	source?: string;
	tags?: string[];
	target?: string;
}

/**
 * Input para creación
 */
export interface QueueJobCreateInput {
	data: string;
	idempotencyKey?: string;
	maxAttempts?: number;
	metadata?: QueueJobMetadata;
	priority?: number;
	queue: string;
}

/**
 * Input para actualización
 */
export interface QueueJobUpdateInput extends Partial<Omit<QueueJobBase, 'id' | 'createdAt' | 'updatedAt'>> {}

/**
 * Input para creación (alias para compatibilidad)
 */
export type CreateQueueJobInput = QueueJobCreateInput;

/**
 * Input para actualización (alias para compatibilidad)
 */
export type UpdateQueueJobInput = QueueJobUpdateInput;

/**
 * Queue job extendido con relaciones
 */
export interface QueueJobExtended extends QueueJobBase {
	canCancel?: boolean;
	canRetry?: boolean;
	// Propiedades adicionales para UI
	duration?: number;
	elapsedTime?: string;
	estimatedTimeRemaining?: string;
	executionTime?: number;
	formattedCreatedAt?: string;
	formattedFinishedAt?: string;
	formattedRetryAt?: string;
	formattedStartedAt?: string;
	formattedUpdatedAt?: string;
	isActive?: boolean;
	parsedMetadata?: QueueJobMetadata;
}

/**
 * Filtros para búsqueda de queue jobs
 */
export interface QueueJobFilters {
	createdAfter?: Date;
	createdBefore?: Date;
	endDate?: Date | null;
	page?: number;
	pageSize?: number;
	priority?: number | null;
	queue?: string;
	searchTerm?: string;
	sortField?: string;
	sortOrder?: string;
	startDate?: Date | null;
	status?: QueueJobStatus | null;
	statusList?: QueueJobStatus[];
	totalItems?: number;
	totalPages?: number;
	type?: string | null;
	typeList?: string[];
	userId?: string | null;
}

/**
 * Opciones de paginación para queue jobs
 */
export interface QueueJobPaginationOptions {
	limit?: number;
	page?: number;
	sortBy?: 'createdAt' | 'priority' | 'status' | 'queue';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado de queue jobs
 */
export interface PaginatedQueueJobs {
	items: QueueJobBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	total: number;
}

/**
 * Estadísticas de la cola
 */
export interface QueueStats {
	averageProcessingTime?: number; // Tiempo promedio de procesamiento en ms
	cancelled: number;
	completed: number;
	failed: number;
	failureRate?: number; // Porcentaje de fallo
	paused: number;
	pending: number;
	processing: number;
	queue?: string; // Opcional para estadísticas específicas de cola
	retrying: number;
	successRate?: number; // Porcentaje de éxito
	total: number;
}

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con QueueJobSchema antes de persistir.

// Re-export enum for convenience
export { QueueJobStatus };
