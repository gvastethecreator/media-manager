/**
 * @file Tipos para el store de Task
 * @module store/entities/task/types
 * @description Define los tipos para el store Zustand de tareas
 * @updated 2025-10-01
 */

import type { TaskCreateInput, TaskSearchOptions, TaskUpdateInput, TaskWithStats } from '@/types/entities/task/types';

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
	tasks: TaskWithStats[];
	currentTask: TaskWithStats | null;
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	lastUpdated: number | null;
	total: number;
	hasMore: boolean;

	// 🎮 UI y configuración
	ui: TaskUIState;
	filters: TaskFiltersState;

	// 🔍 Selectores y getters
	getTaskById: (id: string) => TaskWithStats | undefined;
	getFilteredTasks: () => TaskWithStats[];
	getSortedTasks: () => TaskWithStats[];
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
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteModalOpen: boolean;
	editingId: string | null;
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
	fetchTasks: (options?: TaskSearchOptions) => Promise<void>;
	fetchTaskById: (id: string) => Promise<void>;
	loadMore: () => Promise<void>;

	// ✏️ CRUD
	createTask: (input: TaskCreateInput) => Promise<void>;
	updateTask: (id: string, input: TaskUpdateInput) => Promise<void>;
	deleteTask: (id: string) => Promise<void>;
	deleteTasks: (ids: string[]) => Promise<void>;

	// ⭐ Operaciones especiales
	toggleFavorite: (id: string) => Promise<void>;
	toggleArchive: (id: string) => Promise<void>;
	updateProgress: (id: string, progress: number) => Promise<void>;
	completeTask: (id: string) => Promise<void>;

	// 🔄 Refetch y reset
	refetch: () => Promise<void>;
	reset: () => void;

	// 🎮 Acciones UI
	selectTask: (id: string | null) => void;
	selectMultipleTasks: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;

	// 🎨 Modales
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openEditModal: (id: string) => void;
	closeEditModal: () => void;
	openDeleteModal: (id: string) => void;
	closeDeleteModal: () => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<TaskFiltersState>) => void;
	clearFilters: () => void;
	setSearchQuery: (query: string) => void;
	setSortBy: (sortBy: TaskSortCriteria) => void;
	setSortOrder: (sortOrder: 'asc' | 'desc') => void;
}

/**
 * 🏗️ Tipo completo del store
 */
export type TaskStore = TaskState & TaskActions;
