import { QueueJob } from "@prisma/client";

// Enums para estados del trabajo en cola
export enum QueueJobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  RETRYING = "retrying",
  CANCELLED = "cancelled",
}

// Enums para prioridades
export enum QueueJobPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

// Tipos para los datos de trabajo en cola
export interface QueueJobData {
  [key: string]: unknown;
}

// Interfaz extendida para QueueJob
export interface QueueJobExtended extends QueueJob {
  // Campos adicionales para UI/cliente que no están en el modelo Prisma
  statusText?: string;
  priorityText?: string;
  parsedData?: QueueJobData;
  progress?: number;
  timeRemaining?: number;
  elapsedTime?: number;
  formattedCreatedAt?: string;
  formattedStartedAt?: string;
  formattedFinishedAt?: string;
}

// Tipo para crear un nuevo trabajo
export interface CreateQueueJobInput {
  queue: string;
  data: QueueJobData | string;
  priority?: QueueJobPriority;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}

// Tipo para actualizar un trabajo
export interface UpdateQueueJobInput {
  status?: QueueJobStatus;
  progress?: number;
  error?: string | null;
  data?: QueueJobData | string;
  priority?: QueueJobPriority;
  metadata?: Record<string, unknown>;
  maxAttempts?: number;
}

// Tipo para filtros de búsqueda
export interface QueueJobFilters {
  queue?: string;
  status?: QueueJobStatus | QueueJobStatus[];
  priority?: QueueJobPriority | QueueJobPriority[];
  createdBefore?: Date;
  createdAfter?: Date;
  search?: string;
}

// Tipo para opciones de paginación
export interface QueueJobPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "priority" | "queue" | "status";
  sortDirection?: "asc" | "desc";
}

// Tipo para resultados paginados
export interface PaginatedQueueJobs {
  items: QueueJobExtended[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}