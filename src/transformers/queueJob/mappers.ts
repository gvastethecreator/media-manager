/**
 * @file Funciones de mapeo para la entidad QueueJob
 * @module transformers/queueJob/mappers
 */

import { createLogger } from '@/lib/logger';
import {
    CreateQueueJobInput,
    QueueJobBase,
    QueueJobComplete,
    QueueJobFilters,
    QueueJobSearchOptions,
    QueueJobSearchResult,
    QueueJobStatus,
    UpdateQueueJobInput
} from '@/types/entities/queueJob/types';
import { Prisma } from '@prisma/client';
import { extendQueueJob, stringifyQueueJobData, stringifyQueueJobMetadata } from './serializers';

// Logger específico para este módulo
const logger = createLogger('QueueJobTransformer:Mappers');

/**
 * Mapea datos de creación de QueueJob a formato compatible con Prisma
 * @param data Datos de creación de QueueJob
 * @returns Objeto formateado para Prisma
 */
export function toCreateQueueJobData(data: CreateQueueJobInput): Prisma.QueueJobCreateInput {
  try {
    return {
      queue: data.queue,
      data: typeof data.data === 'string' ? data.data : stringifyQueueJobData(data.data) || '{}',
      status: data.status || QueueJobStatus.PENDING,
      priority: data.priority || 0,
      maxAttempts: data.maxAttempts || 3,
      metadata: data.metadata ? stringifyQueueJobMetadata(data.metadata) : null,
    };
  } catch (error) {
    logger.error('Error mapeando datos de creación de QueueJob', error);
    throw new Error(`Error mapeando datos de creación: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea datos de actualización de QueueJob a formato compatible con Prisma
 * @param data Datos de actualización de QueueJob
 * @returns Objeto formateado para Prisma
 */
export function toUpdateQueueJobData(data: UpdateQueueJobInput): Prisma.QueueJobUpdateInput {
  try {
    // Crear objeto con solo las propiedades definidas
    const prismaData: Prisma.QueueJobUpdateInput = {};

    if (data.status !== undefined) prismaData.status = data.status;
    if (data.progress !== undefined) prismaData.progress = data.progress;
    if (data.error !== undefined) prismaData.error = data.error;
    if (data.data !== undefined) {
      prismaData.data = typeof data.data === 'string'
        ? data.data
        : stringifyQueueJobData(data.data) || '{}';
    }
    if (data.priority !== undefined) prismaData.priority = data.priority;
    if (data.metadata !== undefined) {
      prismaData.metadata = typeof data.metadata === 'string'
        ? data.metadata
        : stringifyQueueJobMetadata(data.metadata);
    }
    if (data.maxAttempts !== undefined) prismaData.maxAttempts = data.maxAttempts;
    if (data.attempts !== undefined) prismaData.attempts = data.attempts;
    if (data.retryAt !== undefined) prismaData.retryAt = data.retryAt;

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de QueueJob', error);
    throw new Error(`Error mapeando datos de actualización: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto de opciones para Prisma
 */
export function toSearchOptions(options: QueueJobSearchOptions = {}): {
  skip?: number;
  take?: number;
  orderBy?: any;
  where?: any;
} {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      filters = {}
    } = options;

    // Calcular paginación
    const skip = (page - 1) * limit;
    const take = limit;

    // Mapear filtros
    const where = toSearchFilters(filters);

    // Mapear ordenación
    const orderBy = { [sortBy]: sortDirection };

    return { skip, take, orderBy, where };
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de QueueJob', error);
    return { skip: 0, take: 20 };
  }
}

/**
 * Mapea filtros de QueueJob a formato compatible con Prisma para consultas
 * @param filters Filtros de QueueJob
 * @returns Objeto de condiciones para Prisma
 */
export function toSearchFilters(filters: QueueJobFilters): any {
  try {
    const where: Record<string, any> = {};

    // Filtrar por cola
    if (filters.queue) {
      where.queue = filters.queue;
    }

    // Filtrar por estado
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Filtrar por prioridad
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        where.priority = { in: filters.priority };
      } else {
        where.priority = filters.priority;
      }
    }

    // Filtrar por rango de fechas
    if (filters.createdBefore || filters.createdAfter) {
      where.createdAt = {};
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
    }

    // Filtrar por búsqueda
    if (filters.search) {
      where.OR = [
        { queue: { contains: filters.search, mode: 'insensitive' } },
        { data: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  } catch (error) {
    logger.error('Error mapeando filtros de QueueJob', error);
    return {};
  }
}

/**
 * Mapea un array de QueueJobs a un resultado de búsqueda con paginación
 * @param queueJobs QueueJobs a mapear
 * @param options Opciones de búsqueda
 * @param total Total de QueueJobs sin paginar
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(
  queueJobs: QueueJobBase[],
  options: QueueJobSearchOptions = {},
  total: number
): QueueJobSearchResult {
  try {
    const { page = 1, limit = 20 } = options;
    const totalPages = Math.ceil(total / limit);

    // Deserializar y extender los trabajos
    const items = queueJobs.map(job => extendQueueJob(job));

    return {
      items: items as QueueJobComplete[],
      total,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    logger.error('Error en toSearchResult:', error);
    throw new Error(`Error al mapear resultado de búsqueda: ${error instanceof Error ? error.message : String(error)}`);
  }
}