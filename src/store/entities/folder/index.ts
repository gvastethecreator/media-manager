/**
 * @file Store principal de Folder
 * @module store/entities/folder
 */

import type { FolderStore } from '@/types/entities/folder/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createFolderCoreSlice } from './slices/core.slice';
import { createFolderFiltersSlice } from './slices/filters.slice';
import { createFolderUISlice } from './slices/ui.slice';

/**
 * 📁 Store para gestionar carpetas
 * Implementa el patrón de slices para separar funcionalidades
 */
export const useFolderStore = create<FolderStore>()(
  devtools(
    persist(
      (...a) => ({
        // Combinar todos los slices
        ...createFolderCoreSlice(...a),
        ...createFolderFiltersSlice(...a),
        ...createFolderUISlice(...a),
      }),
      {
        name: 'folder-store',
        // Solo persistir algunas partes del estado
        partialize: (state) => ({
          // Solo persiste filtros y UI (sin selectedIds para evitar estados inconsistentes)
          filters: state.filters,
          ui: {
            viewMode: state.ui.viewMode,
            expandedIds: state.ui.expandedIds,
            selectedIds: [] // 🔧 Siempre resetear selección al persistir
          }
        }),
      }
    ),
    {
      name: 'FolderStore',
      anonymousActionType: 'FolderStore'
    }
  )
);

// Exportaciones

// Store completo
export default useFolderStore;

// Selectores útiles
export const useSelectedFolder = () => useFolderStore(state => state.selected);
export const useFolderItems = () => useFolderStore(state => state.items);
export const useFolderFilters = () => useFolderStore(state => state.filters);
export const useFolderLoading = () => useFolderStore(state => state.isLoading);
export const useFolderError = () => useFolderStore(state => state.error);

// Selectores de UI
export const useFolderUIState = () => useFolderStore(state => state.ui);
export const useFolderViewMode = () => useFolderStore(state => state.ui.viewMode);
export const useFolderSelectedIds = () => useFolderStore(state => state.ui.selectedIds);
export const useFolderExpandedIds = () => useFolderStore(state => state.ui.expandedIds);
export const useFolderModal = () => ({
  isOpen: useFolderStore(state => state.ui.isModalOpen),
  id: useFolderStore(state => state.ui.currentModalId),
  mode: useFolderStore(state => state.ui.modalMode)
});

// Selectores derivados
export const useFilteredFolders = () => useFolderStore(state => state.getFilteredFolders());
export const useSortedFolders = () => useFolderStore(state => state.getSortedFolders());

// Selector para carpeta por ID
export const useFolderById = (id?: string | null) =>
  useFolderStore(state => id ? state.items.find(item => item.id === id) : null);

