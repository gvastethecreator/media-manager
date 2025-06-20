/**
 * @file Store principal para la entidad Activity (Actividades)
 * @module store/entities/activity
 * @description Implementación del store de Zustand para la gestión de actividades del sistema
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { ActivityComplete, ActivitySortCriteria } from '@/types/entities/activity';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type ActivityCoreSlice, createActivityCoreSlice } from './slices/core';
import { type ActivityFiltersSlice, createActivityFiltersSlice } from './slices/filters';
import { type ActivityUISlice, createActivityUISlice } from './slices/ui';

// Logger para el store
const storeLogger = clientLogger.withContext('ActivityStore');

/**
 * Estado completo del store de Activity (sin estructura anidada)
 */
export interface ActivityState {
	// Datos principales
	activities: Record<string, ActivityComplete>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// Estado UI
	selectedIds: string[];
	expandedIds: string[];
	highlightedId: string | null;
	detailActivityId: string | null;
	isDetailModalOpen: boolean;
	groupByDate: boolean;

	// Estado de filtros
	sortBy: ActivitySortCriteria;
	searchQuery: string;
	selectedCategories: string[];
	onlyAlerts: boolean;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	filterByImageId: string | null;
}

// Tipo del store completo que combina todos los slices
export type ActivityStore = ActivityState & ActivityCoreSlice & ActivityUISlice & ActivityFiltersSlice;

// Estado inicial para el store
const initialState: ActivityState = {
	// Datos principales
	activities: {},
	isLoading: false,
	error: null,
	lastUpdated: null,

	// Estado UI
	selectedIds: [],
	expandedIds: [],
	highlightedId: null,
	detailActivityId: null,
	isDetailModalOpen: false,
	groupByDate: true,

	// Estado de filtros
	sortBy: ActivitySortCriteria.DATE_DESC,
	searchQuery: '',
	selectedCategories: [],
	onlyAlerts: false,
	dateRange: {
		from: null,
		to: null,
	},
	filterByImageId: null,
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
			(set, get, api) => {
				storeLogger.info('🏗️ Inicializando ActivityStore');

				// Combinar todos los slices en un solo store
				const coreSlice = createActivityCoreSlice(set, get, api);
				const uiSlice = createActivityUISlice(set, get, api);
				const filtersSlice = createActivityFiltersSlice(set, get, api);

				return {
					...initialState,
					...coreSlice,
					...uiSlice,
					...filtersSlice,
				};
			},
			{
				name: 'activity-store',
				// Solo persistir configuraciones de usuario, no los datos de actividades
				partialize: (state) => ({
					groupByDate: state.groupByDate,
					sortBy: state.sortBy,
					onlyAlerts: state.onlyAlerts,
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

