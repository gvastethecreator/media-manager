/**
 * @file Store principal para la entidad Album
 * @module store/entities/album
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
	AlbumSortCriteria,
	AlbumViewMode
} from '../../../types/entities/album';
import { type AlbumCoreSlice, createAlbumCoreSlice } from './slices/core';
import { type AlbumFiltersSlice, createAlbumFiltersSlice } from './slices/filters';
import { type AlbumUISlice, createAlbumUISlice } from './slices/ui';
import { type AlbumState } from './types';

// Combinación de todos los slices
export type AlbumStore = AlbumState & AlbumCoreSlice & AlbumUISlice & AlbumFiltersSlice;

// Estado inicial
const initialState: AlbumState = {
  core: {
    albums: {},
    albumItems: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedIds: [],
    viewMode: AlbumViewMode.GRID,
    isViewerOpen: false,
    currentAlbumId: null,
    displayState: {},
    draggedAlbumId: null,
    dropTargetAlbumId: null,
    highlightedId: null,
    expandedIds: [],
  },
  filters: {
    sortBy: AlbumSortCriteria.DATE_CREATED_DESC,
    searchQuery: '',
    filterByType: null,
    filterByParentId: null,
    filterFavorites: false,
    filterShared: false,
    filterArchived: false,
    dateRange: {
      from: null,
      to: null,
    },
  },
};

// Crear store combinando slices
export const useAlbumStore = create<AlbumStore>()(
  devtools(
    persist(
      (set, get, ...rest) => ({
        ...initialState,
        ...createAlbumCoreSlice(set, get, ...rest),
        ...createAlbumUISlice(set, get, ...rest),
        ...createAlbumFiltersSlice(set, get, ...rest),
      }),
      {
        name: 'album-store',
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
            expandedIds: state.ui.expandedIds,
          },
          filters: {
            sortBy: state.filters.sortBy,
          },
        }),
      }
    ),
    { name: 'AlbumStore' }
  )
);

// Exportar todo desde types
export * from './types';

// Exportar slices para poder extenderlos
export { createAlbumCoreSlice } from './slices/core';
export { createAlbumFiltersSlice } from './slices/filters';
export { createAlbumUISlice } from './slices/ui';

