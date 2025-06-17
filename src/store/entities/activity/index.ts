/**
 * @file Store principal para la entidad Activity (Actividades)
 * @module store/entities/activity
 * @description Implementación del store de Zustand para la gestión de actividades del sistema
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { clientLogger } from '@/lib/logger/client-logger';
import { ActivitySortCriteria } from '@/types/entities/activity';
import { type ActivityCoreSlice, createActivityCoreSlice } from './slices/core';
import { type ActivityFiltersSlice, createActivityFiltersSlice } from './slices/filters';
import { type ActivityUISlice, createActivityUISlice } from './slices/ui';
import type { ActivityState } from './types';

// Logger para el store
const storeLogger = clientLogger.withContext('ActivityStore');

// Tipo del store completo que combina todos los slices
export type ActivityStore = ActivityCoreSlice & ActivityUISlice & ActivityFiltersSlice;

// Estado inicial para cada parte del store
const _initialState: ActivityState = {
	// Estado core: Datos principales de actividades
	core: {
		activities: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},

	// Estado UI: Controla la interfaz de usuario
	ui: {
		selectedIds: [],
		expandedIds: [],
		highlightedId: null,
		detailActivityId: null,
		isDetailModalOpen: false,
		groupByDate: true,
	},

	// Estado de filtros: Controla criterios de filtrado y búsqueda
	filters: {
		sortBy: ActivitySortCriteria.DATE_DESC,
		searchQuery: '',
		selectedCategories: [],
		onlyAlerts: false,
		dateRange: {
			from: null,
			to: null,
		},
		filterByImageId: null,
	},
};

/**
 * Store de actividades que combina todos los slices en un único store global
 * Utiliza middleware:
 * - devtools: Para depuración con Redux DevTools
 * - persist: Para persistencia de configuraciones de usuario
 */
export const useActivityStore = create<ActivityStore>()(
	devtools(
		persist(
			(...args) => {
				storeLogger.info('🏗️ Inicializando ActivityStore');

				// Combinar todos los slices en un solo store
				return {
					...createActivityCoreSlice(...args),
					...createActivityUISlice(...args),
					...createActivityFiltersSlice(...args),
				};
			},
			{
				name: 'activity-store',
				// Solo persistir configuraciones de usuario, no los datos de actividades
				partialize: (state) => ({
					ui: {
						groupByDate: state.ui.groupByDate,
					},
					filters: {
						sortBy: state.filters.sortBy,
						onlyAlerts: state.filters.onlyAlerts,
					},
				}),
			}
		),
		{
			name: 'ActivityStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Exportar selectores útiles
export * from './selectors';

// Exportar slices para poder extenderlos si es necesario
export { createActivityCoreSlice } from './slices/core';
export { createActivityFiltersSlice } from './slices/filters';
export { createActivityUISlice } from './slices/ui';
// Exportar todo desde types para facilitar el uso
export * from './types';
