import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { NoteFilters, NoteSortOption } from '@/types/entities/note/types';
import type { NoteStore } from '../types';

const filtersLogger = clientLogger.withContext('NoteStore:Filters');

export interface FiltersSlice {
	// Estado
	filters: NoteFilters;
	sortBy: NoteSortOption;
	page: number;
	pageSize: number;

	// Acciones
	setFilters: (filters: Partial<NoteFilters>) => void;
	setSortBy: (sortBy: NoteSortOption) => void;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
	setCategoryFilter: (category: string | null) => void;
	setStatusFilter: (status: string | null) => void;
	setPriorityFilter: (priority: number | null) => void;
	setSearchFilter: (search: string) => void;
	setTagsFilter: (tags: string[]) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	clearFilters: () => void;
}

export const createFiltersSlice: StateCreator<NoteStore, [], [], FiltersSlice> = (set) => ({
	// Estado inicial
	filters: {
		searchQuery: '',
		categories: [],
		statuses: [],
		priorities: [],
		onlyFavorites: false,
		contentContains: '',
		hasTags: false,
		hasImages: false,
		hasVideos: false,
	},
	sortBy: 'updated_desc',
	page: 1,
	pageSize: 20,

	// Acciones
	setFilters: (newFilters) => {
		filtersLogger.info('📊 Actualizando filtros:', newFilters);
		set((state: NoteStore) => ({
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
		set((state: NoteStore) => ({
			filters: {
				...state.filters,
				category: category ?? undefined,
			},
			page: 1,
		}));
	},

	setStatusFilter: (status) => {
		filtersLogger.info('🚦 Filtrando por estado:', status);
		set((state: NoteStore) => ({
			filters: {
				...state.filters,
				status: (status as any) ?? undefined,
			},
			page: 1,
		}));
	},

	setPriorityFilter: (priority) => {
		filtersLogger.info('⭐ Filtrando por prioridad:', priority);
		set((state: NoteStore) => ({
			filters: {
				...state.filters,
				priority: (priority as any) ?? undefined,
			},
			page: 1,
		}));
	},

	setSearchFilter: (search) => {
		filtersLogger.info('🔍 Filtrando por búsqueda:', search);
		set((state: NoteStore) => ({
			filters: { ...state.filters, searchQuery: search },
			page: 1,
		}));
	},

	setTagsFilter: (tags) => {
		filtersLogger.info('🏷️ Filtrando por tags:', tags);
		set((state: NoteStore) => ({
			filters: { ...state.filters, tags },
			page: 1,
		}));
	},

	setOnlyFavoritesFilter: (onlyFavorites) => {
		filtersLogger.info('⭐ Filtrando favoritos:', onlyFavorites);
		set((state: NoteStore) => ({
			filters: { ...state.filters, onlyFavorites },
			page: 1,
		}));
	},

	clearFilters: () => {
		filtersLogger.info('🧹 Limpiando todos los filtros');
		set({
			filters: {
				searchQuery: '',
				categories: [],
				statuses: [],
				priorities: [],
				onlyFavorites: false,
				contentContains: '',
				hasTags: false,
				hasImages: false,
				hasVideos: false,
			},
			page: 1,
		});
	},
});
