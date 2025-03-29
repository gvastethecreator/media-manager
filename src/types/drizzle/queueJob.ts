/**
 * @file Tipos para la entidad QueueJob en Drizzle
 * @module types/drizzle/queueJob
 */

import type { BaseEntity } from './base';

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
}

/**
 * Niveles de prioridad para trabajos en cola
 */
export enum QueueJobPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

/**
 * Interfaz para datos genéricos de un trabajo
 */
export interface QueueJobData {
  [key: string]: unknown;
}

/**
 * Interfaz básica para QueueJob en Drizzle
 */
export interface QueueJobEntity extends BaseEntity {
  queue: string;
  data: string; // JSON string
  status: string;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  progress: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  priority: number;
  metadata: string | null; // JSON string
  retryAt: Date | null;
}

/**
 * Interfaz extendida con campos calculados para UI
 */
export interface QueueJobExtended extends QueueJobEntity {
  statusText?: string;
  priorityText?: string;
  parsedData?: QueueJobData;
  parsedMetadata?: Record<string, unknown>;
  timeRemaining?: number;
  elapsedTime?: number;
  formattedCreatedAt?: string;
  formattedStartedAt?: string;
  formattedFinishedAt?: string;
}

/**
 * Interfaz para crear un nuevo trabajo
 */
export interface CreateQueueJobInput {
  queue: string;
  data: QueueJobData | string;
  priority?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown> | string;
}

/**
 * Interfaz para actualizar un trabajo existente
 */
export interface UpdateQueueJobInput {
  status?: string;
  progress?: number;
  error?: string | null;
  data?: QueueJobData | string;
  priority?: number;
  metadata?: Record<string, unknown> | string;
  maxAttempts?: number;
  attempts?: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  retryAt?: Date | null;
}

/**
 * Filtros para buscar trabajos
 */
export interface QueueJobFilters {
  queue?: string;
  status?: string | string[];
  priority?: number | number[];
  createdBefore?: Date;
  createdAfter?: Date;
  search?: string;
}

/**
 * Opciones de paginación
 */
export interface QueueJobPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'queue' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Resultados paginados
 */
export interface PaginatedQueueJobs {
  items: QueueJobExtended[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}