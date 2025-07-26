/**
 * @file Tipos para el store de trabajos en cola
 * @module store/entities/queue-job/types
 */

import type { QueueJobExtended, QueueStats } from '@/types/entities/queue-job';
import { initialFiltersState } from './slices/filters';
import { initialUIState } from './slices/ui';

/**
 * Tipos de trabajos en cola
 */
export enum QueueJobType {
	PROCESS_IMAGE = 'PROCESS_IMAGE',
	GENERATE_THUMBNAIL = 'GENERATE_THUMBNAIL',
	COMPRESS_FILES = 'COMPRESS_FILES',
	SEND_NOTIFICATION = 'SEND_NOTIFICATION',
	GENERATE_REPORT = 'GENERATE_REPORT',
	IMPORT_DATA = 'IMPORT_DATA',
	EXPORT_DATA = 'EXPORT_DATA',
	BACKUP = 'BACKUP',
	CLEANUP = 'CLEANUP',
	CUSTOM = 'CUSTOM',
}

/**
 * Estados posibles de un trabajo en cola
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
 * Campos por los que se puede ordenar
 */
export type QueueJobSortField =
	| 'id'
	| 'name'
	| 'type'
	| 'status'
	| 'priority'
	| 'progress'
	| 'createdAt'
	| 'updatedAt'
	| 'startedAt'
	| 'completedAt';

/**
 * Orden de ordenamiento
 */
export type QueueJobSortOrder = 'asc' | 'desc';

/**
 * Estado core del store
 */
export interface QueueJobCoreState {
	/** Lista de trabajos */
	items: QueueJobExtended[];
	/** Trabajo seleccionado */
	selectedJob: QueueJobExtended | null;
	/** Estadísticas de la cola */
	stats: QueueStats | null;
	/** Indica si se está cargando */
	isLoading: boolean;
	/** Error actual */
	error: Error | null;
	/** Total de elementos */
	total: number;
	/** Página actual */
	page: number;
	/** Límite por página */
	limit: number;
	/** Total de páginas */
	totalPages: number;
}

/**
 * Valores iniciales para el estado core
 */
export const initialCoreState: QueueJobCoreState = {
	items: [],
	selectedJob: null,
	stats: null,
	isLoading: false,
	error: null,
	total: 0,
	page: 1,
	limit: 20,
	totalPages: 0,
};

/**
 * Opciones de paginación
 */
export interface QueueJobPagination {
	page: number;
	limit: number;
	sortField?: QueueJobSortField;
	sortOrder?: QueueJobSortOrder;
}

/**
 * Estado del store completo usando la arquitectura de slices
 */
export interface QueueJobState extends QueueJobCoreState {
	ui: typeof initialUIState;
	filters: typeof initialFiltersState;
	pagination: QueueJobPagination;
}

/**
 * Estado inicial de paginación
 */
export const initialPaginationState: QueueJobPagination = {
	page: 1,
	limit: 20,
	sortField: 'createdAt',
	sortOrder: 'desc',
};

/**
 * Estado inicial completo del store
 */
export const initialQueueJobState: QueueJobState = {
	...initialCoreState,
	ui: initialUIState,
	filters: initialFiltersState,
	pagination: initialPaginationState,
};
