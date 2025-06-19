/**
 * @file Slice para filtros y ordenación del store de grupos
 * @module store/entities/group/slices/filters
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { Group, GroupSortCriteria, GroupType } from '@/types/entities/group';
import type { StateCreator } from 'zustand';
import type { GroupState } from '../types';

const groupLogger = clientLogger.withContext('GroupFilters');

// Slice para filtrado y ordenación
export interface GroupFiltersSlice {
	// Establecer filtros
	setSortBy: (sortBy: GroupSortCriteria) => void;
	setSearchQuery: (query: string) => void;
	setFilterByType: (type: GroupType | null) => void;
	setFilterByCategory: (category: string | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	resetFilters: () => void;

	// Obtener grupos filtrados
	getFilteredGroups: () => Group[];
	applySort: (groups: Group[]) => Group[];
	applyFilters: (groups: Group[]) => Group[];
}

// Creador del slice
export const createGroupFiltersSlice: StateCreator<GroupState, [], [], GroupFiltersSlice> = (set, get) => ({
	// Establecer filtros
	setSortBy: (sortBy) => {
		groupLogger.info('🔤 Estableciendo criterio de ordenación:', sortBy);
		set((state) => ({
			filters: {
				...state.filters,
				sortBy,
			},
		}));
	},

	setSearchQuery: (query) => {
		groupLogger.info('🔍 Estableciendo consulta de búsqueda:', query);
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: query,
			},
		}));
	},

	setFilterByType: (type) => {
		groupLogger.info('🏷️ Filtrando por tipo:', type);
		set((state) => ({
			filters: {
				...state.filters,
				filterByType: type,
			},
		}));
	},

	setFilterByCategory: (category) => {
		groupLogger.info('📂 Filtrando por categoría:', category);
		set((state) => ({
			filters: {
				...state.filters,
				filterByCategory: category,
			},
		}));
	},

	setFilterFavorites: (onlyFavorites) => {
		groupLogger.info('⭐ Filtrando favoritos:', onlyFavorites);
		set((state) => ({
			filters: {
				...state.filters,
				filterFavorites: onlyFavorites,
			},
		}));
	},



	setDateRange: (from, to) => {
		groupLogger.info('📅 Estableciendo rango de fechas:', { from, to });
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

	resetFilters: () => {
		groupLogger.info('🔄 Restableciendo filtros');
		set((state) => ({
			filters: {
				...state.filters,
				sortBy: GroupSortCriteria.DATE_CREATED_DESC,
				searchQuery: '',
				filterByType: null,
				filterByCategory: null,
				filterFavorites: false,
				dateRange: {
					from: null,
					to: null,
				},
			},
		}));
	},

	// Obtener grupos filtrados
	getFilteredGroups: () => {
		// @ts-expect-error - getGroups no existe en el tipo `GroupState` directamente, pero sí en el store combinado.
		const groups = get().getGroups();
		return get().applySort(get().applyFilters(groups));
	},

	applyFilters: (groups) => {
		const { searchQuery, filterByType, filterByCategory, filterFavorites, dateRange } = get().filters;

		return groups.filter((group) => {
			// Filtro por búsqueda
			if (
				searchQuery &&
				!group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!(group.description || '').toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}

			// Filtro por tipo - campo eliminado del esquema
			// if (filterByType && group.type !== filterByType) {
			//	return false;
			// }

			// Filtro por categoría
			if (filterByCategory && group.category !== filterByCategory) {
				return false;
			}

			// Filtro por favoritos
			if (filterFavorites && !group.isFavorite) {
				return false;
			}



			// Filtro por rango de fechas
			if (dateRange.from && new Date(group.createdAt) < dateRange.from) {
				return false;
			}
			if (dateRange.to) {
				const endDate = new Date(dateRange.to);
				endDate.setHours(23, 59, 59, 999);
				if (new Date(group.createdAt) > endDate) {
					return false;
				}
			}

			return true;
		});
	},

	applySort: (groups) => {
		const { sortBy } = get().filters;
		const sortedGroups = [...groups];

		switch (sortBy) {
			case GroupSortCriteria.NAME_ASC:
				return sortedGroups.sort((a, b) => a.name.localeCompare(b.name));
			case GroupSortCriteria.NAME_DESC:
				return sortedGroups.sort((a, b) => b.name.localeCompare(a.name));
			case GroupSortCriteria.DATE_CREATED_ASC:
				return sortedGroups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			case GroupSortCriteria.DATE_CREATED_DESC:
				return sortedGroups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			case GroupSortCriteria.DATE_UPDATED_ASC:
				return sortedGroups.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
			case GroupSortCriteria.DATE_UPDATED_DESC:
				return sortedGroups.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
			case GroupSortCriteria.ITEMS_COUNT_ASC:
				return sortedGroups.sort((a, b) => (a.itemsCount || 0) - (b.itemsCount || 0));
			case GroupSortCriteria.ITEMS_COUNT_DESC:
				return sortedGroups.sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0));
			default:
				return sortedGroups;
		}
	},
});
