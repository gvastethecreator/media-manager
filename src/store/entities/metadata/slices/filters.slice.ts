/**
 * @file Filters slice para el store de metadata
 * @module store/entities/metadata/slices/filters
 */

import { StateCreator } from 'zustand';
import { MetadataWithStats } from '@/types/entities/metadata/base';
import { MetadataStore } from '..';

// Tipos para ordenamiento
export type SortField = 'format' | 'width' | 'height' | 'size' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface MetadataFilterOptions {
	colorSpace?: string[];
	format?: string[];
	hasAlpha?: boolean;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;
	minHeight?: number;
	minSize?: number;
	minWidth?: number;
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
	getFilteredAndSortedMetadatas: () => MetadataWithStats[];

	// Selectores
	getFilteredMetadatas: () => MetadataWithStats[];
	resetFilters: () => void;

	// Filtros
	setFilterOptions: (options: MetadataFilterOptions) => void;
	// Setters
	setSortBy: (field: SortField) => void;
	setSortDirection: (direction: SortDirection) => void;
	toggleSortDirection: () => void;
	updateFilterOption: <K extends keyof MetadataFilterOptions>(key: K, value: MetadataFilterOptions[K]) => void;
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
	getFilteredMetadatas: (): MetadataWithStats[] => {
		const { metadatas } = get();
		const { filterOptions } = get();

		return metadatas.filter((metadata) => {
			// Filtro por formato
			if (filterOptions.format && filterOptions.format.length > 0 && !filterOptions.format.includes(metadata.format)) {
				return false;
			}

			// Filtro por dimensiones
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

			// Tamaño - acceder a la propiedad size de la base
			if (filterOptions.minSize !== undefined && metadata.size < filterOptions.minSize) {
				return false;
			}
			if (filterOptions.maxSize !== undefined && metadata.size > filterOptions.maxSize) {
				return false;
			}

			// Filtro por espacio de color
			if (
				filterOptions.colorSpace &&
				filterOptions.colorSpace.length > 0 &&
				!(metadata.colorSpace && filterOptions.colorSpace.includes(metadata.colorSpace))
			) {
				return false;
			}

			// Filtro por canal alfa
			if (filterOptions.hasAlpha !== undefined && metadata.hasAlpha !== filterOptions.hasAlpha) {
				return false;
			}

			// Filtro por búsqueda de texto
			if (filterOptions.searchTerm && filterOptions.searchTerm.trim() !== '') {
				const searchTerm = filterOptions.searchTerm.toLowerCase();
				const searchableText = [metadata.format, metadata.colorSpace, `${metadata.width}x${metadata.height}`]
					.join(' ')
					.toLowerCase();

				if (!searchableText.includes(searchTerm)) {
					return false;
				}
			}

			return true;
		});
	},

	getFilteredAndSortedMetadatas: (): MetadataWithStats[] => {
		const { sortBy, sortDirection } = get();
		const filteredMetadatas = get().getFilteredMetadatas();

		return [...filteredMetadatas].sort((a, b) => {
			let comparison = 0;

			// Ordenar por el campo específico
			switch (sortBy) {
				case 'format':
					comparison = a.format.localeCompare(b.format);
					break;
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
