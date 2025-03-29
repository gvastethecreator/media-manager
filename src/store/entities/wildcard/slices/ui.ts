/**
 * @file Slice de UI para el store de comodines
 * @module store/entities/wildcard/slices/ui
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { WildcardViewMode } from '@/types/entities/wildcard';
import type { StateCreator } from 'zustand';
import type { WildcardState } from '../types';

const uiLogger = serverLogger.withContext('WildcardStore:UI');

// Slice para operaciones de UI
export interface WildcardUISlice {
  // Selección
  selectWildcard: (id: string) => void;
  deselectWildcard: (id: string) => void;
  toggleWildcardSelection: (id: string) => void;
  selectMultipleWildcards: (ids: string[]) => void;
  clearWildcardSelection: () => void;
  isWildcardSelected: (id: string) => boolean;

  // Visor
  openViewer: (wildcardId: string) => void;
  closeViewer: () => void;
  setCurrentWildcard: (wildcardId: string | null) => void;

  // Vista
  setViewMode: (mode: WildcardViewMode) => void;

  // Estados visuales
  setWildcardDisplayState: (wildcardId: string, state: Partial<any>) => void;
  resetWildcardDisplayState: (wildcardId: string) => void;

  // Drag & drop
  setDraggedWildcard: (id: string | null) => void;
  setDropTargetWildcard: (id: string | null) => void;

  // Navegación
  setHighlightedWildcard: (id: string | null) => void;

  // Expansión (para vistas jerárquicas)
  toggleWildcardExpanded: (id: string) => void;
  expandWildcard: (id: string) => void;
  collapseWildcard: (id: string) => void;
  expandAllWildcards: () => void;
  collapseAllWildcards: () => void;

  // Opciones jerárquicas específicas
  expandBranch: (id: string) => void;
  collapseBranch: (id: string) => void;

  // Reset
  resetUI: () => void;
}

// Creador del slice
export const createWildcardUISlice: StateCreator<
  WildcardState,
  [],
  [],
  WildcardUISlice
> = (set, get) => ({
  // Selección
  selectWildcard: (id) => {
    uiLogger.info('🔍 Seleccionando comodín:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [...state.ui.selectedIds, id],
      },
    }));
  },

  deselectWildcard: (id) => {
    uiLogger.info('🔍 Deseleccionando comodín:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
      },
    }));
  },

  toggleWildcardSelection: (id) => {
    const isSelected = get().isWildcardSelected(id);
    uiLogger.info(`🔄 ${isSelected ? 'Deseleccionando' : 'Seleccionando'} comodín:`, id);

    if (isSelected) {
      get().deselectWildcard(id);
    } else {
      get().selectWildcard(id);
    }
  },

  selectMultipleWildcards: (ids) => {
    uiLogger.info('🔍 Seleccionando múltiples comodines:', ids.length);
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [...new Set([...state.ui.selectedIds, ...ids])],
      },
    }));
  },

  clearWildcardSelection: () => {
    uiLogger.info('🧹 Limpiando selección de comodines');
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [],
      },
    }));
  },

  isWildcardSelected: (id) => {
    return get().ui.selectedIds.includes(id);
  },

  // Visor
  openViewer: (wildcardId) => {
    uiLogger.info('👁️ Abriendo visor para comodín:', wildcardId);
    set((state) => ({
      ui: {
        ...state.ui,
        isViewerOpen: true,
        currentWildcardId: wildcardId,
      },
    }));
  },

  closeViewer: () => {
    uiLogger.info('👁️ Cerrando visor de comodines');
    set((state) => ({
      ui: {
        ...state.ui,
        isViewerOpen: false,
      },
    }));
  },

  setCurrentWildcard: (wildcardId) => {
    uiLogger.info('👁️ Cambiando comodín actual a:', wildcardId);
    set((state) => ({
      ui: {
        ...state.ui,
        currentWildcardId: wildcardId,
      },
    }));
  },

  // Vista
  setViewMode: (mode) => {
    uiLogger.info('👁️ Cambiando modo de vista a:', mode);
    set((state) => ({
      ui: {
        ...state.ui,
        viewMode: mode,
      },
    }));
  },

  // Estados visuales
  setWildcardDisplayState: (wildcardId, state) => {
    uiLogger.info('🎨 Actualizando estado visual para comodín:', wildcardId);
    set((state) => ({
      ui: {
        ...state.ui,
        displayState: {
          ...state.ui.displayState,
          [wildcardId]: {
            ...state.ui.displayState[wildcardId],
            ...state,
          },
        },
      },
    }));
  },

  resetWildcardDisplayState: (wildcardId) => {
    uiLogger.info('🧹 Reseteando estado visual para comodín:', wildcardId);
    set((state) => {
      const { [wildcardId]: _, ...rest } = state.ui.displayState;
      return {
        ui: {
          ...state.ui,
          displayState: rest,
        },
      };
    });
  },

  // Drag & drop
  setDraggedWildcard: (id) => {
    uiLogger.info('🖱️ Estableciendo comodín arrastrado:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        draggedWildcardId: id,
      },
    }));
  },

  setDropTargetWildcard: (id) => {
    uiLogger.info('🎯 Estableciendo comodín objetivo para soltar:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        dropTargetWildcardId: id,
      },
    }));
  },

  // Navegación
  setHighlightedWildcard: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        highlightedId: id,
      },
    }));
  },

  // Expansión (para vistas jerárquicas)
  toggleWildcardExpanded: (id) => {
    const isExpanded = get().ui.expandedIds.includes(id);
    uiLogger.info(`🔄 ${isExpanded ? 'Colapsando' : 'Expandiendo'} comodín:`, id);

    if (isExpanded) {
      get().collapseWildcard(id);
    } else {
      get().expandWildcard(id);
    }
  },

  expandWildcard: (id) => {
    uiLogger.info('📂 Expandiendo comodín:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [...state.ui.expandedIds, id],
      },
    }));
  },

  collapseWildcard: (id) => {
    uiLogger.info('📁 Colapsando comodín:', id);
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
      },
    }));
  },

  expandAllWildcards: () => {
    uiLogger.info('📂 Expandiendo todos los comodines');
    const allIds = Object.keys(get().core.wildcards);
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: allIds,
      },
    }));
  },

  collapseAllWildcards: () => {
    uiLogger.info('📁 Colapsando todos los comodines');
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [],
      },
    }));
  },

  // Opciones jerárquicas específicas
  expandBranch: (id) => {
    uiLogger.info('📂 Expandiendo rama del comodín:', id);

    // Obtener todos los IDs en la rama
    const wildcard = get().core.wildcards[id];
    if (!wildcard) return;

    // Array para almacenar todos los IDs de la rama
    const idsToExpand = [id];

    // Función recursiva para obtener todos los hijos
    const getChildrenIds = (parentId: string) => {
      const childWildcards = get().getChildWildcards(parentId);
      for (const child of childWildcards) {
        idsToExpand.push(child.id);
        getChildrenIds(child.id);
      }
    };

    // Comenzar la recursión con el ID actual
    getChildrenIds(id);

    // Establecer todos los IDs como expandidos
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: [...new Set([...state.ui.expandedIds, ...idsToExpand])],
      },
    }));
  },

  collapseBranch: (id) => {
    uiLogger.info('📁 Colapsando rama del comodín:', id);

    // Obtener todos los IDs en la rama
    const wildcard = get().core.wildcards[id];
    if (!wildcard) return;

    // Array para almacenar todos los IDs de la rama
    const idsToCollapse = [id];

    // Función recursiva para obtener todos los hijos
    const getChildrenIds = (parentId: string) => {
      const childWildcards = get().getChildWildcards(parentId);
      for (const child of childWildcards) {
        idsToCollapse.push(child.id);
        getChildrenIds(child.id);
      }
    };

    // Comenzar la recursión con el ID actual
    getChildrenIds(id);

    // Quitar todos los IDs de expandidos
    set((state) => ({
      ui: {
        ...state.ui,
        expandedIds: state.ui.expandedIds.filter((expandedId) => !idsToCollapse.includes(expandedId)),
      },
    }));
  },

  // Reset
  resetUI: () => {
    uiLogger.info('🧹 Reseteando UI de comodines');
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIds: [],
        isViewerOpen: false,
        currentWildcardId: null,
        draggedWildcardId: null,
        dropTargetWildcardId: null,
        highlightedId: null,
      },
    }));
  },
});