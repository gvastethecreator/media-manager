/**
 * @file Slice de filters para el store de comodines
 * @module store/entities/wildcard/slices/filters
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { WildcardSortCriteria } from '@/types/entities/wildcard';
import type { StateCreator } from 'zustand';
import type { WildcardState } from '../types';

const filtersLogger = serverLogger.withContext('WildcardStore:Filters');

// Slice para operaciones de filtrado
export interface WildcardFiltersSlice {
  // Filtros básicos
  setSearchQuery: (query: string) => void;
  setFilterByCategory: (category: string | null) => void;
  setFilterFavorites: (filterFavorites: boolean) => void;

  // Filtros específicos para jerarquía
  setParentId: (parentId: string | null) => void;
  setOnlyWithChildren: (onlyWithChildren: boolean) => void;

  // Ordenación
  setSortBy: (sortBy: WildcardSortCriteria) => void;

  // Fecha
  setDateRange: (from: Date | null, to: Date | null) => void;
  clearDateRange: () => void;

  // Reset
  resetFilters: () => void;
}

// Creador del slice
export const createWildcardFiltersSlice: StateCreator<
  WildcardState,
  [],
  [],
  WildcardFiltersSlice
> = (set) => ({
  // Filtros básicos
  setSearchQuery: (query) => {
    filtersLogger.info('🔍 Estableciendo término de búsqueda:', query);
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: query,
      },
    }));
  },

  setFilterByCategory: (category) => {
    filtersLogger.info('🏷️ Filtrando por categoría:', category);
    set((state) => ({
      filters: {
        ...state.filters,
        filterByCategory: category,
      },
    }));
  },

  setFilterFavorites: (filterFavorites) => {
    filtersLogger.info('⭐ Filtrando favoritos:', filterFavorites);
    set((state) => ({
      filters: {
        ...state.filters,
        filterFavorites,
      },
    }));
  },

  // Filtros específicos para jerarquía
  setParentId: (parentId) => {
    filtersLogger.info('👪 Filtrando por padre:', parentId);
    set((state) => ({
      filters: {
        ...state.filters,
        parentId,
      },
    }));
  },

  setOnlyWithChildren: (onlyWithChildren) => {
    filtersLogger.info('👨‍👩‍👧‍👦 Filtrando solo con hijos:', onlyWithChildren);
    set((state) => ({
      filters: {
        ...state.filters,
        onlyWithChildren,
      },
    }));
  },

  // Ordenación
  setSortBy: (sortBy) => {
    filtersLogger.info('📊 Estableciendo criterio de ordenación:', sortBy);
    set((state) => ({
      filters: {
        ...state.filters,
        sortBy,
      },
    }));
  },

  // Fecha
  setDateRange: (from, to) => {
    filtersLogger.info('📅 Estableciendo rango de fechas:', { from, to });
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
    filtersLogger.info('🧹 Limpiando rango de fechas');
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

  // Reset
  resetFilters: () => {
    filtersLogger.info('🧹 Reseteando filtros');
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: '',
        filterByCategory: null,
        filterFavorites: false,
        parentId: null,
        onlyWithChildren: false,
        dateRange: {
          from: null,
          to: null,
        },
      },
    }));
  },
});