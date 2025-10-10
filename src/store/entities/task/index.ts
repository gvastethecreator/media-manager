/**
 * @file Store principal para la entidad Task
 * @module store/entities/task
 * @description Store completo con integración al TaskService
 * @updated 2025-10-01
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import type { TaskWithStats } from '@/types/entities/task';
import { TaskSortCriteria, type TaskStore, TaskViewMode } from './types';

// Logger específico para el store de tareas
const taskLogger = clientLogger.withContext('TaskStore');

// Re-exportar tipos y constantes
export * from './constants';
export * from './types';

// URL base de la API
const API_BASE = '/api/tasks';

// 🏗️ Crear el store con persistencia
export const useTaskStore = create<TaskStore>()(
	persist(
		(set, get) => ({
			// 📋 Estado inicial de datos
			tasks: [],
			currentTask: null,
			isLoading: false,
			isLoadingMore: false,
			error: null,
			lastUpdated: null,
			total: 0,
			hasMore: false,

			// 🎮 Estado inicial de UI
			ui: {
				selectedIds: [],
				viewMode: TaskViewMode.LIST,
				isViewerOpen: false,
				currentTaskId: null,
				displayState: {},
				highlightedId: null,
				expandedIds: [],
				isCreateModalOpen: false,
				isEditModalOpen: false,
				isDeleteModalOpen: false,
				editingId: null,
			},

			// 🔍 Estado inicial de filtros
			filters: {
				query: '',
				searchQuery: '',
				sortBy: TaskSortCriteria.CREATED_AT,
				sortDirection: 'desc',
				status: [],
				priority: [],
				type: [],
				tags: [],
				dateRange: {
					from: null,
					to: null,
				},
			},

			// =============================================================================
			// 📥 CARGA DE DATOS
			// =============================================================================

			fetchTasks: async (options) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info('🔄 Obteniendo tasks...');

					const state = get();

					// Construir parámetros de búsqueda
					const params = new URLSearchParams();
					if (options?.search) params.append('search', options.search);
					if (options?.sortBy) params.append('sortBy', options.sortBy);
					if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
					if (options?.status) params.append('status', options.status);
					if (options?.priority) params.append('priority', options.priority);
					if (options?.limit) params.append('limit', options.limit.toString());
					if (options?.offset) params.append('offset', options.offset.toString());

					const response = await fetch(`${API_BASE}?${params.toString()}`);

					if (!response.ok) {
						throw new Error('Error al obtener tasks');
					}

					const data = await response.json();

					set({
						tasks: data.tasks || [],
						total: data.total || 0,
						hasMore: Boolean(data.hasMore),
						isLoading: false,
						lastUpdated: Date.now(),
					});

					taskLogger.info(`✅ ${data.tasks?.length || 0} tasks obtenidos`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al obtener tasks';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
				}
			},

			fetchTaskById: async (id) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info(`🔍 Obteniendo task ${id}...`);

					const response = await fetch(`${API_BASE}/${id}`);

					if (!response.ok) {
						throw new Error('Task no encontrado');
					}

					const task = await response.json();

					set({
						currentTask: task,
						isLoading: false,
					});

					// Actualizar también en la lista si existe
					set((state) => ({
						tasks: state.tasks.map((t) => (t.id === id ? task : t)),
					}));

					taskLogger.info(`✅ Task obtenido: ${task.title}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al obtener task';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
				}
			},

			loadMore: async () => {
				const state = get();
				if (!state.hasMore || state.isLoadingMore) return;

				try {
					set({ isLoadingMore: true });
					taskLogger.info('📄 Cargando más tasks...');

					const params = new URLSearchParams();
					if (state.filters.searchQuery) params.append('search', state.filters.searchQuery);
					params.append('limit', '50');
					params.append('offset', state.tasks.length.toString());

					const response = await fetch(`${API_BASE}?${params.toString()}`);

					if (!response.ok) {
						throw new Error('Error al cargar más tasks');
					}

					const data = await response.json();

					set({
						tasks: [...state.tasks, ...(data.tasks || [])],
						total: data.total || state.total,
						hasMore: Boolean(data.hasMore),
						isLoadingMore: false,
					});

					taskLogger.info(`✅ ${data.tasks?.length || 0} tasks adicionales cargados`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al cargar más tasks';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ isLoadingMore: false });
				}
			},

			// =============================================================================
			// ✏️ CRUD
			// =============================================================================

			createTask: async (input) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info(`➕ Creando task: ${input.title}`);

					const response = await fetch(API_BASE, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(input),
					});

					if (!response.ok) {
						throw new Error('Error al crear task');
					}

					const newTask = await response.json();

					set((state) => ({
						tasks: [newTask, ...state.tasks],
						total: state.total + 1,
						isLoading: false,
					}));

					taskLogger.info(`✅ Task creado: ${newTask.title}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al crear task';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
					throw error;
				}
			},

			updateTask: async (id, input) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info(`📝 Actualizando task ${id}`);

					const response = await fetch(`${API_BASE}/${id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(input),
					});

					if (!response.ok) {
						throw new Error('Error al actualizar task');
					}

					const updatedTask = await response.json();

					set((state) => ({
						tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
						currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
						isLoading: false,
					}));

					taskLogger.info(`✅ Task actualizado: ${updatedTask.title}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al actualizar task';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
					throw error;
				}
			},

			deleteTask: async (id) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info(`🗑️ Eliminando task ${id}`);

					const response = await fetch(`${API_BASE}/${id}`, {
						method: 'DELETE',
					});

					if (!response.ok) {
						throw new Error('Error al eliminar task');
					}

					set((state) => ({
						tasks: state.tasks.filter((t) => t.id !== id),
						total: Math.max(0, state.total - 1),
						currentTask: state.currentTask?.id === id ? null : state.currentTask,
						ui: {
							...state.ui,
							selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
						},
						isLoading: false,
					}));

					taskLogger.info(`✅ Task eliminado: ${id}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al eliminar task';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
					throw error;
				}
			},

			deleteTasks: async (ids) => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info(`🗑️ Eliminando ${ids.length} tasks`);

					const response = await fetch(`${API_BASE}/bulk-delete`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ ids }),
					});

					if (!response.ok) {
						throw new Error('Error al eliminar tasks');
					}

					set((state) => ({
						tasks: state.tasks.filter((t) => !ids.includes(t.id)),
						total: Math.max(0, state.total - ids.length),
						ui: {
							...state.ui,
							selectedIds: [],
						},
						isLoading: false,
					}));

					taskLogger.info(`✅ ${ids.length} tasks eliminados`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tasks';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage, isLoading: false });
					throw error;
				}
			},

			// =============================================================================
			// ⭐ OPERACIONES ESPECIALES
			// =============================================================================

			toggleFavorite: async (id) => {
				try {
					taskLogger.info(`⭐ Alternando favorito para task ${id}`);

					const response = await fetch(`${API_BASE}/${id}/favorite`, {
						method: 'POST',
					});

					if (!response.ok) {
						throw new Error('Error al alternar favorito');
					}

					const updatedTask = await response.json();

					set((state) => ({
						tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
						currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
					}));

					taskLogger.info(`✅ Favorito alternado para task ${id}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al alternar favorito';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage });
				}
			},

			toggleArchive: async (id) => {
				try {
					taskLogger.info(`📦 Alternando archivo para task ${id}`);

					const response = await fetch(`${API_BASE}/${id}/archive`, {
						method: 'POST',
					});

					if (!response.ok) {
						throw new Error('Error al alternar archivo');
					}

					const updatedTask = await response.json();

					set((state) => ({
						tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
						currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
					}));

					taskLogger.info(`✅ Archivo alternado para task ${id}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al alternar archivo';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage });
				}
			},

			updateProgress: async (id, progress) => {
				try {
					taskLogger.info(`📊 Actualizando progreso de task ${id} a ${progress}%`);

					const response = await fetch(`${API_BASE}/${id}/progress`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ progress }),
					});

					if (!response.ok) {
						throw new Error('Error al actualizar progreso');
					}

					const updatedTask = await response.json();

					set((state) => ({
						tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
						currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
					}));

					taskLogger.info(`✅ Progreso actualizado para task ${id}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al actualizar progreso';
					taskLogger.error(`❌ ${errorMessage}`, error);
					set({ error: errorMessage });
				}
			},

			completeTask: async (id) => {
				try {
					taskLogger.info(`✅ Completando task ${id}`);

					await get().updateTask(id, { status: 'completed', progress: 100 });

					taskLogger.info(`✅ Task completado: ${id}`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Error al completar task';
					taskLogger.error(`❌ ${errorMessage}`, error);
				}
			},

			// =============================================================================
			// 🔄 REFETCH Y RESET
			// =============================================================================

			refetch: async () => {
				taskLogger.info('🔄 Refetching tasks...');
				await get().fetchTasks();
			},

			reset: () => {
				taskLogger.info('🔄 Reseteando store de tasks');
				set({
					tasks: [],
					currentTask: null,
					isLoading: false,
					isLoadingMore: false,
					error: null,
					lastUpdated: null,
					total: 0,
					hasMore: false,
					ui: {
						selectedIds: [],
						viewMode: TaskViewMode.LIST,
						isViewerOpen: false,
						currentTaskId: null,
						displayState: {},
						highlightedId: null,
						expandedIds: [],
						isCreateModalOpen: false,
						isEditModalOpen: false,
						isDeleteModalOpen: false,
						editingId: null,
					},
				});
			},

			// =============================================================================
			// 🎮 ACCIONES UI
			// =============================================================================

			selectTask: (id) =>
				set((state) => ({
					ui: { ...state.ui, selectedIds: id ? [id] : [], currentTaskId: id },
				})),

			selectMultipleTasks: (ids) =>
				set((state) => ({
					ui: { ...state.ui, selectedIds: ids },
				})),

			toggleSelection: (id) =>
				set((state) => {
					const selectedIds = state.ui.selectedIds.includes(id)
						? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
						: [...state.ui.selectedIds, id];
					return { ui: { ...state.ui, selectedIds } };
				}),

			clearSelection: () =>
				set((state) => ({
					ui: { ...state.ui, selectedIds: [], currentTaskId: null },
				})),

			// =============================================================================
			// 🎨 MODALES
			// =============================================================================

			openCreateModal: () =>
				set((state) => ({
					ui: { ...state.ui, isCreateModalOpen: true },
				})),

			closeCreateModal: () =>
				set((state) => ({
					ui: { ...state.ui, isCreateModalOpen: false },
				})),

			openEditModal: (id) =>
				set((state) => ({
					ui: { ...state.ui, isEditModalOpen: true, editingId: id },
				})),

			closeEditModal: () =>
				set((state) => ({
					ui: { ...state.ui, isEditModalOpen: false, editingId: null },
				})),

			openDeleteModal: (id) =>
				set((state) => ({
					ui: { ...state.ui, isDeleteModalOpen: true, selectedIds: [id] },
				})),

			closeDeleteModal: () =>
				set((state) => ({
					ui: { ...state.ui, isDeleteModalOpen: false },
				})),

			// =============================================================================
			// 🔍 FILTROS
			// =============================================================================

			updateFilters: (newFilters) =>
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				})),

			clearFilters: () =>
				set({
					filters: {
						query: '',
						searchQuery: '',
						sortBy: TaskSortCriteria.CREATED_AT,
						sortDirection: 'desc',
						status: [],
						priority: [],
						type: [],
						tags: [],
						dateRange: { from: null, to: null },
					},
				}),

			setSearchQuery: (query) =>
				set((state) => ({
					filters: {
						...state.filters,
						searchQuery: query,
						query, // Mantener ambos sincronizados
					},
				})),

			setSortBy: (sortBy) =>
				set((state) => ({
					filters: { ...state.filters, sortBy },
				})),

			setSortOrder: (sortOrder) =>
				set((state) => ({
					filters: { ...state.filters, sortDirection: sortOrder },
				})),

			// =============================================================================
			// 🔍 SELECTORES
			// =============================================================================

			getTaskById: (id) => get().tasks.find((task) => task.id === id),

			getFilteredTasks: () => {
				const state = get();
				let filtered = [...state.tasks];

				// Filtrar por búsqueda
				if (state.filters.searchQuery) {
					const query = state.filters.searchQuery.toLowerCase();
					filtered = filtered.filter(
						(task) =>
							task.title.toLowerCase().includes(query) ||
							task.description?.toLowerCase().includes(query) ||
							task.notes?.toLowerCase().includes(query)
					);
				}

				// Filtrar por status
				if (state.filters.status.length > 0) {
					filtered = filtered.filter((task) => state.filters.status.includes(task.status));
				}

				// Filtrar por priority
				if (state.filters.priority.length > 0) {
					filtered = filtered.filter((task) => state.filters.priority.includes(task.priority));
				}

				return filtered;
			},

			getSortedTasks: () => {
				const state = get();
				const filtered = state.getFilteredTasks();

				return filtered.sort((a, b) => {
					const sortBy = state.filters.sortBy;
					const order = state.filters.sortDirection === 'asc' ? 1 : -1;

					// Mapear el criterio de ordenación a propiedades del objeto
					type SortableKey = keyof Pick<
						TaskWithStats,
						'title' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'dueDate'
					>;
					const sortKeyMap: Record<TaskSortCriteria, SortableKey> = {
						[TaskSortCriteria.NAME]: 'title',
						[TaskSortCriteria.CREATED_AT]: 'createdAt',
						[TaskSortCriteria.UPDATED_AT]: 'updatedAt',
						[TaskSortCriteria.STATUS]: 'status',
						[TaskSortCriteria.PRIORITY]: 'priority',
						[TaskSortCriteria.TYPE]: 'status', // Fallback
					};

					const key = sortKeyMap[sortBy] || 'createdAt';
					let aValue = a[key];
					let bValue = b[key];

					// Manejar fechas
					if (aValue instanceof Date) aValue = aValue.getTime() as any;
					if (bValue instanceof Date) bValue = bValue.getTime() as any;

					// Manejar nulls
					if (aValue === null || aValue === undefined) return 1;
					if (bValue === null || bValue === undefined) return -1;

					if (aValue < bValue) return -1 * order;
					if (aValue > bValue) return 1 * order;
					return 0;
				});
			},
		}),
		{
			name: 'task-store',
			storage: createJSONStorage(() => localStorage),
			version: Number.parseInt(VERSIONING.STORE, 10),
			partialize: (state) => ({
				ui: {
					viewMode: state.ui.viewMode,
				},
				filters: {
					sortBy: state.filters.sortBy,
					sortDirection: state.filters.sortDirection,
				},
			}),
		}
	)
);
