/**
 * @file Slice para controlar el estado de la UI del store de actividades
 * @module store/entities/activity/slices/ui
 */

import { StateCreator } from 'zustand';
import { ActivityState } from '../types';

/**
 * Slice para controlar el estado de la UI
 */
export interface ActivityUISlice {
  // Selección
  selectActivity: (id: string) => void;
  unselectActivity: (id: string) => void;
  toggleActivitySelection: (id: string) => void;
  selectMultipleActivities: (ids: string[]) => void;
  clearSelection: () => void;

  // Expansión de detalles
  expandActivity: (id: string) => void;
  collapseActivity: (id: string) => void;
  toggleActivityExpansion: (id: string) => void;
  collapseAllActivities: () => void;

  // Detalle modal
  openDetailModal: (id: string) => void;
  closeDetailModal: () => void;

  // Resaltado
  highlightActivity: (id: string | null) => void;

  // Agrupación
  toggleGroupByDate: () => void;
  setGroupByDate: (groupByDate: boolean) => void;

  // Getters
  isActivitySelected: (id: string) => boolean;
  isActivityExpanded: (id: string) => boolean;
}

/**
 * Creador del slice de UI
 */
export const createActivityUISlice: StateCreator<
  ActivityState,
  [],
  [],
  ActivityUISlice
> = (set, get) => ({
  // Funciones de selección
  selectActivity: (id: string) => {
    set((state) => {
      if (state.ui.selectedIds.includes(id)) return state;
      return {
        ui: {
          ...state.ui,
          selectedIds: [...state.ui.selectedIds, id],
        },
      };
    });
  },

  unselectActivity: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
      },
    }));
  },

  toggleActivitySelection: (id: string) => {
    set((state) => {
      const { selectedIds } = state.ui;
      const isSelected = selectedIds.includes(id);

      return {
        ui: {
          ...state.ui,
          selectedIds: isSelected
            ? selectedIds.filter((selectedId) => selectedId !== id)
            : [...selectedIds, id],
        },
      };
    });
  },

  selectMultipleActivities: (ids: string[]) => {
    set((state) => {
      // Filtrar para no tener duplicados
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

  // Funciones de expansión
  expandActivity: (id: string) => {
    set((state) => {
      if (state.ui.expandedIds.includes(id)) return state;
      return {
        ui: {
          ...state.ui,
          expandedIds: [...state.ui.expandedIds, id],
        },
      };
    });
  },

  collapseActivity: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
      },
    }));
  },

  toggleActivityExpansion: (id: string) => {
    set((state) => {
      const { expandedIds } = state.ui;
      const isExpanded = expandedIds.includes(id);

      return {
        ui: {
          ...state.ui,
          expandedIds: isExpanded
            ? expandedIds.filter((expandedId) => expandedId !== id)
            : [...expandedIds, id],
        },
      };
    });
  },

  collapseAllActivities: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [],
      },
    }));
  },

  // Funciones de detalle modal
  openDetailModal: (id: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        detailActivityId: id,
        isDetailModalOpen: true,
      },
    }));
  },

  closeDetailModal: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        isDetailModalOpen: false,
      },
    }));
  },

  // Funciones de resaltado
  highlightActivity: (id: string | null) => {
    set((state) => ({
      ui: {
        ...state.ui,
        highlightedId: id,
      },
    }));
  },

  // Funciones de agrupación
  toggleGroupByDate: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        groupByDate: !state.ui.groupByDate,
      },
    }));
  },

  setGroupByDate: (groupByDate: boolean) => {
    set((state) => ({
      ui: {
        ...state.ui,
        groupByDate,
      },
    }));
  },

  // Getters
  isActivitySelected: (id: string) => {
    return get().ui.selectedIds.includes(id);
  },

  isActivityExpanded: (id: string) => {
    return get().ui.expandedIds.includes(id);
  },
});