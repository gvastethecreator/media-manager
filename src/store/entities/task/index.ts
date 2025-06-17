/**
 * @file Store principal para la entidad Task
 * @module store/entities/task
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createSelectors } from '@/utils/store-selectors';

// Importar slices
import { CoreActions, CoreState, createCoreSlice } from './slices/core.slice';
import { createFiltersSlice, FiltersActions, FiltersState } from './slices/filters.slice';
import { createUISlice, UIActions, UIState } from './slices/ui.slice';

// Tipo del store completo
export type TaskStore = CoreState & CoreActions & UIState & UIActions & FiltersState & FiltersActions;

// Crear el store con todos los slices
const useTaskStoreBase = create<TaskStore>()(
	devtools(
		persist(
			(...a) => ({
				...createCoreSlice(...a),
				...createUISlice(...a),
				...createFiltersSlice(...a),
			}),
			{
				name: 'task-store',
				// Solo persistir algunas partes del state
				partialize: (state) => ({
					viewMode: state.viewMode,
					sortCriteria: state.sortCriteria,
					sortDirection: state.sortDirection,
					filters: state.filters,
				}),
			}
		),
		{ name: 'TaskStore' }
	)
);

// Exportar el store con selectores
export const useTaskStore = createSelectors(useTaskStoreBase);

// Re-exportar tipos y constantes
export * from './constants';
export * from './types';
