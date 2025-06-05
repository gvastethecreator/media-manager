/**
 * @file Tipos para el sistema de tareas y trabajos programados
 * @module types/tasks
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Tipo de tarea
 */
export enum TaskType {
	CLEANUP = 'cleanup',
	OPTIMIZATION = 'optimization',
	BACKUP = 'backup',
	SYNC = 'sync',
	MAINTENANCE = 'maintenance',
	INDEXING = 'indexing',
	CUSTOM = 'custom',
}

/**
 * Estado de tarea
 */
export enum TaskStatus {
	SCHEDULED = 'scheduled',
	RUNNING = 'running',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Prioridad de tarea
 */
export enum TaskPriority {
	LOW = 'low',
	NORMAL = 'normal',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Programación de tarea
 */
export interface TaskSchedule {
	type: 'once' | 'recurring';
	startAt?: Date;
	endAt?: Date;
	cron?: string;
	interval?: number;
	timezone?: string;
}

/**
 * Tarea programada
 */
export interface ScheduledTask {
	id: EntityId;
	type: TaskType;
	name: string;
	description?: string;
	priority: TaskPriority;
	status: TaskStatus;
	schedule: TaskSchedule;
	handler: string;
	params: JSONString<Record<string, unknown>>;
	timeout?: number;
	retryPolicy?: {
		maxAttempts: number;
		backoffDelay: number;
	};
	dependencies?: EntityId[];
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
	lastRunAt?: Date;
	nextRunAt?: Date;
}

/**
 * Ejecución de tarea
 */
export interface TaskExecution {
	id: EntityId;
	taskId: EntityId;
	status: TaskStatus;
	startedAt: Date;
	completedAt?: Date;
	duration?: number;
	result?: JSONString<Record<string, unknown>>;
	error?: string;
	logs: string[];
	metrics?: {
		cpu: number;
		memory: number;
		io: number;
	};
}

/**
 * Resultado de tarea
 */
export interface TaskResult {
	success: boolean;
	data?: unknown;
	error?: string;
	warnings?: string[];
	metrics: {
		duration: number;
		resourceUsage: {
			cpu: number;
			memory: number;
			io: number;
		};
	};
}

// Validaciones Zod
export const taskTypeSchema = z.nativeEnum(TaskType);
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);

export const taskScheduleSchema = z.object({
	type: z.enum(['once', 'recurring']),
	startAt: z.date().optional(),
	endAt: z.date().optional(),
	cron: z.string().optional(),
	interval: z.number().positive().optional(),
	timezone: z.string().optional(),
});

export const scheduledTaskSchema = z.object({
	id: z.string(),
	type: taskTypeSchema,
	name: z.string(),
	description: z.string().optional(),
	priority: taskPrioritySchema,
	status: taskStatusSchema,
	schedule: taskScheduleSchema,
	handler: z.string(),
	params: z.string(),
	timeout: z.number().positive().optional(),
	retryPolicy: z
		.object({
			maxAttempts: z.number().positive(),
			backoffDelay: z.number().nonnegative(),
		})
		.optional(),
	dependencies: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	lastRunAt: z.date().optional(),
	nextRunAt: z.date().optional(),
});

export const taskExecutionSchema = z.object({
	id: z.string(),
	taskId: z.string(),
	status: taskStatusSchema,
	startedAt: z.date(),
	completedAt: z.date().optional(),
	duration: z.number().nonnegative().optional(),
	result: z.string().optional(),
	error: z.string().optional(),
	logs: z.array(z.string()),
	metrics: z
		.object({
			cpu: z.number().nonnegative(),
			memory: z.number().nonnegative(),
			io: z.number().nonnegative(),
		})
		.optional(),
});

export const taskResultSchema = z.object({
	success: z.boolean(),
	data: z.unknown().optional(),
	error: z.string().optional(),
	warnings: z.array(z.string()).optional(),
	metrics: z.object({
		duration: z.number().nonnegative(),
		resourceUsage: z.object({
			cpu: z.number().nonnegative(),
			memory: z.number().nonnegative(),
			io: z.number().nonnegative(),
		}),
	}),
});

// Tipos inferidos
export type TaskScheduleValidated = z.infer<typeof taskScheduleSchema>;
export type ScheduledTaskValidated = z.infer<typeof scheduledTaskSchema>;
export type TaskExecutionValidated = z.infer<typeof taskExecutionSchema>;
export type TaskResultValidated = z.infer<typeof taskResultSchema>;
