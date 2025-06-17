/**
 * @file Filters slice para el store de metadata
 * @module store/entities/metadata/slices/filters
 */

import { StateCreator } from 'zustand';
import { MetadataExtended } from '@/types/entities/metadata/extended';
import { MetadataStore } from '..';

// Tipos para filtros
export type SortField = 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height';
export type SortDirection = 'asc' | 'desc';

export interface MetadataFilterOptions {
	format?: string[];
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	colorSpace?: string[];
	hasAlpha?: boolean;
	searchTerm?: string;
}

// Estado
export interface FiltersState {
	// Opciones de filtro
	filterOptions: MetadataFilterOptions;

	// Ordenación
	sortBy: SortField;
	sortDirection: SortDirection;
}

// Acciones
export interface FiltersActions {
	// Setters
	setSortBy: (field: SortField) => void;
	setSortDirection: (direction: SortDirection) => void;
	toggleSortDirection: () => void;

	// Filtros
	setFilterOptions: (options: MetadataFilterOptions) => void;
	updateFilterOption: <K extends keyof MetadataFilterOptions>(key: K, value: MetadataFilterOptions[K]) => void;
	resetFilters: () => void;

	// Selectores
	getFilteredMetadatas: () => MetadataExtended[];
	getFilteredAndSortedMetadatas: () => MetadataExtended[];
}

// Estado inicial
const initialState: FiltersState = {
	filterOptions: {},
	sortBy: 'updatedAt',
	sortDirection: 'desc',
};

// Crear slice
export const createFiltersSlice: StateCreator<MetadataStore, [], [], FiltersState & FiltersActions> = (set, get) => ({
	...initialState,

	// Setters
	setSortBy: (sortBy) => set({ sortBy }),
	setSortDirection: (sortDirection) => set({ sortDirection }),
	toggleSortDirection: () => {
		const { sortDirection } = get();
		set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
	},

	// Filtros
	setFilterOptions: (filterOptions) => set({ filterOptions }),
	updateFilterOption: (key, value) => {
		const { filterOptions } = get();
		set({
			filterOptions: {
				...filterOptions,
				[key]: value,
			},
		});
	},
	resetFilters: () => set({ filterOptions: {} }),

	// Selectores
	getFilteredMetadatas: () => {
		const { metadatas, filterOptions } = get();

		return metadatas.filter((metadata) => {
			// Formato
			if (filterOptions.format && filterOptions.format.length > 0) {
				if (!filterOptions.format.includes(metadata.format)) {
					return false;
				}
			}

			// Dimensiones
			if (filterOptions.minWidth !== undefined && metadata.width < filterOptions.minWidth) {
				return false;
			}
			if (filterOptions.maxWidth !== undefined && metadata.width > filterOptions.maxWidth) {
				return false;
			}
			if (filterOptions.minHeight !== undefined && metadata.height < filterOptions.minHeight) {
				return false;
			}
			if (filterOptions.maxHeight !== undefined && metadata.height > filterOptions.maxHeight) {
				return false;
			}

			// Tamaño
			if (filterOptions.minSize !== undefined && metadata.size < filterOptions.minSize) {
				return false;
			}
			if (filterOptions.maxSize !== undefined && metadata.size > filterOptions.maxSize) {
				return false;
			}

			// Color Space
			if (filterOptions.colorSpace && filterOptions.colorSpace.length > 0) {
				if (!metadata.colorSpace || !filterOptions.colorSpace.includes(metadata.colorSpace)) {
					return false;
				}
			}

			// Alpha
			if (filterOptions.hasAlpha !== undefined) {
				if (metadata.hasAlpha !== filterOptions.hasAlpha) {
					return false;
				}
			}

			// Término de búsqueda (formato, dimensiones)
			if (filterOptions.searchTerm) {
				const searchTerm = filterOptions.searchTerm.toLowerCase();
				const searchableText = `
          ${metadata.format.toLowerCase()}
          ${metadata.dimensions.toLowerCase()}
          ${metadata.colorSpace?.toLowerCase() || ''}
        `;

				if (!searchableText.includes(searchTerm)) {
					return false;
				}
			}

			return true;
		});
	},

	getFilteredAndSortedMetadatas: () => {
		const { sortBy, sortDirection } = get();
		const filteredMetadatas = get().getFilteredMetadatas();

		return [...filteredMetadatas].sort((a, b) => {
			let comparison = 0;

			// Ordenar por el campo específico
			switch (sortBy) {
				case 'createdAt':
				case 'updatedAt':
					comparison = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
					break;
				case 'size':
				case 'width':
				case 'height':
					comparison = a[sortBy] - b[sortBy];
					break;
				default:
					comparison = 0;
			}

			// Aplicar dirección de ordenación
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	},
});
