/**
 * 📋 TASK BASE TYPES
 *
 * Tipos base para tasks usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
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

/**
 * 🗿 Modelo base de Task, derivado del schema de Drizzle.
 */
export interface TaskBase {
	actualHours: number | null;
	assigneeId: string | null;
	completedAt: Date | null;
	createdAt: Date;
	description: string | null;
	dueDate: Date | null;
	estimatedHours: number | null;
	id: string;
	metadata: string | null;
	priority: TaskPriority;
	projectId: string | null;
	status: TaskStatus;
	tags: string[];
	title: string;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Task.
 */
export interface TaskStatistics extends EntityStats {
	completionRate: number; // Porcentaje de progreso
	complexityScore: number; // Score de complejidad estimado
	daysOverdue: number; // Días de retraso (si aplica)
	daysRemaining: number; // Días hasta vencimiento
	isBlocked: boolean; // Si hay dependencias sin completar
	priorityScore: number; // Score basado en prioridad y vencimiento
	timeEfficiency: number; // actualHours / estimatedHours
}

/**
 * ✨ Modelo extendido de Task con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface TaskWithStats extends TaskBase {
	stats: TaskStatistics;
}

/**
 * 📝 Datos para crear un Task
 */
export interface TaskCreateInput {
	assigneeId?: string | null;
	description?: string | null;
	dueDate?: Date | null;
	estimatedHours?: number | null;
	metadata?: string | null;
	priority?: TaskPriority;
	projectId?: string | null;
	status?: TaskStatus;
	tags?: string[];
	title: string;
}

/**
 * 📝 Datos para actualizar un Task
 */
export interface TaskUpdateInput {
	actualHours?: number | null;
	assigneeId?: string | null;
	completedAt?: Date | null;
	description?: string | null;
	dueDate?: Date | null;
	estimatedHours?: number | null;
	metadata?: string | null;
	priority?: TaskPriority;
	projectId?: string | null;
	status?: TaskStatus;
	tags?: string[];
	title?: string;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar TaskWithStats
 */
export type TaskComplete = TaskWithStats;
