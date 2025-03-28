/**
 * @file Slice de filtros para el store de Tag
 * @module store/entities/tag/slices/filters
 */

import { TagCategory, TagRarity, TagSortCriteria } from '@/types/entities/tag/enums';
import { searchTags, sortTags } from '@/utils/tag/helpers';
import type { StateCreator } from 'zustand';
import type { TagFiltersState, TagState } from '../types';

export interface TagFiltersSlice {
	// Estado
	filters: TagFiltersState;

	// Acciones
	setSortCriteria: (sortBy: TagSortCriteria) => void;
	setSearchQuery: (query: string) => void;
	toggleFavoritesFilter: () => void;
	setFavoritesFilter: (showOnlyFavorites: boolean) => void;

	// Acciones de categoría
	addCategoryFilter: (category: string) => void;
	removeCategoryFilter: (category: string) => void;
	setCategoriesFilter: (categories: string[]) => void;
	clearCategoriesFilter: () => void;

	// Acciones de rareza
	addRarityFilter: (rarity: string) => void;
	removeRarityFilter: (rarity: string) => void;
	setRaritiesFilter: (rarities: string[]) => void;
	clearRaritiesFilter: () => void;

	// Acciones generales
	clearAllFilters: () => void;

	// Selectores
	getFilteredTags: () => any[];
}

export const createTagFiltersSlice: StateCreator<TagState & TagFiltersSlice, [], [], TagFiltersSlice> = (set, get) => ({
	filters: {
		sortBy: TagSortCriteria.NAME_ASC,
		searchQuery: '',
		showOnlyFavorites: false,
		categories: [],
		rarities: [],
	},

	// Acción para establecer el criterio de ordenación
	setSortCriteria: (sortBy) => {
		set((state) => ({
			filters: {
				...state.filters,
				sortBy,
			},
		}));
	},

	// Acción para establecer la consulta de búsqueda
	setSearchQuery: (searchQuery) => {
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery,
			},
		}));
	},

	// Acción para alternar el filtro de favoritos
	toggleFavoritesFilter: () => {
		set((state) => ({
			filters: {
				...state.filters,
				showOnlyFavorites: !state.filters.showOnlyFavorites,
			},
		}));
	},

	// Acción para establecer el filtro de favoritos
	setFavoritesFilter: (showOnlyFavorites) => {
		set((state) => ({
			filters: {
				...state.filters,
				showOnlyFavorites,
			},
		}));
	},

	// Acción para añadir una categoría al filtro
	addCategoryFilter: (category) => {
		set((state) => {
			if (state.filters.categories.includes(category)) {
				return state;
			}

			return {
				filters: {
					...state.filters,
					categories: [...state.filters.categories, category],
				},
			};
		});
	},

	// Acción para eliminar una categoría del filtro
	removeCategoryFilter: (category) => {
		set((state) => ({
			filters: {
				...state.filters,
				categories: state.filters.categories.filter((c) => c !== category),
			},
		}));
	},

	// Acción para establecer las categorías del filtro
	setCategoriesFilter: (categories) => {
		set((state) => ({
			filters: {
				...state.filters,
				categories,
			},
		}));
	},

	// Acción para limpiar el filtro de categorías
	clearCategoriesFilter: () => {
		set((state) => ({
			filters: {
				...state.filters,
				categories: [],
			},
		}));
	},

	// Acción para añadir una rareza al filtro
	addRarityFilter: (rarity) => {
		set((state) => {
			if (state.filters.rarities.includes(rarity)) {
				return state;
			}

			return {
				filters: {
					...state.filters,
					rarities: [...state.filters.rarities, rarity],
				},
			};
		});
	},

	// Acción para eliminar una rareza del filtro
	removeRarityFilter: (rarity) => {
		set((state) => ({
			filters: {
				...state.filters,
				rarities: state.filters.rarities.filter((r) => r !== rarity),
			},
		}));
	},

	// Acción para establecer las rarezas del filtro
	setRaritiesFilter: (rarities) => {
		set((state) => ({
			filters: {
				...state.filters,
				rarities,
			},
		}));
	},

	// Acción para limpiar el filtro de rarezas
	clearRaritiesFilter: () => {
		set((state) => ({
			filters: {
				...state.filters,
				rarities: [],
			},
		}));
	},

	// Acción para limpiar todos los filtros
	clearAllFilters: () => {
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: '',
				showOnlyFavorites: false,
				categories: [],
				rarities: [],
			},
		}));
	},

	// Selector para obtener etiquetas filtradas
	getFilteredTags: () => {
		const { core, filters } = get();
		const allTags = Object.values(core.tags);

		// Aplicar filtro de favoritos
		let filteredTags = filters.showOnlyFavorites ? allTags.filter((tag) => (tag as any).isFavorite) : allTags;

		// Aplicar filtro de categorías
		if (filters.categories.length > 0) {
			filteredTags = filteredTags.filter((tag) => {
				const category = (tag as any).category || TagCategory.OTHER;
				return filters.categories.includes(category);
			});
		}

		// Aplicar filtro de rarezas
		if (filters.rarities.length > 0) {
			filteredTags = filteredTags.filter((tag) => {
				const rarity = (tag as any).rarity || TagRarity.COMMON;
				return filters.rarities.includes(rarity);
			});
		}

		// Aplicar búsqueda por término
		if (filters.searchQuery) {
			filteredTags = searchTags(filteredTags, filters.searchQuery);
		}

		// Aplicar ordenación
		return sortTags(filteredTags, filters.sortBy);
	},
});
