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
	id: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: Date | null;
	completedAt: Date | null;
	estimatedHours: number | null;
	actualHours: number | null;
	assigneeId: string | null;
	projectId: string | null;
	tags: string[];
	metadata: string | null;
	createdAt: Date;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Task.
 */
export interface TaskStatistics extends EntityStats {
	completionRate: number; // Porcentaje de progreso
	timeEfficiency: number; // actualHours / estimatedHours
	priorityScore: number; // Score basado en prioridad y vencimiento
	daysRemaining: number; // Días hasta vencimiento
	daysOverdue: number; // Días de retraso (si aplica)
	isBlocked: boolean; // Si hay dependencias sin completar
	complexityScore: number; // Score de complejidad estimado
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
	title: string;
	description?: string | null;
	status?: TaskStatus;
	priority?: TaskPriority;
	dueDate?: Date | null;
	estimatedHours?: number | null;
	assigneeId?: string | null;
	projectId?: string | null;
	tags?: string[];
	metadata?: string | null;
}

/**
 * 📝 Datos para actualizar un Task
 */
export interface TaskUpdateInput {
	title?: string;
	description?: string | null;
	status?: TaskStatus;
	priority?: TaskPriority;
	dueDate?: Date | null;
	completedAt?: Date | null;
	estimatedHours?: number | null;
	actualHours?: number | null;
	assigneeId?: string | null;
	projectId?: string | null;
	tags?: string[];
	metadata?: string | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar TaskWithStats
 */
export type TaskComplete = TaskWithStats;
