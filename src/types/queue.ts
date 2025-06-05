/**
 * @file Tipos para el sistema de cola de procesamiento
 * @module types/queue
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Estado de trabajo en cola
 */
export enum QueueJobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
	RETRYING = 'retrying',
}

/**
 * Prioridad de trabajo
 */
export enum QueueJobPriority {
	LOW = 'low',
	NORMAL = 'normal',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Tipo de trabajo
 */
export enum QueueJobType {
	FILE_PROCESSING = 'file-processing',
	IMAGE_OPTIMIZATION = 'image-optimization',
	THUMBNAIL_GENERATION = 'thumbnail-generation',
	METADATA_EXTRACTION = 'metadata-extraction',
	BATCH_OPERATION = 'batch-operation',
	EXPORT = 'export',
	IMPORT = 'import',
	BACKUP = 'backup',
	CUSTOM = 'custom',
}

/**
 * Trabajo en cola
 */
export interface QueueJob {
	id: EntityId;
	type: QueueJobType;
	priority: QueueJobPriority;
	status: QueueJobStatus;
	progress: number;
	payload: JSONString<Record<string, unknown>>;
	result?: JSONString<Record<string, unknown>>;
	error?: string;
	attempts: number;
	maxAttempts: number;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	nextRetryAt?: Date;
}

/**
 * Opciones de trabajo
 */
export interface QueueJobOptions {
	priority?: QueueJobPriority;
	maxAttempts?: number;
	retryDelay?: number;
	timeout?: number;
	removeOnComplete?: boolean;
	removeOnFail?: boolean;
}

/**
 * Estado de cola
 */
export interface QueueStats {
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
	paused: boolean;
}

/**
 * Evento de cola
 */
export interface QueueEvent {
	id: EntityId;
	jobId: EntityId;
	type: string;
	payload: JSONString<Record<string, unknown>>;
	timestamp: Date;
}

// Validaciones Zod
export const queueJobStatusSchema = z.nativeEnum(QueueJobStatus);
export const queueJobPrioritySchema = z.nativeEnum(QueueJobPriority);
export const queueJobTypeSchema = z.nativeEnum(QueueJobType);

export const queueJobSchema = z.object({
	id: z.string(),
	type: queueJobTypeSchema,
	priority: queueJobPrioritySchema,
	status: queueJobStatusSchema,
	progress: z.number().min(0).max(100),
	payload: z.string(),
	result: z.string().optional(),
	error: z.string().optional(),
	attempts: z.number().nonnegative(),
	maxAttempts: z.number().positive(),
	createdAt: z.date(),
	startedAt: z.date().optional(),
	completedAt: z.date().optional(),
	nextRetryAt: z.date().optional(),
});

export const queueJobOptionsSchema = z.object({
	priority: queueJobPrioritySchema.optional(),
	maxAttempts: z.number().positive().optional(),
	retryDelay: z.number().nonnegative().optional(),
	timeout: z.number().positive().optional(),
	removeOnComplete: z.boolean().optional(),
	removeOnFail: z.boolean().optional(),
});

export const queueStatsSchema = z.object({
	waiting: z.number().nonnegative(),
	active: z.number().nonnegative(),
	completed: z.number().nonnegative(),
	failed: z.number().nonnegative(),
	delayed: z.number().nonnegative(),
	paused: z.boolean(),
});

export const queueEventSchema = z.object({
	id: z.string(),
	jobId: z.string(),
	type: z.string(),
	payload: z.string(),
	timestamp: z.date(),
});

// Tipos inferidos
export type QueueJobValidated = z.infer<typeof queueJobSchema>;
export type QueueJobOptionsValidated = z.infer<typeof queueJobOptionsSchema>;
export type QueueStatsValidated = z.infer<typeof queueStatsSchema>;
export type QueueEventValidated = z.infer<typeof queueEventSchema>;
