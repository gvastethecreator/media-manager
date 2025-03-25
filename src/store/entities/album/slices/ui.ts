/**
 * @file Slice para el estado de UI del store de álbumes
 * @module store/entities/album/slices/ui
 */

import type { StateCreator } from 'zustand';
import type {
    AlbumDisplayState,
    AlbumViewMode
} from '../../../../types/entities/album';
import type { AlbumState } from '../types';

// Slice para estado de UI
export interface AlbumUISlice {
  // Selección de álbumes
  selectAlbum: (id: string) => void;
  deselectAlbum: (id: string) => void;
  toggleAlbumSelection: (id: string) => void;
  selectMultipleAlbums: (ids: string[]) => void;
  clearSelection: () => void;
  getSelectedAlbums: () => string[];
  isAlbumSelected: (id: string) => boolean;

  // Visor de álbumes
  openViewer: (albumId: string) => void;
  closeViewer: () => void;
  isViewerOpen: () => boolean;
  getCurrentAlbum: () => string | null;

  // Modo de visualización
  setViewMode: (viewMode: AlbumViewMode) => void;
  getViewMode: () => AlbumViewMode;

  // Estado de visualización
  setAlbumDisplayState: (id: string, state: AlbumDisplayState) => void;
  getAlbumDisplayState: (id: string) => AlbumDisplayState;

  // Expansión de álbumes
  expandAlbum: (id: string) => void;
  collapseAlbum: (id: string) => void;
  toggleAlbumExpansion: (id: string) => void;
  isAlbumExpanded: (id: string) => boolean;
  expandAllAlbums: () => void;
  collapseAllAlbums: () => void;

  // Drag & Drop
  setDraggedAlbum: (id: string | null) => void;
  setDropTargetAlbum: (id: string | null) => void;
  getDraggedAlbum: () => string | null;
  getDropTargetAlbum: () => string | null;

  // Resaltado
  highlightAlbum: (id: string | null) => void;
  getHighlightedAlbum: () => string | null;
}

// Creador del slice
export const createAlbumUISlice: StateCreator<
  AlbumState,
  [],
  [],
  AlbumUISlice
> = (set, get) => ({
  // Selección de álbumes
  selectAlbum: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  deselectAlbum: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
      },
    }));
  },

  toggleAlbumSelection: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  selectMultipleAlbums: (ids: string[]) => {
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

  getSelectedAlbums: () => {
    return get().ui.selectedIds;
  },

  isAlbumSelected: (id: string) => {
    return get().ui.selectedIds.includes(id);
  },

  // Visor de álbumes
  openViewer: (albumId: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        isViewerOpen: true,
        currentAlbumId: albumId,
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

  isViewerOpen: () => {
    return get().ui.isViewerOpen;
  },

  getCurrentAlbum: () => {
    return get().ui.currentAlbumId;
  },

  // Modo de visualización
  setViewMode: (viewMode: AlbumViewMode) => {
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

  // Estado de visualización
  setAlbumDisplayState: (id: string, displayState: AlbumDisplayState) => {
    set((state) => ({
      ui: {
        ...state.ui,
        displayState: {
          ...state.ui.displayState,
          [id]: displayState,
        },
      },
    }));
  },

  getAlbumDisplayState: (id: string) => {
    return get().ui.displayState[id] || "collapsed";
  },

  // Expansión de álbumes
  expandAlbum: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  collapseAlbum: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
      },
    }));
  },

  toggleAlbumExpansion: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds.filter((expandedId) => expandedId !== id)
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  isAlbumExpanded: (id: string) => {
    return get().ui.expandedIds.includes(id);
  },

  expandAllAlbums: () => {
    const albums = get().getAlbums();
    const allIds = albums.map(album => album.id);

    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: allIds,
      },
    }));
  },

  collapseAllAlbums: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [],
      },
    }));
  },

  // Drag & Drop
  setDraggedAlbum: (id: string | null) => {
    set((state) => ({
      ui: {
        ...state.ui,
        draggedAlbumId: id,
      },
    }));
  },

  setDropTargetAlbum: (id: string | null) => {
    set((state) => ({
      ui: {
        ...state.ui,
        dropTargetAlbumId: id,
      },
    }));
  },

  getDraggedAlbum: () => {
    return get().ui.draggedAlbumId;
  },

  getDropTargetAlbum: () => {
    return get().ui.dropTargetAlbumId;
  },

  // Resaltado
  highlightAlbum: (id: string | null) => {
    set((state) => ({
      ui: {
        ...state.ui,
        highlightedId: id,
      },
    }));
  },

  getHighlightedAlbum: () => {
    return get().ui.highlightedId;
  },
});