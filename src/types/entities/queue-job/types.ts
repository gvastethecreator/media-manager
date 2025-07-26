/**
 * @file Tipos canónicos para la entidad QueueJob
 * @module types/entities/queue-job/types
 * @description Estructura unificada y validada para QueueJob.
 * Última migración: 2025-06-18
 */

/**
 * Enum para el estado del trabajo en cola
 */
export enum QueueJobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	RETRYING = 'retrying',
	CANCELLED = 'cancelled',
	PAUSED = 'paused',
}

/**
 * Tipo base canónico para QueueJob
 */
export interface QueueJobBase {
	id: string;
	queue: string;
	data: string;
	status: QueueJobStatus;
	attempts: number;
	maxAttempts: number;
	error?: string | null;
	progress: number;
	startedAt?: Date | null;
	finishedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	priority: number;
	metadata?: string | null;
	retryAt?: Date | null;
}

/**
 * Tipo para metadata del trabajo
 */
export interface QueueJobMetadata {
	source?: string;
	target?: string;
	processId?: string;
	tags?: string[];
	customData?: Record<string, unknown>;
}

/**
 * Input para creación
 */
export interface QueueJobCreateInput {
	queue: string;
	data: string;
	maxAttempts?: number;
	priority?: number;
	metadata?: QueueJobMetadata;
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
	// Propiedades adicionales para UI
	duration?: number;
	executionTime?: number;
	parsedMetadata?: QueueJobMetadata;
	formattedCreatedAt?: string;
	formattedUpdatedAt?: string;
	formattedStartedAt?: string;
	formattedFinishedAt?: string;
	formattedRetryAt?: string;
	elapsedTime?: string;
	estimatedTimeRemaining?: string;
	isActive?: boolean;
	canRetry?: boolean;
	canCancel?: boolean;
}

/**
 * Filtros para búsqueda de queue jobs
 */
export interface QueueJobFilters {
	queue?: string;
	status?: QueueJobStatus | null;
	statusList?: QueueJobStatus[];
	type?: string | null;
	typeList?: string[];
	startDate?: Date | null;
	endDate?: Date | null;
	userId?: string | null;
	priority?: number | null;
	sortField?: string;
	sortOrder?: string;
	page?: number;
	pageSize?: number;
	totalItems?: number;
	totalPages?: number;
	searchTerm?: string;
	createdAfter?: Date;
	createdBefore?: Date;
}

/**
 * Opciones de paginación para queue jobs
 */
export interface QueueJobPaginationOptions {
	page?: number;
	limit?: number;
	sortBy?: 'createdAt' | 'priority' | 'status' | 'queue';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado de queue jobs
 */
export interface PaginatedQueueJobs {
	items: QueueJobBase[];
	total: number;
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

/**
 * Estadísticas de la cola
 */
export interface QueueStats {
	total: number;
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	retrying: number;
	cancelled: number;
	paused: number;
	queue?: string; // Opcional para estadísticas específicas de cola
	successRate?: number; // Porcentaje de éxito
	failureRate?: number; // Porcentaje de fallo
	averageProcessingTime?: number; // Tiempo promedio de procesamiento en ms
}

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con QueueJobSchema antes de persistir.
