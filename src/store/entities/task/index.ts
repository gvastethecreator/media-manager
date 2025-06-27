/**
 * @file Store principal para la entidad Task
 * @module store/entities/task
 * @description Define el store de Zustand para la gestión de tareas.
 * @updated 2025-06-21
 */

import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TaskSortCriteria, type TaskStore, TaskViewMode } from './types';

// Logger específico para el store de tareas
const taskLogger = clientLogger.withContext('TaskStore');

// Re-exportar tipos y constantes
export * from './constants';
export * from './types';

// 🏗️ Crear el store con persistencia
export const useTaskStore = create<TaskStore>()(
	persist(
		(set, get) => ({
			// 📋 Estado inicial de datos
			tasks: [],
			isLoading: false,
			error: null,
			lastUpdated: null,

			// 🎮 Estado inicial de UI
			ui: {
				selectedIds: [],
				viewMode: TaskViewMode.LIST,
				isViewerOpen: false,
				currentTaskId: null,
				displayState: {},
				highlightedId: null,
				expandedIds: [],
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

			// 🔄 --- ACCIONES --- 🔄

			// 📥 Carga de datos (placeholders)
			loadTasks: async () => {
				try {
					set({ isLoading: true, error: null });
					taskLogger.info('🔄 Cargando tareas...');
					// TODO: Implementar acción del servidor
					const tasks = [];
					set({ tasks, isLoading: false, lastUpdated: Date.now() });
					taskLogger.info('✅ Tareas cargadas correctamente');
				} catch (error) {
					const errorMessage = 'Error al cargar las tareas';
					taskLogger.error(`❌ ${errorMessage}:`, error);
					set({ error: errorMessage, isLoading: false });
				}
			},

			// 🎮 Acciones de UI
			selectTask: (id) => set((state) => ({ ui: { ...state.ui, selectedIds: id ? [id] : [] } })),
			selectMultipleTasks: (ids) => set((state) => ({ ui: { ...state.ui, selectedIds: ids } })),
			toggleSelection: (id: string) =>
				set((state) => {
					const selectedIds = state.ui.selectedIds.includes(id)
						? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
						: [...state.ui.selectedIds, id];
					return { ui: { ...state.ui, selectedIds } };
				}),
			clearSelection: () => set((state) => ({ ui: { ...state.ui, selectedIds: [] } })),

			// 🔍 Filtros
			updateFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
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
						query: query, // Mantener ambos sincronizados
					},
				})),

			// --- SELECTORES ---
			getTaskById: (id) => get().tasks.find((task) => task.id === id),
			getFilteredTasks: () => {
				// Implementación básica para evitar errores
				return get().tasks;
			},
			getSortedTasks: () => {
				// Implementación básica para evitar errores
				return get().tasks;
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
