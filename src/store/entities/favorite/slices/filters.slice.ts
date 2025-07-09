/**
 * @file Filters slice para el store de Favorite
 * @module store/entities/favorite/slices/filters
 */

import { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';

import { FavoriteStore } from '..';
import { DEFAULT_FILTERS } from '../constants';
import { FavoriteFilters } from '../types';

// Logger específico para este slice
const logger = clientLogger.withContext({ module: 'FavoriteStore.FiltersSlice' });

// Estado
export interface FiltersState {
	filters: FavoriteFilters;
	isFilterActive: boolean;
}

// Acciones
export interface FiltersActions {
	// Gestión de filtros
	setFilters: (filters: Partial<FavoriteFilters>) => void;
	clearFilters: () => void;

	// Filtros específicos
	setEntityTypeFilter: (types: string[]) => void;
	setDateRangeFilter: (from: Date | null, to: Date | null) => void;
	setSearchFilter: (query: string) => void;

	// Selectores
	getFilteredFavorites: () => FavoriteExtended[];
	getActiveFilters: () => string[];
}

// Helpers
const isFilterActive = (filters: FavoriteFilters): boolean => {
	return (
		(filters.entityType && filters.entityType.length > 0) ||
		!!filters.createdAfter ||
		!!filters.createdBefore ||
		!!filters.search
	);
};

const applyFilters = (favorites: FavoriteExtended[], filters: FavoriteFilters): FavoriteExtended[] => {
	if (!isFilterActive(filters)) return favorites;

	return favorites.filter((favorite) => {
		// Filtro por tipo de entidad
		if (filters.entityType && filters.entityType.length > 0 && !filters.entityType.includes(favorite.entityType)) {
			return false;
		}

		// Filtro por fecha de creación (después de)
		if (filters.createdAfter && favorite.createdAt < filters.createdAfter) {
			return false;
		}

		// Filtro por fecha de creación (antes de)
		if (filters.createdBefore && favorite.createdAt > filters.createdBefore) {
			return false;
		}

		// Filtro por búsqueda
		if (filters.search && filters.search.trim() !== '') {
			const searchLower = filters.search.toLowerCase();
			// Usar el cast a FavoriteExtended para acceder a entityName
			const favoriteExtended = favorite as any;
			const nameMatch = favoriteExtended.entityName?.toLowerCase().includes(searchLower);
			const typeMatch = favorite.entityType.toLowerCase().includes(searchLower);

			if (!nameMatch && !typeMatch) {
				return false;
			}
		}

		return true;
	});
};

// Slice del store para filtros
export const createFiltersSlice: StateCreator<FavoriteStore, [], [], FiltersState & FiltersActions> = (set, get) => ({
	// Estado inicial
	filters: DEFAULT_FILTERS,
	isFilterActive: false,

	// Gestión de filtros
	setFilters: (newFilters) => {
		set((state) => {
			const updatedFilters = { ...state.filters, ...newFilters };
			return {
				filters: updatedFilters,
				isFilterActive: isFilterActive(updatedFilters),
			};
		});
		logger.info('🔍 Filtros actualizados:', newFilters);
	},

	clearFilters: () => {
		set({
			filters: DEFAULT_FILTERS,
			isFilterActive: false,
		});
		logger.info('🧹 Filtros eliminados');
	},

	// Filtros específicos
	setEntityTypeFilter: (types) => {
		get().setFilters({ entityType: types });
	},

	setDateRangeFilter: (from, to) => {
		get().setFilters({
			createdAfter: from,
			createdBefore: to,
		});
	},

	setSearchFilter: (query) => {
		get().setFilters({ search: query });
	},

	// Selectores
	getFilteredFavorites: () => {
		const { favorites, filters } = get();
		return applyFilters(favorites, filters);
	},

	getActiveFilters: () => {
		const { filters } = get();
		const activeFilters: string[] = [];

		if (filters.entityType && filters.entityType.length > 0) {
			activeFilters.push('tipo');
		}

		if (filters.createdAfter || filters.createdBefore) {
			activeFilters.push('fecha');
		}

		if (filters.search && filters.search.trim() !== '') {
			activeFilters.push('búsqueda');
		}

		return activeFilters;
	},
});
