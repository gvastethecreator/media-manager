/**
 * @file Slice de UI para el store de Tag
 * @module store/entities/tag/slices/ui
 */

import { TagViewMode } from '@/types/entities/tag/enums';
import type { StateCreator } from 'zustand';
import type { TagState, TagUIState } from '../types';

export interface TagUISlice {
  // Estado
  ui: TagUIState;

  // Acciones de selección
  selectTag: (id: string) => void;
  deselectTag: (id: string) => void;
  toggleTagSelection: (id: string) => void;
  selectMultipleTags: (ids: string[]) => void;
  clearTagsSelection: () => void;

  // Acciones de expansión
  expandTag: (id: string) => void;
  collapseTag: (id: string) => void;
  toggleTagExpansion: (id: string) => void;
  expandMultipleTags: (ids: string[]) => void;
  collapseAllTags: () => void;

  // Acciones de edición
  setEditingTag: (id: string | null) => void;

  // Acciones de resaltado
  highlightTag: (id: string | null) => void;

  // Acciones de visualización
  setViewMode: (mode: TagViewMode) => void;
}

export const createTagUISlice: StateCreator<
  TagState & TagUISlice,
  [],
  [],
  TagUISlice
> = (set, get) => ({
  ui: {
    selectedId: null,
    selectedIds: [],
    expandedIds: [],
    editingId: null,
    highlightedId: null,
    viewMode: TagViewMode.LIST,
  },

  // Acción para seleccionar una etiqueta
  selectTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedId: id,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  // Acción para deseleccionar una etiqueta
  deselectTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
      },
    }));
  },

  // Acción para alternar la selección de una etiqueta
  toggleTagSelection: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.includes(id)
          ? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
          : [...state.ui.selectedIds, id],
      },
    }));
  },

  // Acción para seleccionar múltiples etiquetas
  selectMultipleTags: (ids) => {
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

  // Acción para limpiar la selección de etiquetas
  clearTagsSelection: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [],
      },
    }));
  },

  // Acción para expandir una etiqueta
  expandTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  // Acción para colapsar una etiqueta
  collapseTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
      },
    }));
  },

  // Acción para alternar la expansión de una etiqueta
  toggleTagExpansion: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.includes(id)
          ? state.ui.expandedIds.filter((expandedId) => expandedId !== id)
          : [...state.ui.expandedIds, id],
      },
    }));
  },

  // Acción para expandir múltiples etiquetas
  expandMultipleTags: (ids) => {
    set((state) => {
      const uniqueIds = [...new Set([...state.ui.expandedIds, ...ids])];
      return {
        ui: {
          ...state.ui,
          expandedIds: uniqueIds,
        },
      };
    });
  },

  // Acción para colapsar todas las etiquetas
  collapseAllTags: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [],
      },
    }));
  },

  // Acción para establecer la etiqueta en edición
  setEditingTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        editingId: id,
      },
    }));
  },

  // Acción para resaltar una etiqueta
  highlightTag: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        highlightedId: id,
      },
    }));
  },

  // Acción para establecer el modo de visualización
  setViewMode: (mode) => {
    set((state) => ({
      ui: {
        ...state.ui,
        viewMode: mode,
      },
    }));
  },
});