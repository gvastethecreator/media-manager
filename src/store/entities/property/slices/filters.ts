/**
 * @file Slice de filters para el store de propiedades
 * @module store/entities/property/slices/filters
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { PropertySortCriteria } from '@/types/entities/property';
import type { PropertyState } from '../types';

const filtersLogger = clientLogger.withContext('PropertyStore:Filters');

// Slice para operaciones de filtrado
export interface PropertyFiltersSlice {
	// Filtros básicos
	setSearchQuery: (query: string) => void;
	setFilterByCategory: (category: string | null) => void;
	setFilterFavorites: (filterFavorites: boolean) => void;

	// Ordenación
	setSortBy: (sortBy: PropertySortCriteria) => void;

	// Fecha
	setDateRange: (from: Date | null, to: Date | null) => void;
	clearDateRange: () => void;

	// Reset
	resetFilters: () => void;
}

// Creador del slice
export const createPropertyFiltersSlice: StateCreator<PropertyState, [], [], PropertyFiltersSlice> = (set) => ({
	// Filtros básicos
	setSearchQuery: (query) => {
		filtersLogger.info('🔍 Estableciendo término de búsqueda:', query);
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: query,
			},
		}));
	},

	setFilterByCategory: (category) => {
		filtersLogger.info('🏷️ Filtrando por categoría:', category);
		set((state) => ({
			filters: {
				...state.filters,
				filterByCategory: category,
			},
		}));
	},

	setFilterFavorites: (filterFavorites) => {
		filtersLogger.info('⭐ Filtrando favoritos:', filterFavorites);
		set((state) => ({
			filters: {
				...state.filters,
				filterFavorites,
			},
		}));
	},

	// Ordenación
	setSortBy: (sortBy) => {
		filtersLogger.info('📊 Estableciendo criterio de ordenación:', sortBy);
		set((state) => ({
			filters: {
				...state.filters,
				sortBy,
			},
		}));
	},

	// Fecha
	setDateRange: (from, to) => {
		filtersLogger.info('📅 Estableciendo rango de fechas:', { from, to });
		set((state) => ({
			filters: {
				...state.filters,
				dateRange: {
					from,
					to,
				},
			},
		}));
	},

	clearDateRange: () => {
		filtersLogger.info('🧹 Limpiando rango de fechas');
		set((state) => ({
			filters: {
				...state.filters,
				dateRange: {
					from: null,
					to: null,
				},
			},
		}));
	},

	// Reset
	resetFilters: () => {
		filtersLogger.info('🧹 Reseteando filtros');
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: '',
				filterByCategory: null,
				filterFavorites: false,
				dateRange: {
					from: null,
					to: null,
				},
			},
		}));
	},
});
