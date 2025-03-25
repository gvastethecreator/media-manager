/**
 * @file Store principal para la entidad Image
 * @module store/entities/image
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ImageSortCriteria, ImageViewMode } from '../../../types/entities/image';
import { type ImageCoreSlice, createImageCoreSlice } from './slices/core';
import { type ImageFiltersSlice, createImageFiltersSlice } from './slices/filters';
import { type ImageUISlice, createImageUISlice } from './slices/ui';
import type { ImageState } from './types';

// Tipo del store completo
export type ImageStore = ImageCoreSlice & ImageUISlice & ImageFiltersSlice;

// Estado inicial
const initialState: ImageState = {
  core: {
    images: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedIds: [],
    viewMode: ImageViewMode.GRID,
    isViewerOpen: false,
    currentImageId: null,
    highlightedId: null,
    expandedIds: [],
  },
  filters: {
    sortBy: ImageSortCriteria.DATE_DESC,
    searchQuery: '',
    filterByTag: [],
    filterByAlbum: [],
    filterByFolderId: null,
    filterFavorites: false,
    filterPublic: false,
    dateRange: {
      from: null,
      to: null,
    },
  },
};

// Crear store combinando slices
export const useImageStore = create<ImageStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createImageCoreSlice(...a),
        ...createImageUISlice(...a),
        ...createImageFiltersSlice(...a),
      }),
      {
        name: 'image-store',
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
          },
          filters: {
            sortBy: state.filters.sortBy,
          },
        }),
      }
    ),
    { name: 'ImageStore' }
  )
);

// Exportar todo desde types
export * from './types';

// Exportar slices para poder extenderlos
export { createImageCoreSlice } from './slices/core';
export { createImageFiltersSlice } from './slices/filters';
export { createImageUISlice } from './slices/ui';
