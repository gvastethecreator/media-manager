/**
 * @file Tipos para la entidad QueueJob
 * @module types/entities/queueJob/types
 */

import type { QueueJob as PrismaQueueJob } from '@prisma/client';

/**
 * Enums para estados del trabajo en cola
 */
export enum QueueJobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	RETRYING = 'retrying',
	CANCELLED = 'cancelled',
}

/**
 * Enums para prioridades
 */
export enum QueueJobPriority {
	LOW = 0,
	NORMAL = 5,
	HIGH = 10,
	CRITICAL = 20,
}

/**
 * Tipos para los datos de trabajo en cola
 */
export interface QueueJobData {
	[key: string]: unknown;
}

/**
 * Interfaz base para QueueJob
 */
export interface QueueJobBase extends PrismaQueueJob {
	id: string;
	queue: string;
	data: string;
	status: string;
	attempts: number;
	maxAttempts: number;
	error: string | null;
	progress: number;
	startedAt: Date | null;
	finishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	priority: number;
	metadata: string | null;
	retryAt: Date | null;
}

/**
 * Interfaz para campos UI calculados
 */
export interface QueueJobUI {
	statusText: string;
	priorityText: string;
	elapsedTime: number;
	timeRemaining?: number;
	formattedCreatedAt: string;
	formattedStartedAt?: string;
	formattedFinishedAt?: string;
}

/**
 * Interfaz para campos de datos deserializados
 */
export interface QueueJobDeserialized extends QueueJobBase {
	parsedData?: QueueJobData;
	parsedMetadata?: Record<string, unknown>;
	_ui?: QueueJobUI;
}

/**
 * Interfaz completa que incluye todos los campos y campos calculados
 */
export interface QueueJobComplete extends QueueJobBase {
	parsedData?: QueueJobData;
	parsedMetadata?: Record<string, unknown>;
	_ui: QueueJobUI;
}

/**
 * Interfaz para crear un nuevo trabajo
 */
export interface CreateQueueJobInput {
	queue: string;
	data: QueueJobData | string;
	status?: QueueJobStatus;
	priority?: QueueJobPriority;
	maxAttempts?: number;
	metadata?: Record<string, unknown> | string;
}

/**
 * Interfaz para actualizar un trabajo
 */
export interface UpdateQueueJobInput {
	status?: QueueJobStatus;
	progress?: number;
	error?: string | null;
	data?: QueueJobData | string;
	priority?: QueueJobPriority;
	metadata?: Record<string, unknown> | string;
	maxAttempts?: number;
	attempts?: number;
	retryAt?: Date | null;
}

/**
 * Interfaz para filtros de búsqueda
 */
export interface QueueJobFilters {
	queue?: string;
	status?: QueueJobStatus | QueueJobStatus[];
	priority?: QueueJobPriority | QueueJobPriority[];
	createdBefore?: Date;
	createdAfter?: Date;
	search?: string;
}

/**
 * Interfaz para opciones de búsqueda
 */
export interface QueueJobSearchOptions {
	page?: number;
	limit?: number;
	sortBy?: 'createdAt' | 'priority' | 'queue' | 'status';
	sortDirection?: 'asc' | 'desc';
	filters?: QueueJobFilters;
}

/**
 * Interfaz para resultados paginados
 */
export interface QueueJobSearchResult {
	items: QueueJobComplete[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Tipo para opciones de paginación (alias para compatibilidad)
 */
export type QueueJobPaginationOptions = Omit<QueueJobSearchOptions, 'filters'>;

/**
 * Tipo para resultados paginados (alias para compatibilidad)
 */
export type PaginatedQueueJobs = QueueJobSearchResult;

/**
 * Tipo para QueueJob extendido (alias para compatibilidad)
 */
export type QueueJobExtended = QueueJobComplete;
