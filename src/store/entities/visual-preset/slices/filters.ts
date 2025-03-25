import { serverLogger } from '@/lib/logger/server-logger';
import { StateCreator } from 'zustand';
import type { VisualPresetFiltersActions, VisualPresetFiltersState, VisualPresetStore } from '../types';

const filtersLogger = serverLogger.withContext('VisualPresetStore:Filters');

export const createFiltersSlice: StateCreator<
  VisualPresetStore,
  [],
  [],
  VisualPresetFiltersState & VisualPresetFiltersActions
> = (set) => ({
  // Estado inicial
  searchTerm: '',
  filterCategory: [],
  filterTag: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',

  // Acciones
  setSearchTerm: (term) => {
    filtersLogger.debug(`🔍 Estableciendo término de búsqueda: ${term}`);
    set({ searchTerm: term });
  },

  clearSearchTerm: () => {
    filtersLogger.debug('🔍 Limpiando término de búsqueda');
    set({ searchTerm: '' });
  },

  addFilterCategory: (category) => {
    set(state => {
      if (state.filterCategory.includes(category)) {
        filtersLogger.debug(`🏷️ Categoría ya existe en el filtro: ${category}`);
        return state;
      }

      filtersLogger.debug(`🏷️ Añadiendo categoría al filtro: ${category}`);
      return { filterCategory: [...state.filterCategory, category] };
    });
  },

  removeFilterCategory: (category) => {
    set(state => {
      filtersLogger.debug(`🏷️ Eliminando categoría del filtro: ${category}`);
      return {
        filterCategory: state.filterCategory.filter(c => c !== category)
      };
    });
  },

  clearFilterCategories: () => {
    filtersLogger.debug('🏷️ Limpiando todas las categorías del filtro');
    set({ filterCategory: [] });
  },

  addFilterTag: (tag) => {
    set(state => {
      if (state.filterTag.includes(tag)) {
        filtersLogger.debug(`🏷️ Etiqueta ya existe en el filtro: ${tag}`);
        return state;
      }

      filtersLogger.debug(`🏷️ Añadiendo etiqueta al filtro: ${tag}`);
      return { filterTag: [...state.filterTag, tag] };
    });
  },

  removeFilterTag: (tag) => {
    set(state => {
      filtersLogger.debug(`🏷️ Eliminando etiqueta del filtro: ${tag}`);
      return {
        filterTag: state.filterTag.filter(t => t !== tag)
      };
    });
  },

  clearFilterTags: () => {
    filtersLogger.debug('🏷️ Limpiando todas las etiquetas del filtro');
    set({ filterTag: [] });
  },

  setSortBy: (sortBy) => {
    filtersLogger.debug(`📊 Estableciendo ordenación por: ${sortBy}`);
    set({ sortBy });
  },

  setSortOrder: (sortOrder) => {
    filtersLogger.debug(`📊 Estableciendo orden de clasificación: ${sortOrder}`);
    set({ sortOrder });
  },

  resetAllFilters: () => {
    filtersLogger.debug('🔄 Reseteando todos los filtros');
    set({
      searchTerm: '',
      filterCategory: [],
      filterTag: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }
});