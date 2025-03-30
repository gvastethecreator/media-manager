/**
 * @file Esquema de validación para la entidad QueueJob
 * @module types/entities/queueJob/schema
 */

import { BaseEntitySchema, MetadataFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import { QueueJobPriority, QueueJobStatus } from './types';

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const QueueJobFiltersSchema = z.object({
  queue: z.string().optional(),
  status: z.union([
    z.nativeEnum(QueueJobStatus),
    z.array(z.nativeEnum(QueueJobStatus))
  ]).optional(),
  priority: z.union([
    z.nativeEnum(QueueJobPriority),
    z.array(z.nativeEnum(QueueJobPriority))
  ]).optional(),
  createdBefore: z.date().optional(),
  createdAfter: z.date().optional(),
  search: z.string().optional()
});

/**
 * 🔎 Esquema para opciones de paginación
 */
export const QueueJobPaginationOptionsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20),
  sortBy: z.enum(['createdAt', 'priority', 'queue', 'status']).optional().default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * 📝 Esquema principal para QueueJob
 */
export const QueueJobSchema = z.object({
  ...BaseEntitySchema.shape,
  ...MetadataFieldsSchema.shape,
  id: z.string(),
  queue: z.string(),
  data: z.string(), // JSON serializado
  status: z.nativeEnum(QueueJobStatus).default(QueueJobStatus.PENDING),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3),
  error: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  startedAt: z.date().nullable().optional(),
  finishedAt: z.date().nullable().optional(),
  priority: z.number().int().nonnegative().default(QueueJobPriority.NORMAL),
  metadata: z.string().nullable().optional(), // JSON serializado
  retryAt: z.date().nullable().optional()
});

/**
 * 🆕 Esquema para creación de QueueJob
 */
export const CreateQueueJobSchema = z.object({
  queue: z.string(),
  data: z.union([z.string(), z.record(z.unknown())]),
  status: z.nativeEnum(QueueJobStatus).optional().default(QueueJobStatus.PENDING),
  priority: z.nativeEnum(QueueJobPriority).optional().default(QueueJobPriority.NORMAL),
  maxAttempts: z.number().int().positive().optional().default(3),
  metadata: z.union([z.string(), z.record(z.unknown())]).optional()
});

/**
 * 🔄 Esquema para actualización de QueueJob
 */
export const UpdateQueueJobSchema = z.object({
  status: z.nativeEnum(QueueJobStatus).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: z.string().nullable().optional(),
  data: z.union([z.string(), z.record(z.unknown())]).optional(),
  priority: z.nativeEnum(QueueJobPriority).optional(),
  metadata: z.union([z.string(), z.record(z.unknown())]).optional(),
  maxAttempts: z.number().int().positive().optional(),
  attempts: z.number().int().nonnegative().optional(),
  retryAt: z.date().nullable().optional()
});