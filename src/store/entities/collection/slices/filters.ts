/**
 * @file Slice de filtros del store de Collection
 * @module store/entities/collection/slices/filters
 */

import type { CollectionExtended, CollectionFilter } from '@/types/entities/collection';
import { groupCollections, sortCollections } from '@/utils/collection';
import type { StateCreator } from 'zustand';
import type { CollectionState } from '../types';

/**
 * Slice de filtros con operaciones de filtrado y ordenamiento
 */
export interface CollectionFiltersSlice {
	// Operaciones de filtrado
	filterByCategory: (category: string | null) => CollectionExtended[];
	filterByRarity: (rarity: string | null) => CollectionExtended[];
	filterByPrice: (minPrice: number | null, maxPrice: number | null) => CollectionExtended[];
	filterByName: (searchTerm: string) => CollectionExtended[];

	// Operaciones de ordenación
	getSortedCollections: (sortOption?: string) => CollectionExtended[];
	getGroupedCollections: (groupBy?: 'category' | 'rarity' | 'platform' | null) => Record<string, CollectionExtended[]>;

	// Operaciones avanzadas de filtrado
	addFilter: (filter: CollectionFilter) => void;
	removeFilter: (index: number) => void;
	clearFilters: () => void;
	applyFilters: (filters: CollectionFilter[]) => CollectionExtended[];

	// Configuraciones de filtrado
	setDefaultSortOption: (option: string) => void;
	setDefaultGroupBy: (groupBy: 'category' | 'rarity' | 'platform' | null) => void;
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
	// Operaciones de filtrado
	filterByCategory: (category: string | null) => {
		const collections = Object.values(get().collections);
		if (!category) return collections;

		return collections.filter((collection) => collection.category === category);
	},

	filterByRarity: (rarity: string | null) => {
		const collections = Object.values(get().collections);
		if (!rarity) return collections;

		return collections.filter((collection) => collection.rarity === rarity);
	},

	filterByPrice: (minPrice: number | null, maxPrice: number | null) => {
		const collections = Object.values(get().collections);

		return collections.filter((collection) => {
			const price = collection.price || 0;
			if (minPrice !== null && price < minPrice) return false;
			if (maxPrice !== null && price > maxPrice) return false;
			return true;
		});
	},

	filterByName: (searchTerm: string) => {
		const collections = Object.values(get().collections);
		if (!searchTerm.trim()) return collections;

		const term = searchTerm.toLowerCase();
		return collections.filter(
			(collection) =>
				collection.name.toLowerCase().includes(term) || collection.description?.toLowerCase().includes(term)
		);
	},

	// Operaciones de ordenación
	getSortedCollections: (sortOption?: string) => {
		const { collections, viewConfig } = get();
		const collectionsArray = Object.values(collections);
		const option = sortOption || viewConfig.sortBy + (viewConfig.sortDirection === 'desc' ? '_desc' : '_asc');
		return sortCollections(collectionsArray, option);
	},

	getGroupedCollections: (groupBy?: 'category' | 'rarity' | 'platform' | null) => {
		const collections = Object.values(get().collections);
		const { viewConfig } = get();
		return groupCollections(collections, groupBy || viewConfig.groupBy || null);
	},

	// Operaciones avanzadas de filtrado
	addFilter: (filter: CollectionFilter) => {
		set((state) => {
			// Actualizar cada colección con sus filtros
			const updatedCollections = { ...state.collections };

			for (const [id, collection] of Object.entries(updatedCollections)) {
				if (!collection.parsedFilters) {
					collection.parsedFilters = [];
				}
				updatedCollections[id] = {
					...collection,
					parsedFilters: [...collection.parsedFilters, filter],
				};
			}

			return {
				collections: updatedCollections,
			};
		});
	},

	removeFilter: (index: number) => {
		set((state) => {
			// Actualizar cada colección quitando el filtro en el índice especificado
			const updatedCollections = { ...state.collections };

			for (const [id, collection] of Object.entries(updatedCollections)) {
				if (!collection.parsedFilters || collection.parsedFilters.length <= index) {
					continue;
				}

				const newFilters = [...collection.parsedFilters];
				newFilters.splice(index, 1);

				updatedCollections[id] = {
					...collection,
					parsedFilters: newFilters,
				};
			}

			return {
				collections: updatedCollections,
			};
		});
	},

	clearFilters: () => {
		set((state) => {
			// Limpiar filtros de todas las colecciones
			const updatedCollections = { ...state.collections };

			for (const [id, collection] of Object.entries(updatedCollections)) {
				updatedCollections[id] = {
					...collection,
					parsedFilters: [],
				};
			}

			return {
				collections: updatedCollections,
			};
		});
	},

	applyFilters: (filters: CollectionFilter[]) => {
		const collections = Object.values(get().collections);

		if (!filters || filters.length === 0) {
			return collections;
		}

		return collections.filter((collection) => {
			// Comprobar que se cumplen todos los filtros
			return filters.every((filter) => {
				const fieldValue = collection[filter.field as keyof CollectionExtended];

				// Convertir los valores a strings para comparación
				const value = fieldValue?.toString() || '';
				const filterValue = filter.value.toString();

				switch (filter.operator) {
					case 'equals':
						return value === filterValue;

					case 'contains':
						return value.toLowerCase().includes(filterValue.toLowerCase());

					case 'startsWith':
						return value.toLowerCase().startsWith(filterValue.toLowerCase());

					case 'endsWith':
						return value.toLowerCase().endsWith(filterValue.toLowerCase());

					case 'gt':
						return Number(value) > Number(filterValue);

					case 'lt':
						return Number(value) < Number(filterValue);

					case 'gte':
						return Number(value) >= Number(filterValue);

					case 'lte':
						return Number(value) <= Number(filterValue);

					default:
						return true;
				}
			});
		});
	},

	// Configuraciones de filtrado
	setDefaultSortOption: (option: string) => {
		const parts = option.split('_');

		if (parts.length === 2) {
			const sortBy = parts[0];
			const sortDirection = parts[1] as 'asc' | 'desc';

			set((state) => ({
				viewConfig: {
					...state.viewConfig,
					sortBy,
					sortDirection,
				},
			}));
		}
	},

	setDefaultGroupBy: (groupBy: 'category' | 'rarity' | 'platform' | null) => {
		set((state) => ({
			viewConfig: {
				...state.viewConfig,
				groupBy,
			},
		}));
	},
});
