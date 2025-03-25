/**
 * @file Slice para el estado de UI del store de imágenes
 * @module store/entities/image/slices/ui
 */

import type { StateCreator } from 'zustand';
import type { ImageViewMode } from '../../../../types/entities/image';
import type { ImageState } from '../types';

// Slice para estado de UI
export interface ImageUISlice {
  // Selección de imágenes
  selectImage: (id: string) => void;
  deselectImage: (id: string) => void;
  toggleImageSelection: (id: string) => void;
  selectMultipleImages: (ids: string[]) => void;
  clearSelection: () => void;
  getSelectedImages: () => string[];
  isImageSelected: (id: string) => boolean;

  // Visor de imágenes
  openViewer: (imageId: string) => void;
  closeViewer: () => void;
  nextImage: () => void;
  previousImage: () => void;
  isViewerOpen: () => boolean;
  getCurrentImage: () => string | null;

  // Modo de visualización
  setViewMode: (viewMode: ImageViewMode) => void;
  getViewMode: () => ImageViewMode;

  // Expansión de detalles
  expandImage: (id: string) => void;
  collapseImage: (id: string) => void;
  toggleImageExpansion: (id: string) => void;
  isImageExpanded: (id: string) => boolean;

  // Resaltado
  highlightImage: (id: string | null) => void;
  getHighlightedImage: () => string | null;
}

// Creador del slice
export const createImageUISlice: StateCreator<
  ImageState,
  [],
  [],
  ImageUISlice
> = (set, get) => ({
  // Selección de imágenes
  selectImage: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  deselectImage: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
      },
    }));
  },

  toggleImageSelection: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  selectMultipleImages: (ids: string[]) => {
    set((state) => {
      const uniqueIds = [...new Set([...state.ui.selectedIds, ...ids])];
      return {
        ui: {
          ...state.ui,
          selectedIds: uniqueIds,
        },
      };
    });
  },

  clearSelection: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [],
      },
    }));
  },

  getSelectedImages: () => {
    return get().ui.selectedIds;
  },

  isImageSelected: (id: string) => {
    return get().ui.selectedIds.includes(id);
  },

  // Visor de imágenes
  openViewer: (imageId: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        isViewerOpen: true,
        currentImageId: imageId,
      },
    }));
  },

  closeViewer: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        isViewerOpen: false,
      },
    }));
  },

  nextImage: () => {
    const state = get();
    const images = Object.values(state.core.images);
    if (images.length === 0 || !state.ui.currentImageId) return;

    const currentIndex = images.findIndex((img) => img.id === state.ui.currentImageId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % images.length;
    set((state) => ({
      ui: {
        ...state.ui,
        currentImageId: images[nextIndex].id,
      },
    }));
  },

  previousImage: () => {
    const state = get();
    const images = Object.values(state.core.images);
    if (images.length === 0 || !state.ui.currentImageId) return;

    const currentIndex = images.findIndex((img) => img.id === state.ui.currentImageId);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    set((state) => ({
      ui: {
        ...state.ui,
        currentImageId: images[prevIndex].id,
      },
    }));
  },

  isViewerOpen: () => {
    return get().ui.isViewerOpen;
  },

  getCurrentImage: () => {
    return get().ui.currentImageId;
  },

  // Modo de visualización
  setViewMode: (viewMode: ImageViewMode) => {
    set((state) => ({
      ui: {
        ...state.ui,
        viewMode,
      },
    }));
  },

  getViewMode: () => {
    return get().ui.viewMode;
  },

  // Expansión de detalles
  expandImage: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  collapseImage: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
      },
    }));
  },

  toggleImageExpansion: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds.filter((expandedId) => expandedId !== id)
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  isImageExpanded: (id: string) => {
    return get().ui.expandedIds.includes(id);
  },

  // Resaltado
  highlightImage: (id: string | null) => {
    set((state) => ({
      ui: {
        ...state.ui,
        highlightedId: id,
      },
    }));
  },

  getHighlightedImage: () => {
    return get().ui.highlightedId;
  },
});