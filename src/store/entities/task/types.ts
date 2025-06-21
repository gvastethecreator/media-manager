/**
 * @file Tipos para el store de Task
 * @module store/entities/task/types
 * @description Define los tipos para el store Zustand de tareas
 * @updated 2025-06-21
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
 * 📊 Estado principal del store de tareas
 */
export interface TaskState {
	// 📋 Datos principales
	tasks: TaskExtended[];
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// 🎮 UI y configuración
	ui: TaskUIState;
	filters: TaskFiltersState;

	// 🔍 Selectores y getters
	getTaskById: (id: string) => TaskExtended | undefined;
	getFilteredTasks: () => TaskExtended[];
	getSortedTasks: () => TaskExtended[];
}

/**
 * 🎮 Estado de UI del store
 */
export interface TaskUIState {
	selectedIds: string[];
	viewMode: TaskViewMode;
	isViewerOpen: boolean;
	currentTaskId: string | null;
	displayState: Record<string, any>;
	highlightedId: string | null;
	expandedIds: string[];
}

/**
 * 🔍 Estado de filtros del store
 */
export interface TaskFiltersState {
	// Filtros básicos
	query: string;
	searchQuery: string; // Alias para compatibilidad
	sortBy: TaskSortCriteria;
	sortDirection: SortDirection;

	// Filtros específicos
	status: string[];
	priority: string[];
	type: string[];
	tags: string[];

	// Rango de fechas
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface TaskActions {
	// 📥 Carga de datos
	loadTasks: () => Promise<void>;

	// 🎮 Acciones UI
	selectTask: (id: string | null) => void;
	selectMultipleTasks: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<TaskFiltersState>) => void;
	clearFilters: () => void;
	setSearchQuery: (query: string) => void;
}

/**
 * 🏗️ Tipo completo del store
 */
export type TaskStore = TaskState & TaskActions;
