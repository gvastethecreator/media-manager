/**
 * @file Tipos para manejo de procesos y eventos
 * @module types/process
 */

import { z } from 'zod';
import type { JSONString } from '@/utils/types/utility-types';

/**
 * Estados de proceso
 */
export enum ProcessStatus {
	PENDING = 'pending',
	RUNNING = 'running',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Tipos de proceso
 */
export enum ProcessType {
	FILE_UPLOAD = 'file-upload',
	FILE_PROCESSING = 'file-processing',
	METADATA_EXTRACTION = 'metadata-extraction',
	THUMBNAIL_GENERATION = 'thumbnail-generation',
	BATCH_OPERATION = 'batch-operation',
	IMPORT = 'import',
	EXPORT = 'export',
	BACKUP = 'backup',
	RESTORE = 'restore',
}

/**
 * Niveles de prioridad
 */
export enum ProcessPriority {
	LOW = 'low',
	NORMAL = 'normal',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Interfaz base para procesos
 */
export interface Process {
	id: string;
	type: ProcessType;
	status: ProcessStatus;
	priority: ProcessPriority;
	progress: number;
	message: string;
	error?: Error;
	metadata: JSONString<Record<string, unknown>>;
	startedAt: Date;
	completedAt?: Date;
	cancelledAt?: Date;
}

/**
 * Eventos de proceso
 */
export interface ProcessEvent {
	id: string;
	processId: string;
	type: string;
	message: string;
	metadata: JSONString<Record<string, unknown>>;
	timestamp: Date;
}

/**
 * Opciones de proceso
 */
export interface ProcessOptions {
	priority?: ProcessPriority;
	timeout?: number;
	retries?: number;
	onProgress?: (progress: number) => void;
	onComplete?: () => void;
	onError?: (error: Error) => void;
	onCancel?: () => void;
}

// Validaciones Zod
export const processStatusSchema = z.nativeEnum(ProcessStatus);
export const processTypeSchema = z.nativeEnum(ProcessType);
export const processPrioritySchema = z.nativeEnum(ProcessPriority);

export const processSchema = z.object({
	id: z.string(),
	type: processTypeSchema,
	status: processStatusSchema,
	priority: processPrioritySchema,
	progress: z.number().min(0).max(100),
	message: z.string(),
	error: z.instanceof(Error).optional(),
	metadata: z.string(),
	startedAt: z.date(),
	completedAt: z.date().optional(),
	cancelledAt: z.date().optional(),
});

export const processEventSchema = z.object({
	id: z.string(),
	processId: z.string(),
	type: z.string(),
	message: z.string(),
	metadata: z.string(),
	timestamp: z.date(),
});

export const processOptionsSchema = z.object({
	priority: processPrioritySchema.optional(),
	timeout: z.number().positive().optional(),
	retries: z.number().nonnegative().optional(),
});

// Tipos inferidos
export type ProcessValidated = z.infer<typeof processSchema>;
export type ProcessEventValidated = z.infer<typeof processEventSchema>;
export type ProcessOptionsValidated = z.infer<typeof processOptionsSchema>;
