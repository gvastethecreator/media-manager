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
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	priority?: string[];
	search?: string;
	status?: string[];
	tags?: string[];
	type?: string[];
	updatedAfter?: Date | null;
	updatedBefore?: Date | null;
}

/**
 * Estado para selección de tareas
 */
export interface SelectionState {
	lastSelectedId: string | null;
	selectedIds: string[];
}

/**
 * 📊 Estado principal del store de tareas
 */
export interface TaskState {
	currentTask: TaskWithStats | null;
	error: string | null;
	filters: TaskFiltersState;
	getFilteredTasks: () => TaskWithStats[];
	getSortedTasks: () => TaskWithStats[];

	// 🔍 Selectores y getters
	getTaskById: (id: string) => TaskWithStats | undefined;
	hasMore: boolean;
	isLoading: boolean;
	isLoadingMore: boolean;
	lastUpdated: number | null;
	// 📋 Datos principales
	tasks: TaskWithStats[];
	total: number;

	// 🎮 UI y configuración
	ui: TaskUIState;
}

/**
 * 🎮 Estado de UI del store
 */
export interface TaskUIState {
	currentTaskId: string | null;
	displayState: Record<string, any>;
	editingId: string | null;
	expandedIds: string[];
	highlightedId: string | null;
	isCreateModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isEditModalOpen: boolean;
	isViewerOpen: boolean;
	selectedIds: string[];
	viewMode: TaskViewMode;
}

/**
 * 🔍 Estado de filtros del store
 */
export interface TaskFiltersState {
	// Rango de fechas
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	priority: string[];
	// Filtros básicos
	query: string;
	searchQuery: string; // Alias para compatibilidad
	sortBy: TaskSortCriteria;
	sortDirection: SortDirection;

	// Filtros específicos
	status: string[];
	tags: string[];
	type: string[];
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface TaskActions {
	clearFilters: () => void;
	clearSelection: () => void;
	closeCreateModal: () => void;
	closeDeleteModal: () => void;
	closeEditModal: () => void;
	completeTask: (id: string) => Promise<void>;

	// ✏️ CRUD
	createTask: (input: TaskCreateInput) => Promise<void>;
	deleteTask: (id: string) => Promise<void>;
	deleteTasks: (ids: string[]) => Promise<void>;
	fetchTaskById: (id: string) => Promise<void>;
	// 📥 Carga de datos
	fetchTasks: (options?: TaskSearchOptions) => Promise<void>;
	loadMore: () => Promise<void>;

	// 🎨 Modales
	openCreateModal: () => void;
	openDeleteModal: (id: string) => void;
	openEditModal: (id: string) => void;

	// 🔄 Refetch y reset
	refetch: () => Promise<void>;
	reset: () => void;
	selectMultipleTasks: (ids: string[]) => void;

	// 🎮 Acciones UI
	selectTask: (id: string | null) => void;
	setSearchQuery: (query: string) => void;
	setSortBy: (sortBy: TaskSortCriteria) => void;
	setSortOrder: (sortOrder: 'asc' | 'desc') => void;
	toggleArchive: (id: string) => Promise<void>;

	// ⭐ Operaciones especiales
	toggleFavorite: (id: string) => Promise<void>;
	toggleSelection: (id: string) => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<TaskFiltersState>) => void;
	updateProgress: (id: string, progress: number) => Promise<void>;
	updateTask: (id: string, input: TaskUpdateInput) => Promise<void>;
}

/**
 * 🏗️ Tipo completo del store
 */
export type TaskStore = TaskState & TaskActions;
