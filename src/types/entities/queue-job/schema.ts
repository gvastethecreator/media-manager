/**
 * @file Esquema Zod para la entidad QueueJob
 * @module types/entities/queue-job/schema
 */

import { z } from 'zod';
import { QueueJobStatus } from './types';

/**
 * Esquema Zod para validación de QueueJob
 */
export const QueueJobSchema = z.object({
	id: z.string(),
	queue: z.string(),
	data: z.string(),
	status: z.nativeEnum(QueueJobStatus),
	attempts: z.number(),
	maxAttempts: z.number(),
	error: z.string().nullable().optional(),
	progress: z.number(),
	startedAt: z.date().nullable().optional(),
	finishedAt: z.date().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	priority: z.number(),
	metadata: z.string().nullable().optional(),
	retryAt: z.date().nullable().optional(),
});

// Esquema para metadata de trabajo
export const queueJobMetadataSchema = z
	.object({
		source: z.string().optional(),
		target: z.string().optional(),
		processId: z.string().optional(),
		tags: z.array(z.string()).optional(),
		customData: z.record(z.string(), z.unknown()).optional(),
	})
	.optional();

// Esquema para crear un trabajo
export const createQueueJobSchema = z.object({
	queue: z.string().min(1, 'Cola requerida'),
	data: z.string().min(1, 'Datos requeridos'),
	maxAttempts: z.number().int().min(1).max(10).default(3),
	priority: z.number().int().min(0).max(10).default(0),
	metadata: queueJobMetadataSchema,
});

// Esquema para actualizar un trabajo
export const updateQueueJobSchema = z
	.object({
		status: z.nativeEnum(QueueJobStatus).optional(),
		attempts: z.number().int().min(0).optional(),
		error: z.string().optional(),
		progress: z.number().int().min(0).max(100).optional(),
		startedAt: z.date().optional(),
		finishedAt: z.date().optional(),
		retryAt: z.date().optional(),
		metadata: queueJobMetadataSchema,
	})
	.partial();

// Esquema para filtros de búsqueda
export const queueJobFiltersSchema = z.object({
	queue: z.string().optional(),
	status: z.nativeEnum(QueueJobStatus).optional(),
	priority: z.number().int().min(0).max(10).optional(),
	createdAfter: z.date().optional(),
	createdBefore: z.date().optional(),
});

// Esquema para opciones de paginación
export const queueJobPaginationSchema = z.object({
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
	sortBy: z.enum(['createdAt', 'priority', 'status', 'queue']).optional(),
	sortDirection: z.enum(['asc', 'desc']).optional(),
});

// Inferencia de tipos desde los esquemas
export type QueueJobMetadataSchemaType = z.infer<typeof queueJobMetadataSchema>;
export type CreateQueueJobSchemaType = z.infer<typeof createQueueJobSchema>;
export type UpdateQueueJobSchemaType = z.infer<typeof updateQueueJobSchema>;
export type QueueJobFiltersSchemaType = z.infer<typeof queueJobFiltersSchema>;
export type QueueJobPaginationSchemaType = z.infer<typeof queueJobPaginationSchema>;
export type QueueJobStatusType = keyof typeof QueueJobStatus;

// Alias para compatibilidad con rutas del servidor
export const CreateQueueJobInputSchema = createQueueJobSchema;
export const UpdateQueueJobInputSchema = updateQueueJobSchema;
