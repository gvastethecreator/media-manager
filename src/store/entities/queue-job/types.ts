/**
 * @file Tipos para el store de trabajos en cola
 * @module store/entities/queue-job/types
 */

import type {
    QueueJobExtended,
    QueueStats
} from '@/types/entities/queue-job';
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
  CUSTOM = 'CUSTOM'
}

/**
 * Estados posibles de un trabajo en cola
 */
export enum QueueJobStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DELAYED = 'DELAYED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
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
}

/**
 * Valores iniciales para el estado core
 */
export const initialCoreState: QueueJobCoreState = {
  items: [],
  selectedJob: null,
  stats: null,
  isLoading: false,
  error: null
};

/**
 * Estado del store completo usando la arquitectura de slices
 */
export interface QueueJobState {
  core: QueueJobCoreState;
  ui: typeof initialUIState;
  filters: typeof initialFiltersState;
}

/**
 * Estado inicial completo del store
 */
export const initialQueueJobState: QueueJobState = {
  core: initialCoreState,
  ui: initialUIState,
  filters: initialFiltersState
};