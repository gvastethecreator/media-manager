/**
 * @file Tipos base para trabajos en cola
 * @module types/entities/queue-job
 */

import type { QueueJob } from '@prisma/client';
import type {
    CreateQueueJobSchemaType,
    QueueJobFiltersSchemaType,
    QueueJobMetadataSchemaType,
    QueueJobPaginationSchemaType,
    UpdateQueueJobSchemaType
} from './schema';

// Re-exportar tipos inferidos de Zod
export type QueueJobMetadata = QueueJobMetadataSchemaType;
export type CreateQueueJobInput = CreateQueueJobSchemaType;
export type UpdateQueueJobInput = UpdateQueueJobSchemaType;
export type QueueJobFilters = QueueJobFiltersSchemaType;
export type QueueJobPaginationOptions = QueueJobPaginationSchemaType;

/**
 * Interfaz extendida para QueueJob con campos adicionales para UI
 * @extends QueueJob - Modelo base de Prisma
 */
export interface QueueJobExtended extends QueueJob {
  /** Metadata parseada del trabajo */
  parsedMetadata?: QueueJobMetadata;
  /** Fecha de creación formateada */
  formattedCreatedAt?: string;
  /** Fecha de actualización formateada */
  formattedUpdatedAt?: string;
  /** Fecha de inicio formateada */
  formattedStartedAt?: string;
  /** Fecha de finalización formateada */
  formattedFinishedAt?: string;
  /** Fecha de próximo reintento formateada */
  formattedRetryAt?: string;
  /** Tiempo transcurrido desde la creación */
  elapsedTime?: string;
  /** Tiempo restante estimado */
  estimatedTimeRemaining?: string;
  /** Indica si el trabajo está activo */
  isActive?: boolean;
  /** Indica si el trabajo puede ser reintentado */
  canRetry?: boolean;
  /** Indica si el trabajo puede ser cancelado */
  canCancel?: boolean;
}

/**
 * Tipo para resultados paginados de trabajos
 */
export interface PaginatedQueueJobs {
  /** Lista de trabajos */
  items: QueueJobExtended[];
  /** Total de trabajos */
  total: number;
  /** Página actual */
  page: number;
  /** Límite de items por página */
  limit: number;
  /** Total de páginas */
  totalPages: number;
}

/**
 * Tipo para estadísticas de cola
 */
export interface QueueStats {
  /** Total de trabajos */
  total: number;
  /** Trabajos pendientes */
  pending: number;
  /** Trabajos en proceso */
  processing: number;
  /** Trabajos completados */
  completed: number;
  /** Trabajos fallidos */
  failed: number;
  /** Trabajos en reintento */
  retrying: number;
  /** Trabajos cancelados */
  cancelled: number;
  /** Tiempo promedio de procesamiento */
  averageProcessingTime?: number;
  /** Tasa de éxito */
  successRate?: number;
  /** Tasa de fallos */
  failureRate?: number;
}