import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { ConceptFilters, ConceptWithStats } from '@/types/entities/concept';
import { ConceptSortOption } from '@/types/entities/concept/enums';
import type { ConceptStore } from '../types';

const filtersLogger = clientLogger.withContext('ConceptStore:Filters');

export interface FiltersSlice {
	// Estado
	filters: ConceptFilters;
	sortBy: ConceptSortOption;
	page: number;
	pageSize: number;

	// Acciones
	setFilters: (filters: Partial<ConceptFilters>) => void;
	setSortBy: (sortBy: ConceptSortOption) => void;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
	setCategoryFilter: (category: string | null) => void;
	setSearchFilter: (search: string) => void;
	setTagsFilter: (tags: string[]) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	clearFilters: () => void;
}

export const createFiltersSlice: StateCreator<ConceptStore, [], [], FiltersSlice> = (set) => ({
	// Estado inicial
	filters: {
		search: '',
		category: undefined,
		tags: [],
		onlyFavorites: false,
	},
	sortBy: ConceptSortOption.NAME_ASC,
	page: 1,
	pageSize: 20,

	// Acciones
	setFilters: (newFilters) => {
		filtersLogger.info('📊 Actualizando filtros:', newFilters);
		set((state: ConceptStore) => ({
			filters: { ...state.filters, ...newFilters },
			// Resetear página al cambiar filtros
			page: 1,
		}));
	},

	setSortBy: (sortBy) => {
		filtersLogger.info('🔄 Cambiando ordenación:', sortBy);
		set({ sortBy });
	},

	setPage: (page) => {
		set({ page });
	},

	setPageSize: (pageSize) => {
		filtersLogger.info('📏 Cambiando tamaño de página:', pageSize);
		set({ pageSize, page: 1 });
	},

	setCategoryFilter: (category) => {
		filtersLogger.info('🏷️ Filtrando por categoría:', category);
		set((state: ConceptStore) => ({
			filters: {
				...state.filters,
				category: category ?? undefined,
			},
			page: 1,
		}));
	},

	setSearchFilter: (search) => {
		filtersLogger.info('🔍 Filtrando por búsqueda:', search);
		set((state: ConceptStore) => ({
			filters: { ...state.filters, search },
			page: 1,
		}));
	},

	setTagsFilter: (tags) => {
		filtersLogger.info('🏷️ Filtrando por tags:', tags);
		set((state: ConceptStore) => ({
			filters: { ...state.filters, tags },
			page: 1,
		}));
	},

	setOnlyFavoritesFilter: (onlyFavorites) => {
		filtersLogger.info('⭐ Filtrando favoritos:', onlyFavorites);
		set((state: ConceptStore) => ({
			filters: { ...state.filters, onlyFavorites },
			page: 1,
		}));
	},

	clearFilters: () => {
		filtersLogger.info('🧹 Limpiando todos los filtros');
		set({
			filters: {
				search: '',
				category: undefined,
				tags: [],
				onlyFavorites: false,
			},
			page: 1,
		});
	},
});
