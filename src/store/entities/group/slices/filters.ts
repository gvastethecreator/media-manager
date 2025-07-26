/**
 * @file Slice para filtros y ordenación del store de grupos
 * @module store/entities/group/slices/filters
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { GroupSortCriteria, GroupType, GroupWithStats } from '@/types/entities/group';
import type { GroupStore } from '../types';

type Group = GroupWithStats;

const groupLogger = clientLogger.withContext('GroupFilters');

// Slice para filtrado y ordenación
export interface GroupFiltersSlice {
	// Estado de filtros
	sortBy: GroupSortCriteria;
	searchQuery: string;
	filterByType: GroupType | null;
	filterByCategory: string | null;
	filterFavorites: boolean;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};

	// Establecer filtros
	setSortBy: (sortBy: GroupSortCriteria) => void;
	setSearchQuery: (query: string) => void;
	setFilterByType: (type: GroupType | null) => void;
	setFilterByCategory: (category: string | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	resetFilters: () => void;

	// Obtener grupos filtrados
	getFilteredGroups: () => GroupWithStats[];
	applySort: (groups: GroupWithStats[]) => GroupWithStats[];
	applyFilters: (groups: GroupWithStats[]) => GroupWithStats[];
}

// Creador del slice
export const createGroupFiltersSlice: StateCreator<GroupStore, [], [], GroupFiltersSlice> = (set, get) => ({
	// Estado inicial de filtros
	sortBy: GroupSortCriteria.DATE_CREATED_DESC,
	searchQuery: '',
	filterByType: null,
	filterByCategory: null,
	filterFavorites: false,
	dateRange: {
		from: null,
		to: null,
	},
	// Establecer filtros
	setSortBy: (sortBy) => {
		groupLogger.info('🔤 Estableciendo criterio de ordenación:', sortBy);
		set({ sortBy });
	},

	setSearchQuery: (query) => {
		groupLogger.info('🔍 Estableciendo consulta de búsqueda:', query);
		set({ searchQuery: query });
	},

	setFilterByType: (type) => {
		groupLogger.info('🏷️ Filtrando por tipo:', type);
		set({ filterByType: type });
	},

	setFilterByCategory: (category) => {
		groupLogger.info('📂 Filtrando por categoría:', category);
		set({ filterByCategory: category });
	},

	setFilterFavorites: (onlyFavorites) => {
		groupLogger.info('⭐ Filtrando favoritos:', onlyFavorites);
		set({ filterFavorites: onlyFavorites });
	},

	setDateRange: (from, to) => {
		groupLogger.info('📅 Estableciendo rango de fechas:', { from, to });
		set({ dateRange: { from, to } });
	},

	resetFilters: () => {
		groupLogger.info('🔄 Restableciendo filtros');
		set({
			sortBy: GroupSortCriteria.DATE_CREATED_DESC,
			searchQuery: '',
			filterByType: null,
			filterByCategory: null,
			filterFavorites: false,
			dateRange: {
				from: null,
				to: null,
			},
		});
	},

	applyFilters: (groups: GroupWithStats[]) => {
		const state = get();
		const { searchQuery, filterByType, filterByCategory, filterFavorites } = state;
		
		return groups.filter(group => {
			// Filtro por búsqueda
			if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			
			// Filtro por tipo
			if (filterByType && group.category !== filterByType) {
				return false;
			}
			
			// Filtro por categoría
			if (filterByCategory && group.category !== filterByCategory) {
				return false;
			}
			
			// Filtro por favoritos
			if (filterFavorites && !group.isFavorite) {
				return false;
			}
			
			return true;
		});
	},

	applySort: (groups: GroupWithStats[]) => {
		const { sortBy } = get();
		
		return [...groups].sort((a, b) => {
			switch (sortBy) {
				case GroupSortCriteria.NAME_ASC:
					return a.name.localeCompare(b.name);
				case GroupSortCriteria.NAME_DESC:
					return b.name.localeCompare(a.name);
				case GroupSortCriteria.DATE_CREATED_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case GroupSortCriteria.DATE_CREATED_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case GroupSortCriteria.DATE_UPDATED_ASC:
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
				case GroupSortCriteria.DATE_UPDATED_DESC:
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				case GroupSortCriteria.ITEMS_COUNT_ASC:
					return (a.stats.totalItems || 0) - (b.stats.totalItems || 0);
				case GroupSortCriteria.ITEMS_COUNT_DESC:
					return (b.stats.totalItems || 0) - (a.stats.totalItems || 0);
				default:
					return 0;
			}
		});
	},

	// Obtener grupos filtrados
	getFilteredGroups: () => {
		const groups = Object.values(get().groups);
		const filtered = get().applyFilters(groups);
		return get().applySort(filtered);
	},
});
