/**
 * @file Slice para el manejo de filtros en el store de actividades
 * @module store/entities/activity/slices/filters
 */

import { StateCreator } from 'zustand';
import {
    ActivityCategory,
    type ActivityFilters,
    ActivitySortCriteria
} from '../../../../types/entities/activity';
import { ActivityState } from '../types';

/**
 * Slice para controlar el estado de filtros
 */
export interface ActivityFiltersSlice {
  // Ordenación
  setSortCriteria: (criteria: ActivitySortCriteria) => void;

  // Filtros de búsqueda
  setSearchQuery: (query: string) => void;

  // Filtros de categoría
  addCategoryFilter: (category: ActivityCategory) => void;
  removeCategoryFilter: (category: ActivityCategory) => void;
  toggleCategoryFilter: (category: ActivityCategory) => void;
  clearCategoryFilters: () => void;
  setCategoryFilters: (categories: ActivityCategory[]) => void;

  // Filtros de fecha
  setDateRange: (from: Date | null, to: Date | null) => void;
  clearDateRange: () => void;

  // Filtros especiales
  setAlertFilter: (onlyAlerts: boolean) => void;
  setImageIdFilter: (imageId: string | null) => void;

  // Reseteo de filtros
  resetAllFilters: () => void;

  // Utilidades
  buildActivityFilters: () => ActivityFilters;
}

/**
 * Creador del slice de filtros
 */
export const createActivityFiltersSlice: StateCreator<
  ActivityState,
  [],
  [],
  ActivityFiltersSlice
> = (set, get) => ({
  // Ordenación
  setSortCriteria: (criteria: ActivitySortCriteria) => {
    set((state) => ({
      filters: {
        ...state.filters,
        sortBy: criteria,
      },
    }));
  },

  // Filtros de búsqueda
  setSearchQuery: (query: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: query,
      },
    }));
  },

  // Filtros de categoría
  addCategoryFilter: (category: ActivityCategory) => {
    set((state) => {
      if (state.filters.selectedCategories.includes(category)) return state;
      return {
        filters: {
          ...state.filters,
          selectedCategories: [...state.filters.selectedCategories, category],
        },
      };
    });
  },

  removeCategoryFilter: (category: ActivityCategory) => {
    set((state) => ({
      filters: {
        ...state.filters,
        selectedCategories: state.filters.selectedCategories.filter(
          (cat) => cat !== category
        ),
      },
    }));
  },

  toggleCategoryFilter: (category: ActivityCategory) => {
    set((state) => {
      const { selectedCategories } = state.filters;
      const isSelected = selectedCategories.includes(category);

      return {
        filters: {
          ...state.filters,
          selectedCategories: isSelected
            ? selectedCategories.filter((cat) => cat !== category)
            : [...selectedCategories, category],
        },
      };
    });
  },

  clearCategoryFilters: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        selectedCategories: [],
      },
    }));
  },

  setCategoryFilters: (categories: ActivityCategory[]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        selectedCategories: categories,
      },
    }));
  },

  // Filtros de fecha
  setDateRange: (from: Date | null, to: Date | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: {
          from,
          to,
        },
      },
    }));
  },

  clearDateRange: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: {
          from: null,
          to: null,
        },
      },
    }));
  },

  // Filtros especiales
  setAlertFilter: (onlyAlerts: boolean) => {
    set((state) => ({
      filters: {
        ...state.filters,
        onlyAlerts,
      },
    }));
  },

  setImageIdFilter: (imageId: string | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByImageId: imageId,
      },
    }));
  },

  // Reseteo de filtros
  resetAllFilters: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        sortBy: ActivitySortCriteria.DATE_DESC,
        searchQuery: '',
        selectedCategories: [],
        onlyAlerts: false,
        dateRange: {
          from: null,
          to: null,
        },
        filterByImageId: null,
      },
    }));
  },

  // Utilidades
  buildActivityFilters: () => {
    const state = get();
    const { filters } = state;

    // Tipos de actividad derivados de las categorías seleccionadas
    // TODO: Implementar mapeo de categorías a tipos cuando se necesite
    // Por ahora, no incluimos tipos específicos

    const activityFilters: ActivityFilters = {
      searchQuery: filters.searchQuery || undefined,
      imageId: filters.filterByImageId || undefined,
    };

    // Añadir filtro de fechas si está definido
    if (filters.dateRange.from || filters.dateRange.to) {
      if (filters.dateRange.from) {
        activityFilters.startDate = filters.dateRange.from;
      }
      if (filters.dateRange.to) {
        activityFilters.endDate = filters.dateRange.to;
      }
    }

    // Valores predeterminados para paginación
    activityFilters.limit = 20;
    activityFilters.offset = 0;

    return activityFilters;
  },
});