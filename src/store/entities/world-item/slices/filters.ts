/**
 * @file Slice de filtros para el store de WorldItem
 * @module store/entities/world-item/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { WorldItem } from '../../../../types/entities/world-item';
import { compareWorldItems, filterWorldItems } from '../../../../utils/world-item';
import type { WorldItemStore } from '../index';

export interface WorldItemFiltersSlice {
	// Propiedades computadas
	filteredWorldItems: WorldItem[];

	// Acciones de filtrado
	setTypeFilter: (types: string[] | null) => void;
	setCategoryFilter: (categories: string[] | null) => void;
	setRarityFilter: (rarities: string[] | null) => void;
	setFavoritesFilter: (onlyFavorites: boolean) => void;
	setLevelFilter: (min?: number, max?: number) => void;
	setValueFilter: (min?: number, max?: number) => void;
	setRelationsFilter: (options: {
		hasImages?: boolean;
		hasNotes?: boolean;
		hasConcepts?: boolean;
		hasPrompts?: boolean;
	}) => void;

	// Getters para items filtrados y ordenados
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];
}

export const createWorldItemFiltersSlice: StateCreator<WorldItemStore, [], [], WorldItemFiltersSlice> = (set, get) => ({
	// Propiedad computada
	get filteredWorldItems() {
		return filterWorldItems(get().worldItems, get().filters);
	},

	// Acciones de filtrado
	setTypeFilter: (types) => {
		set((state) => ({
			filters: {
				...state.filters,
				types: types || undefined,
			},
		}));
	},

	setCategoryFilter: (categories) => {
		set((state) => ({
			filters: {
				...state.filters,
				categories: categories || undefined,
			},
		}));
	},

	setRarityFilter: (rarities) => {
		set((state) => ({
			filters: {
				...state.filters,
				rarities: rarities || undefined,
			},
		}));
	},

	setFavoritesFilter: (onlyFavorites) => {
		set((state) => ({
			filters: {
				...state.filters,
				onlyFavorites,
			},
		}));
	},

	setLevelFilter: (min, max) => {
		set((state) => ({
			filters: {
				...state.filters,
				minLevel: min,
				maxLevel: max,
			},
		}));
	},

	setValueFilter: (min, max) => {
		set((state) => ({
			filters: {
				...state.filters,
				minValue: min,
				maxValue: max,
			},
		}));
	},

	setRelationsFilter: (options) => {
		set((state) => ({
			filters: {
				...state.filters,
				...options,
			},
		}));
	},

	// Getters para items filtrados/ordenados
	getFilteredWorldItems: () => {
		return filterWorldItems(get().worldItems, get().filters);
	},

	getSortedWorldItems: () => {
		const filteredItems = get().getFilteredWorldItems();
		const sortBy = get().sortBy;

		return [...filteredItems].sort((a, b) => compareWorldItems(a, b, sortBy));
	},
});
