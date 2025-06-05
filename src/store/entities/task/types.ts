/**
 * @file Tipos para el store de Task
 * @module store/entities/task/types
 */

import { TaskExtended } from '@/types/entities/task';

/**
 * Modo de visualización para tareas
 */
export enum TaskViewMode {
	LIST = 'list',
	GRID = 'grid',
	CALENDAR = 'calendar',
	TIMELINE = 'timeline',
	KANBAN = 'kanban',
}

/**
 * Criterios de ordenación para tareas
 */
export enum TaskSortCriteria {
	NAME = 'name',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	STATUS = 'status',
	PRIORITY = 'priority',
	TYPE = 'type',
}

/**
 * Dirección de ordenación
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filtros para tareas
 */
export interface TaskFilters {
	status?: string[];
	priority?: string[];
	type?: string[];
	tags?: string[];
	search?: string;
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	updatedAfter?: Date | null;
	updatedBefore?: Date | null;
}

/**
 * Estado para selección de tareas
 */
export interface SelectionState {
	selectedIds: string[];
	lastSelectedId: string | null;
}

/**
 * Estado global para el store de Task
 */
export interface TaskState {
	tasks: TaskExtended[];
	isLoading: boolean;
	error: string | null;
}
