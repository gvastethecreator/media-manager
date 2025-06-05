/**
 * @file Tipos base para la entidad Task
 * @module types/entities/task/base
 */

/**
 * Estado de una tarea
 */
export enum TaskStatus {
	PENDING = 'PENDING',
	SCHEDULED = 'SCHEDULED',
	RUNNING = 'RUNNING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
	PAUSED = 'PAUSED',
}

/**
 * Prioridad de una tarea
 */
export enum TaskPriority {
	LOW = 'LOW',
	NORMAL = 'NORMAL',
	HIGH = 'HIGH',
	CRITICAL = 'CRITICAL',
}

/**
 * Tipos de tareas
 */
export enum TaskType {
	MAINTENANCE = 'MAINTENANCE',
	PROCESSING = 'PROCESSING',
	IMPORT = 'IMPORT',
	EXPORT = 'EXPORT',
	INDEXING = 'INDEXING',
	CLEANUP = 'CLEANUP',
	BACKUP = 'BACKUP',
	CUSTOM = 'CUSTOM',
}

/**
 * Política de reintentos
 */
export interface RetryPolicy {
	maxRetries: number;
	retryDelay: number; // en milisegundos
	retryBackoff: boolean; // si true, aumenta el delay en cada intento
}

/**
 * Tipo base para Task
 */
export interface TaskBase {
	id: string;
	type: TaskType | string;
	name: string;
	description?: string;
	priority: TaskPriority;
	status: TaskStatus;
	schedule?: string; // expresión cron
	handler: string; // función a ejecutar
	params?: Record<string, any>; // parámetros para el handler
	timeout?: number; // en milisegundos
	retryPolicy?: RetryPolicy;
	dependencies?: string[]; // IDs de tareas que deben completarse antes
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Entrada para crear una nueva tarea
 */
export interface TaskCreateInput {
	type: TaskType | string;
	name: string;
	description?: string;
	priority: TaskPriority;
	status?: TaskStatus;
	schedule?: string;
	handler: string;
	params?: Record<string, any>;
	timeout?: number;
	retryPolicy?: RetryPolicy;
	dependencies?: string[];
	tags?: string[];
}

/**
 * Entrada para actualizar una tarea existente
 */
export interface TaskUpdateInput {
	type?: TaskType | string;
	name?: string;
	description?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
	schedule?: string;
	handler?: string;
	params?: Record<string, any>;
	timeout?: number;
	retryPolicy?: RetryPolicy;
	dependencies?: string[];
	tags?: string[];
}
