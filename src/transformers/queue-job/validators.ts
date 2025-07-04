/**
 * @file Validadores para la entidad QueueJob
 * @module transformers/queue-job/validators
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const QueueJobCreateSchema = z.object({
	type: z.string().min(1),
	status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending'),
	priority: z.number().int().min(0).max(10).default(5),
	data: z.any().default({}),
	metadata: z.any().default({}),
	maxRetries: z.number().int().min(0).default(3),
	retryCount: z.number().int().min(0).default(0),
	scheduledFor: z.date().optional(),
});

export const QueueJobUpdateSchema = z.object({
	status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
	priority: z.number().int().min(0).max(10).optional(),
	data: z.any().optional(),
	metadata: z.any().optional(),
	maxRetries: z.number().int().min(0).optional(),
	retryCount: z.number().int().min(0).optional(),
	scheduledFor: z.date().optional(),
	startedAt: z.date().optional(),
	completedAt: z.date().optional(),
	failedAt: z.date().optional(),
	error: z.string().optional(),
});

export const QueueJobSchema = z.object({
	id: z.string().uuid(),
	type: z.string(),
	status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
	priority: z.number().int().min(0).max(10),
	data: z.any(),
	metadata: z.any(),
	maxRetries: z.number().int().min(0),
	retryCount: z.number().int().min(0),
	scheduledFor: z.date().nullable(),
	startedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	failedAt: z.date().nullable(),
	error: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateQueueJobCreate(data: unknown) {
	return QueueJobCreateSchema.parse(data);
}

export function validateQueueJobUpdate(data: unknown) {
	return QueueJobUpdateSchema.parse(data);
}

export function validateQueueJob(data: unknown) {
	return QueueJobSchema.parse(data);
}
