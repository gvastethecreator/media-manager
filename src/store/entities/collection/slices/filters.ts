/**
 * @file Slice de filtros para el store de Collection
 * @module store/entities/collection/slices/filters
 */

import type { StateCreator } from 'zustand';
import { filterCollectionsBySearch, groupCollections, sortCollections } from '@/lib/utils/collection';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { CollectionFilter } from '@/types/entities/collection/types';
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
	getGroupedCollections: (groupBy?: 'rarity' | null) => Record<string, CollectionWithStats[]>;

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
	/**
	 * Filtra las colecciones por categoría
	 * @param category Categoría a filtrar o null para limpiar filtro
	 */
	filterByCategory: (category: string | null) => {
		set((state) => {
			const currentFilter = state.activeFilters[0] || {
				category: [],
				rarity: [],
				priceRange: [0, 1000] as [number, number],
				rating: 0,
		
				hasItems: null,
			};
			
			const newFilter = {
				...currentFilter,
				category: category ? [category] : [],
			};
			
			return { activeFilters: [newFilter] };
		});
		return get().getFilteredCollections();
	},

	/**
	 * Filtra las colecciones por rareza
	 * @param rarity Rareza a filtrar o null para limpiar filtro
	 */
	filterByRarity: (rarity: string | null) => {
		set((state) => {
			const currentFilter = state.activeFilters[0] || {
				category: [],
				rarity: [],
				priceRange: [0, 1000] as [number, number],
				rating: 0,
		
				hasItems: null,
			};
			
			const newFilter = {
				...currentFilter,
				rarity: rarity ? [rarity] : [],
			};
			
			return { activeFilters: [newFilter] };
		});
		return get().getFilteredCollections();
	},

	/**
	 * Filtra las colecciones por rango de precio
	 * @param minPrice Precio mínimo o null para sin mínimo
	 * @param maxPrice Precio máximo o null para sin máximo
	 */
	filterByPrice: (minPrice: number | null, maxPrice: number | null) => {
		set((state) => {
			const currentFilter = state.activeFilters[0] || {
				category: [],
				rarity: [],
				priceRange: [0, 1000] as [number, number],
				rating: 0,
		
				hasItems: null,
			};
			
			const newFilter = {
				...currentFilter,
				priceRange: [minPrice || 0, maxPrice || 1000] as [number, number],
			};
			
			return { activeFilters: [newFilter] };
		});
		return get().getFilteredCollections();
	},

	/**
	 * Filtra las colecciones por término de búsqueda
	 * @param searchTerm Término de búsqueda
	 */
	filterByName: (searchTerm: string) => {
		set({ searchTerm });
		return get().getFilteredCollections();
	},

	// Ordenamiento y agrupamiento
	getSortedCollections: (sortOption?: string) => {
		const collections = Object.values(get().collections);
		const option = sortOption || get().currentSortOption;
		return sortCollections(collections, option);
	},

	/**
	 * Obtiene las colecciones agrupadas según criterio especificado
	 * @param groupBy Criterio de agrupación (usa state.groupBy si no se especifica)
	 * @returns Objeto con grupos de colecciones
	 */
	getGroupedCollections: (groupBy?: 'category' | 'rarity' | 'platform' | null) => {
		const { groupBy: currentGroupBy } = get();
		let collectionsArray = get().getFilteredCollections();

		const groupByOption = groupBy || currentGroupBy;

		if (groupByOption === null) {
			return { all: collectionsArray };
		}

		const groups: Record<string, CollectionWithStats[]> = {};

		for (const collection of collectionsArray) {
			let groupKey: string;

			switch (groupByOption) {
				case 'category':
					groupKey = collection.category || 'unknown';
					break;
				case 'rarity':
					groupKey = collection.category || 'unknown';
					break;
				case 'platform':
					groupKey = collection.platform || 'unknown';
					break;
				default:
					groupKey = 'all';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(collection);
		}

		return groups;
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

	/**
	 * Aplica un conjunto de filtros, reemplazando los existentes
	 * @param filters Filtros a aplicar
	 */
	applyFilters: (filters: CollectionFilter[]) => {
		set({ activeFilters: filters });
		return get().getFilteredCollections();
	},

	// Búsqueda
	setSearchTerm: (term: string) => {
		set({ searchTerm: term });
	},

	getFilteredCollections: () => {
		const { searchTerm, activeFilters } = get();
		let collections = Object.values(get().collections);

		// Aplicar búsqueda por término
		if (searchTerm.trim()) {
			collections = filterCollectionsBySearch(collections, searchTerm);
		}

		// Aplicar filtros activos
		for (const filter of activeFilters) {
			collections = collections.filter(collection => {
				const fieldValue = (collection as any)[filter.field];
				
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
						const [min, max] = Array.isArray(filter.value) ? filter.value : [0, 0];
						return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
					default:
						return true;
				}
			});
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
