import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { PromptSortOption } from '@/types/entities/prompt/enums';
import type { PromptFilters } from '@/types/entities/prompt/extended';
import type { PromptStore } from '../types';

const filtersLogger = clientLogger.withContext('PromptStore:Filters');

export interface FiltersSlice {
	clearFilters: () => void;
	// Estado
	filters: PromptFilters;
	page: number;
	pageSize: number;
	setCategoryFilter: (category: string | null) => void;

	// Acciones
	setFilters: (filters: Partial<PromptFilters>) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
	setSearchFilter: (search: string) => void;
	setSortBy: (sortBy: PromptSortOption) => void;
	setTagsFilter: (tags: string[]) => void;
	sortBy: PromptSortOption;
}

export const createFiltersSlice: StateCreator<PromptStore, [], [], FiltersSlice> = (set) => ({
	// Estado inicial
	filters: {
		search: '',
		category: undefined,
		tags: [],
		onlyFavorites: false,
	},
	sortBy: PromptSortOption.NAME_ASC,
	page: 1,
	pageSize: 20,

	// Acciones
	setFilters: (newFilters) => {
		filtersLogger.info('📊 Actualizando filtros:', newFilters);
		set((state: PromptStore) => ({
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
		set((state: PromptStore) => ({
			filters: {
				...state.filters,
				category: category ?? undefined,
			},
			page: 1,
		}));
	},

	setSearchFilter: (search) => {
		filtersLogger.info('🔍 Filtrando por búsqueda:', search);
		set((state: PromptStore) => ({
			filters: { ...state.filters, search },
			page: 1,
		}));
	},

	setTagsFilter: (tags) => {
		filtersLogger.info('🏷️ Filtrando por tags:', tags);
		set((state: PromptStore) => ({
			filters: { ...state.filters, tags },
			page: 1,
		}));
	},

	setOnlyFavoritesFilter: (onlyFavorites) => {
		filtersLogger.info('⭐ Filtrando favoritos:', onlyFavorites);
		set((state: PromptStore) => ({
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
