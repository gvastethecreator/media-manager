/**
 * @file Enums para la entidad Task
 * @module types/entities/task/enums
 */

/**
 * Estado de la tarea
 */
export enum TaskStatus {
	PENDING = 'pending',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
	ON_HOLD = 'on_hold',
}

/**
 * Prioridad de la tarea
 */
export enum TaskPriority {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	URGENT = 'urgent',
}
