/**
 * @file Slice de filtros para el store de Tag
 * @module store/entities/tag/slices/filters.slice
 */

import { TagSortCriteria } from '@/types/entities/tag/enums';
import { StateCreator } from 'zustand';
import type { TagFilterActions, TagFilters, TagStore } from '../types';

/**
 * 🔍 Creador del slice de filtros para el store de Tag
 */
export const createTagFiltersSlice: StateCreator<
  TagStore,
  [],
  [],
  { filters: TagFilters } & TagFilterActions
> = (set, get) => ({
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
    const { items } = get();
    const { searchTerm, category, rarity } = get().filters;

    return items.filter((tag) => {
      // Filtrar por término de búsqueda (en nombre o descripción)
      const matchesSearch = !searchTerm
        ? true
        : tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tag.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrar por categoría
      const matchesCategory = category === null || tag.category === category;

      // Filtrar por rareza
      const matchesRarity = rarity === null || tag.rarity === rarity;

      // El tag debe cumplir todos los criterios
      return matchesSearch && matchesCategory && matchesRarity;
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
          return (a._count?.images || 0) - (b._count?.images || 0);

        case TagSortCriteria.USAGE_DESC:
          return (b._count?.images || 0) - (a._count?.images || 0);

        default:
          return 0;
      }
    });
  },
});