import { prisma } from "@/lib/prisma";
import { transformQueueJobs } from "@/transformers/queueJob/queueJob-transformers";
import {
	type PaginatedQueueJobs,
	type QueueJobFilters,
	type QueueJobPaginationOptions,
	QueueJobStatus
} from "@/types/entities/queueJob/queueJob-types";
import type { QueueJob } from "@prisma/client";

/**
 * Comprueba si un trabajo ha excedido su número máximo de intentos
 */
export function hasExceededMaxAttempts(job: QueueJob): boolean {
  return job.attempts >= job.maxAttempts;
}

/**
 * Comprueba si un trabajo está listo para ser reintentado
 */
export function isReadyForRetry(job: QueueJob): boolean {
  // Si no tiene fecha de reintento, no está listo
  if (!job.retryAt) return false;

  // Si la fecha de reintento es en el futuro, no está listo
  if (new Date(job.retryAt) > new Date()) return false;

  // Si ha excedido el número máximo de intentos, no está listo
  if (hasExceededMaxAttempts(job)) return false;

  // Si el estado no es fallido o pendiente, no está listo
  if (job.status !== QueueJobStatus.FAILED && job.status !== QueueJobStatus.PENDING) return false;

  return true;
}

/**
 * Calcula la fecha del próximo reintento con backoff exponencial
 */
export function calculateNextRetryTime(attempts: number, baseDelayMs = 5000): Date {
  // Backoff exponencial: delay = baseDelay * 2^attempts
  // Con un poco de aleatoriedad para evitar thundering herd
  const exponentialDelay = baseDelayMs * Math.pow(2, attempts);
  const jitter = exponentialDelay * 0.2 * Math.random(); // 20% de jitter
  const delayMs = exponentialDelay + jitter;

  return new Date(Date.now() + delayMs);
}

/**
 * Construye una consulta Prisma para QueueJob con filtros
 */
export function buildQueueJobQuery(filters: QueueJobFilters = {}) {
  const query: Record<string, unknown> = {};

  // Filtro por cola
  if (filters.queue) {
    query.queue = filters.queue;
  }

  // Filtro por estado
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query.status = { in: filters.status };
    } else {
      query.status = filters.status;
    }
  }

  // Filtro por prioridad
  if (filters.priority !== undefined) {
    if (Array.isArray(filters.priority)) {
      query.priority = { in: filters.priority };
    } else {
      query.priority = filters.priority;
    }
  }

  // Filtros de fecha
  if (filters.createdBefore || filters.createdAfter) {
    query.createdAt = {};

    if (filters.createdBefore) {
      query.createdAt.lte = filters.createdBefore;
    }

    if (filters.createdAfter) {
      query.createdAt.gte = filters.createdAfter;
    }
  }

  // Búsqueda por texto (en datos o metadatos)
  if (filters.search) {
    query.OR = [
      { queue: { contains: filters.search } },
      { data: { contains: filters.search } },
      { metadata: { contains: filters.search } },
    ];
  }

  return query;
}

/**
 * Recupera trabajos de cola paginados con filtros
 */
export async function getPaginatedQueueJobs(
  filters: QueueJobFilters = {},
  pagination: QueueJobPaginationOptions = {}
): Promise<PaginatedQueueJobs> {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortDirection = "desc"
  } = pagination;

  const where = buildQueueJobQuery(filters);

  // Construir ordenación
  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortDirection;

  // Consultar total de registros
  const total = await prisma.queueJob.count({ where });

  // Calcular total de páginas
  const totalPages = Math.ceil(total / limit);

  // Calcular offset
  const skip = (page - 1) * limit;

  // Consultar registros
  const jobs = await prisma.queueJob.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  });

  // Transformar resultados
  const transformedJobs = transformQueueJobs(jobs);

  return {
    items: transformedJobs,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Encuentra trabajos listos para ser procesados
 */
export async function findJobsReadyToProcess(
  queue: string,
  limit = 10
): Promise<QueueJob[]> {
  return prisma.queueJob.findMany({
    where: {
      queue,
      status: QueueJobStatus.PENDING,
      OR: [
        { retryAt: null },
        { retryAt: { lte: new Date() } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
    take: limit,
  });
}

/**
 * Busca trabajos que necesitan ser reintentados
 */
export async function findJobsForRetry(limit = 20): Promise<QueueJob[]> {
  return prisma.queueJob.findMany({
    where: {
      status: QueueJobStatus.FAILED,
      retryAt: { lte: new Date() },
      attempts: { lt: prisma.queueJob.fields.maxAttempts },
    },
    orderBy: [
      { priority: "desc" },
      { retryAt: "asc" },
    ],
    take: limit,
  });
}

/**
 * Cuenta los trabajos por estado
 */
export async function countJobsByStatus(queue?: string): Promise<Record<string, number>> {
  const where = queue ? { queue } : {};

  const counts = await prisma.queueJob.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
    where,
  });

  // Inicializar con todos los estados posibles
  const result: Record<string, number> = Object.values(QueueJobStatus).reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {}
  );

  // Llenar con datos reales
  counts.forEach((item) => {
    result[item.status] = item._count.status;
  });

  return result;
}

/**
 * Limpia trabajos antiguos completados o fallidos
 */
export async function cleanupOldJobs(
  olderThan: Date,
  statuses = [QueueJobStatus.COMPLETED, QueueJobStatus.FAILED]
): Promise<number> {
  const result = await prisma.queueJob.deleteMany({
    where: {
      status: { in: statuses },
      updatedAt: { lt: olderThan },
    },
  });

  return result.count;
}

/**
 * Agrupa trabajos por cola y cuenta por estado
 */
export async function getQueueStats(): Promise<Array<{ queue: string; counts: Record<string, number> }>> {
  // Obtener todas las colas únicas
  const queues = await prisma.queueJob.findMany({
    select: { queue: true },
    distinct: ["queue"],
  });

  // Para cada cola, obtener estadísticas
  const stats = await Promise.all(
    queues.map(async ({ queue }) => {
      const counts = await countJobsByStatus(queue);
      return { queue, counts };
    })
  );

  return stats;
}