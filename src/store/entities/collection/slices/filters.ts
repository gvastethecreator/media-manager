/**
 * @file Slice de filtros para el store de Collection
 * @module store/entities/collection/slices/filters
 */

import type { StateCreator } from 'zustand';
import { filterCollectionsBySearch, groupCollections, sortCollections } from '@/lib/utils/collection';
import type { CollectionFilter, CollectionWithStats } from '@/types/entities/collection';
import type { CollectionState } from '../types';

/**
 * Slice de filtros y ordenamiento para colecciones
 */
export interface CollectionFiltersSlice {
	// Filtros básicos
	filterByCategory: (category: string | null) => CollectionWithStats[];
	filterByRarity: (rarity: string | null) => CollectionWithStats[];
	filterByPrice: (minPrice: number | null, maxPrice: number | null) => CollectionWithStats[];
	filterByName: (searchTerm: string) => CollectionWithStats[];

	// Ordenamiento y agrupamiento
	getSortedCollections: (sortOption?: string) => CollectionWithStats[];
	getGroupedCollections: (groupBy?: 'category' | 'rarity' | 'platform' | null) => Record<string, CollectionWithStats[]>;

	// Filtros avanzados
	setActiveFilters: (filters: CollectionFilter[]) => void;
	clearFilters: () => void;
	applyFilters: (filters: CollectionFilter[]) => CollectionWithStats[];

	// Búsqueda
	setSearchTerm: (term: string) => void;
	getFilteredCollections: () => CollectionWithStats[];

	// Configuración de vista
	setSortOption: (option: string) => void;
	setGroupBy: (groupBy: 'category' | 'rarity' | 'platform' | null) => void;
}

/**
 * Implementación del slice de filtros
 */
export const createCollectionFiltersSlice: StateCreator<
	CollectionState & CollectionFiltersSlice,
	[],
	[],
	CollectionFiltersSlice
> = (set, get) => ({
	// Filtros básicos
	filterByCategory: (category: string | null) => {
		set((state) => {
			const newFilters = state.activeFilters.filter((filter) => filter.field !== 'category');
			if (category) {
				newFilters.push({ field: 'category', value: category, operator: 'equals' });
			}
			return { activeFilters: newFilters };
		});
	},

	filterByRarity: (rarity: string | null) => {
		set((state) => {
			const newFilters = state.activeFilters.filter((filter) => filter.field !== 'rarity');
			if (rarity) {
				newFilters.push({ field: 'rarity', value: rarity, operator: 'equals' });
			}
			return { activeFilters: newFilters };
		});
	},

	filterByPrice: (minPrice: number | null, maxPrice: number | null) => {
		set((state) => {
			const newFilters = state.activeFilters.filter((filter) => filter.field !== 'price');
			if (minPrice !== null && maxPrice !== null) {
				newFilters.push({ field: 'price', value: [minPrice, maxPrice], operator: 'between' });
			} else if (minPrice !== null) {
				newFilters.push({ field: 'price', value: minPrice, operator: 'gte' });
			} else if (maxPrice !== null) {
				newFilters.push({ field: 'price', value: maxPrice, operator: 'lte' });
			}
			return { activeFilters: newFilters };
		});
	},

	filterByName: (searchTerm: string) => {
		set((state) => {
			const newFilters = state.activeFilters.filter((filter) => filter.field !== 'name');
			if (searchTerm) {
				newFilters.push({ field: 'name', value: searchTerm, operator: 'contains' });
			}
			return { activeFilters: newFilters };
		});
	},

	// Ordenamiento y agrupamiento
	getSortedCollections: (sortOption?: string) => {
		const collections = get().getCollections();
		const option = sortOption || get().currentSortOption;
		return sortCollections(collections, option);
	},

	getGroupedCollections: (groupBy?: 'category' | 'rarity' | 'platform' | null) => {
		const collections = get().getCollections();
		const groupByOption = groupBy !== undefined ? groupBy : get().groupBy;
		return groupCollections(collections, groupByOption);
	},

	// Filtros avanzados
	setActiveFilters: (filters: CollectionFilter[]) => {
		set({ activeFilters: filters });
	},

	clearFilters: () => {
		set({
			activeFilters: [],
			searchTerm: '',
			groupBy: null,
		});
	},

	applyFilters: (filters: CollectionFilter[]) => {
		const collections = get().getCollections();

		return collections.filter((collection) => {
			return filters.every((filter) => {
				const fieldValue = collection[filter.field as keyof CollectionWithStats];

				switch (filter.operator) {
					case 'equals':
						return fieldValue === filter.value;
					case 'contains':
						return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
					case 'startsWith':
						return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
					case 'endsWith':
						return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
					case 'gt':
						return Number(fieldValue) > Number(filter.value);
					case 'gte':
						return Number(fieldValue) >= Number(filter.value);
					case 'lt':
						return Number(fieldValue) < Number(filter.value);
					case 'lte':
						return Number(fieldValue) <= Number(filter.value);
					case 'between':
						if (Array.isArray(filter.value) && filter.value.length === 2) {
							const [min, max] = filter.value;
							return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
						}
						return true;
					default:
						return true;
				}
			});
		});
	},

	// Búsqueda
	setSearchTerm: (term: string) => {
		set({ searchTerm: term });
	},

	getFilteredCollections: () => {
		const { searchTerm, activeFilters } = get();
		let collections = get().getCollections();

		// Aplicar búsqueda por término
		if (searchTerm.trim()) {
			collections = filterCollectionsBySearch(collections, searchTerm);
		}

		// Aplicar filtros activos
		if (activeFilters.length > 0) {
			collections = get().applyFilters(activeFilters);
		}

		return collections;
	},

	// Configuración de vista
	setSortOption: (option: string) => {
		set({ currentSortOption: option });
	},

	setGroupBy: (groupBy: 'category' | 'rarity' | 'platform' | null) => {
		set({ groupBy });
	},
});
