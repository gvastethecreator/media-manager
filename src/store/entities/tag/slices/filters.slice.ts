/**
 * @file Slice de filtros para el store de Tag
 * @module store/entities/tag/slices/filters.slice
 */

import { StateCreator } from 'zustand';
import type { TagWithStats } from '@/types/entities/tag';
import { TagSortCriteria } from '@/types/entities/tag';
import type { TagCategory, TagStore } from '../types';

/**
 * 🔍 Filtros para tags
 */
export interface TagFilters {
	/** Filtro por categoría */
	category: TagCategory | null;
	/** Filtro por rareza - @deprecated La rareza no es una propiedad del modelo de datos actual. */
	rarity?: string | null;
	/** Término de búsqueda */
	searchTerm: string;
	/** Criterio de ordenación */
	sortBy: TagSortCriteria;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface TagFilterActions {
	/** Limpia todos los filtros */
	clearFilters: () => void;
	/** Obtiene tags filtrados */
	getFilteredTags: () => TagWithStats[];
	/** Obtiene tags filtrados y ordenados */
	getSortedTags: () => TagWithStats[];
	/** Actualiza los filtros */
	updateFilters: (filters: Partial<TagFilters>) => void;
}

/**
 * 🔍 Creador del slice de filtros para el store de Tag
 */
export const createTagFiltersSlice: StateCreator<TagStore, [], [], { filters: TagFilters } & TagFilterActions> = (
	set,
	get
) => ({
	// Estado inicial de filtros
	filters: {
		sortBy: TagSortCriteria.NAME_ASC,
		searchTerm: '',
		category: null,
		rarity: null,
	},

	// Actualiza los filtros
	updateFilters: (filters) => {
		set((state) => ({
			filters: { ...state.filters, ...filters },
		}));
	},

	// Limpia todos los filtros
	clearFilters: () => {
		set({
			filters: {
				sortBy: TagSortCriteria.NAME_ASC,
				searchTerm: '',
				category: null,
				rarity: null,
			},
		});
	},

	// Obtiene tags filtrados
	getFilteredTags: () => {
		const tags = Object.values(get().tags);
		const { searchTerm, category } = get().filters;

		return tags.filter((tag) => {
			// Filtrar por término de búsqueda (en nombre o descripción)
			const matchesSearch = searchTerm
				? tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
				: true;

			// Filtrar por categoría
			const matchesCategory = category === null || tag.category === category;

			// El tag debe cumplir todos los criterios
			return matchesSearch && matchesCategory;
		});
	},

	// Obtiene tags filtrados y ordenados
	getSortedTags: () => {
		const { sortBy } = get().filters;
		const filteredTags = get().getFilteredTags();

		return [...filteredTags].sort((a, b) => {
			switch (sortBy) {
				case TagSortCriteria.NAME_ASC:
					return a.name.localeCompare(b.name);
				case TagSortCriteria.NAME_DESC:
					return b.name.localeCompare(a.name);
				case TagSortCriteria.CREATED_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case TagSortCriteria.CREATED_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case TagSortCriteria.UPDATED_ASC:
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
				case TagSortCriteria.UPDATED_DESC:
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				case TagSortCriteria.USAGE_ASC:
					return a.stats.totalRelations - b.stats.totalRelations;
				case TagSortCriteria.USAGE_DESC:
					return b.stats.totalRelations - a.stats.totalRelations;
				default:
					return 0;
			}
		});
	},
});
