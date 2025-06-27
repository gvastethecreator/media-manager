/**
 * @file Slice de filtros para el store de Collection
 * @module store/entities/collection/slices/filters
 */

import type { CollectionFilter, CollectionWithStats } from '@/types/entities/collection';
import type { StateCreator } from 'zustand';
import { filterCollectionsBySearch, groupCollections, sortCollections } from '@/lib/utils/collection';
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
		const collections = get().getCollections();
		if (!category) return collections;
		return collections.filter((collection) => collection.category === category);
	},

	filterByRarity: (rarity: string | null) => {
		const collections = get().getCollections();
		if (!rarity) return collections;

		return collections.filter((collection) => {
			const totalItems = collection.stats?.totalItems || 0;
			switch (rarity) {
				case 'Mítica':
					return totalItems > 100;
				case 'Rara':
					return totalItems > 50 && totalItems <= 100;
				case 'Poco común':
					return totalItems > 20 && totalItems <= 50;
				case 'Común':
					return totalItems <= 20;
				default:
					return true;
			}
		});
	},

	filterByPrice: (minPrice: number | null, maxPrice: number | null) => {
		const collections = get().getCollections();
		return collections.filter((collection) => {
			const price = collection.price || 0;
			if (minPrice !== null && price < minPrice) return false;
			if (maxPrice !== null && price > maxPrice) return false;
			return true;
		});
	},

	filterByName: (searchTerm: string) => {
		const collections = get().getCollections();
		return filterCollectionsBySearch(collections, searchTerm);
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
