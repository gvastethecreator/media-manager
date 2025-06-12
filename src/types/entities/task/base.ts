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
 * ✅ Tipo base para Task, solo campos canónicos y serializables
 */
export interface TaskBase {
	id: string;
	type: TaskType | string;
	name: string;
	description?: string;
	priority: TaskPriority;
	status: TaskStatus;
	createdAt: Date;
	updatedAt: Date;
}

// ✅ TaskBase ahora es seguro y serializable para frontend/backend.
