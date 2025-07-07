/**
 * @file Filters slice para el store de File
 * @module store/entities/file/slices/filters
 */

import { StateCreator } from 'zustand';
import { applyFileFilters } from '@/transformers/file';
import { FileFilterOptions } from '@/types/entities/file/types';
import { FileWithStats } from '@/transformers/file';
import { FileStore } from '..';

// Tipos para filtros
export type SortField = 'name' | 'size' | 'type' | 'createdAt' | 'modifiedAt';
export type SortDirection = 'asc' | 'desc';

// Estado
export interface FiltersState {
	// Opciones de filtro
	filterOptions: FileFilterOptions;

	// Ordenación
	sortBy: SortField;
	sortDirection: SortDirection;

	// Búsqueda
	searchTerm: string;
}

// Acciones
export interface FiltersActions {
	// Setters
	setSortBy: (field: SortField) => void;
	setSortDirection: (direction: SortDirection) => void;
	toggleSortDirection: () => void;

	// Filtros
	setFilterOptions: (options: FileFilterOptions) => void;
	updateFilterOption: <K extends keyof FileFilterOptions>(key: K, value: FileFilterOptions[K]) => void;
	resetFilters: () => void;

	// Búsqueda
	setSearchTerm: (term: string) => void;

	// Selectores
	getFilteredFiles: () => FileWithStats[];
	getFilteredAndSortedFiles: () => FileWithStats[];
}

// Estado inicial
const initialState: FiltersState = {
	filterOptions: {},
	sortBy: 'name',
	sortDirection: 'asc',
	searchTerm: '',
};

// Crear slice
export const createFiltersSlice: StateCreator<FileStore, [], [], FiltersState & FiltersActions> = (set, get) => ({
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
	resetFilters: () =>
		set({
			filterOptions: {},
			searchTerm: '',
			sortBy: 'name',
			sortDirection: 'asc',
		}),

	// Búsqueda
	setSearchTerm: (searchTerm) => set({ searchTerm }),

	// Selectores
	getFilteredFiles: () => {
		const { files, filterOptions, searchTerm } = get();

		let filtered = [...files];

		// Aplicar filtros basados en FileFilterOptions
		filtered = applyFileFilters(filtered, filterOptions);

		// Aplicar búsqueda por término
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(file) =>
					file.name.toLowerCase().includes(term) ||
					file.path.toLowerCase().includes(term) ||
					file.type.toLowerCase().includes(term)
			);
		}

		return filtered;
	},

	getFilteredAndSortedFiles: () => {
		const { sortBy, sortDirection } = get();
		const filteredFiles = get().getFilteredFiles();

		return [...filteredFiles].sort((a, b) => {
			let comparison = 0;

			// Siempre mostrar directorios primero si se ordena por nombre
			if (sortBy === 'name') {
				if (a.isDirectory !== b.isDirectory) {
					return a.isDirectory ? -1 : 1;
				}
			}

			// Ordenar por el campo específico
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'size':
					comparison = (a.size || 0) - (b.size || 0);
					break;
				case 'type':
					comparison = a.type.localeCompare(b.type);
					break;
				case 'createdAt':
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case 'modifiedAt':
					comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
					break;
				default:
					comparison = 0;
			}

			// Aplicar dirección de ordenación
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	},
});
