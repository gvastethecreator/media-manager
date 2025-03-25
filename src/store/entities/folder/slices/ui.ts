/**
 * @file UI slice para el store de carpetas
 * @module store/entities/folder/slices/ui
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { FolderUISlice } from '../types';

const uiLogger = clientLogger.withContext('FolderStore:UI');

export const createUISlice: FolderUISlice = (set, get) => ({
  uiState: {
    // Estado inicial
    viewMode: 'grid',
    itemSize: 'medium',
    sidebarExpanded: true,
    expandedFolders: [],
    showCreateModal: false,
    showEditModal: false,
    showDeleteModal: false,
  },

  uiActions: {
    // Acciones
    setViewMode: (mode) => {
      const { uiState } = get();
      uiLogger.info(`📊 Cambiando modo de visualización a: ${mode}`);
      set({ uiState: { ...uiState, viewMode: mode } });
    },

    setItemSize: (size) => {
      const { uiState } = get();
      uiLogger.info(`📏 Cambiando tamaño de elementos a: ${size}`);
      set({ uiState: { ...uiState, itemSize: size } });
    },

    toggleSidebar: () => {
      const { uiState } = get();
      const newState = !uiState.sidebarExpanded;
      uiLogger.info(`🔄 ${newState ? 'Expandiendo' : 'Colapsando'} sidebar`);
      set({ uiState: { ...uiState, sidebarExpanded: newState } });
    },

    toggleFolderExpanded: (id) => {
      const { uiState } = get();
      const isExpanded = uiState.expandedFolders.includes(id);

      if (isExpanded) {
        uiLogger.info(`📂 Colapsando carpeta: ${id}`);
        set({
          uiState: {
            ...uiState,
            expandedFolders: uiState.expandedFolders.filter(folderId => folderId !== id)
          }
        });
      } else {
        uiLogger.info(`📂 Expandiendo carpeta: ${id}`);
        set({
          uiState: {
            ...uiState,
            expandedFolders: [...uiState.expandedFolders, id]
          }
        });
      }
    },

    openCreateModal: () => {
      const { uiState } = get();
      uiLogger.info('🆕 Abriendo modal de creación');
      set({ uiState: { ...uiState, showCreateModal: true } });
    },

    closeCreateModal: () => {
      const { uiState } = get();
      uiLogger.info('🚪 Cerrando modal de creación');
      set({ uiState: { ...uiState, showCreateModal: false } });
    },

    openEditModal: () => {
      const { uiState } = get();
      uiLogger.info('✏️ Abriendo modal de edición');
      set({ uiState: { ...uiState, showEditModal: true } });
    },

    closeEditModal: () => {
      const { uiState } = get();
      uiLogger.info('🚪 Cerrando modal de edición');
      set({ uiState: { ...uiState, showEditModal: false } });
    },

    openDeleteModal: () => {
      const { uiState } = get();
      uiLogger.info('🗑️ Abriendo modal de confirmación de eliminación');
      set({ uiState: { ...uiState, showDeleteModal: true } });
    },

    closeDeleteModal: () => {
      const { uiState } = get();
      uiLogger.info('🚪 Cerrando modal de confirmación de eliminación');
      set({ uiState: { ...uiState, showDeleteModal: false } });
    }
  }
});