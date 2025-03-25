/**
 * @file Store principal para la entidad Tag
 * @module store/entities/tag
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TagSortCriteria, TagViewMode } from '../../../types/entities/tag';
import { type TagCoreSlice, createTagCoreSlice } from './slices/core';
import { type TagFiltersSlice, createTagFiltersSlice } from './slices/filters';
import { type TagUISlice, createTagUISlice } from './slices/ui';
import { type TagState } from './types';

// Tipo del store completo
export type TagStore = TagCoreSlice & TagUISlice & TagFiltersSlice;

// Estado inicial
const initialState: TagState = {
  core: {
    tags: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedIds: [],
    expandedIds: [],
    editingId: null,
    highlightedId: null,
    viewMode: TagViewMode.LIST,
  },
  filters: {
    sortBy: TagSortCriteria.NAME_ASC,
    searchQuery: '',
    showOnlyFavorites: false,
    categories: [],
    rarities: [],
  },
};

// Crear store combinando slices
export const useTagStore = create<TagStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createTagCoreSlice(...a),
        ...createTagUISlice(...a),
        ...createTagFiltersSlice(...a),
      }),
      {
        name: 'tag-store',
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
          },
          filters: {
            sortBy: state.filters.sortBy,
            showOnlyFavorites: state.filters.showOnlyFavorites,
          },
        }),
      }
    ),
    { name: 'TagStore' }
  )
);

// Exportar todo desde types
export * from './types';

// Exportar slices para poder extenderlos
export { createTagCoreSlice } from './slices/core';
export { createTagFiltersSlice } from './slices/filters';
export { createTagUISlice } from './slices/ui';
