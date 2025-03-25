import { serverLogger } from '@/lib/logger/server-logger';
import { StateCreator } from 'zustand';
import type { VisualPresetStore, VisualPresetUIActions, VisualPresetUIState } from '../types';

const uiLogger = serverLogger.withContext('VisualPresetStore:UI');

export const createUISlice: StateCreator<
  VisualPresetStore,
  [],
  [],
  VisualPresetUIState & VisualPresetUIActions
> = (set) => ({
  // Estado inicial
  isPresetModalOpen: false,
  isDeleteModalOpen: false,
  isSidebarOpen: true,
  viewMode: 'grid',
  isDarkMode: false,
  selectedTab: 'general',

  // Acciones
  togglePresetModal: () => {
    set(state => {
      const newState = !state.isPresetModalOpen;
      uiLogger.debug(`🔄 Modal de preset ${newState ? 'abierto' : 'cerrado'}`);
      return { isPresetModalOpen: newState };
    });
  },

  openPresetModal: () => {
    uiLogger.debug('🔄 Abriendo modal de preset');
    set({ isPresetModalOpen: true });
  },

  closePresetModal: () => {
    uiLogger.debug('🔄 Cerrando modal de preset');
    set({ isPresetModalOpen: false });
  },

  toggleDeleteModal: () => {
    set(state => {
      const newState = !state.isDeleteModalOpen;
      uiLogger.debug(`🔄 Modal de eliminación ${newState ? 'abierto' : 'cerrado'}`);
      return { isDeleteModalOpen: newState };
    });
  },

  openDeleteModal: () => {
    uiLogger.debug('🔄 Abriendo modal de eliminación');
    set({ isDeleteModalOpen: true });
  },

  closeDeleteModal: () => {
    uiLogger.debug('🔄 Cerrando modal de eliminación');
    set({ isDeleteModalOpen: false });
  },

  toggleSidebar: () => {
    set(state => {
      const newState = !state.isSidebarOpen;
      uiLogger.debug(`🔄 Sidebar ${newState ? 'abierto' : 'cerrado'}`);
      return { isSidebarOpen: newState };
    });
  },

  setViewMode: (mode) => {
    uiLogger.debug(`🔄 Cambiando modo de vista a: ${mode}`);
    set({ viewMode: mode });
  },

  toggleDarkMode: () => {
    set(state => {
      const newState = !state.isDarkMode;
      uiLogger.debug(`🔄 Modo oscuro ${newState ? 'activado' : 'desactivado'}`);
      return { isDarkMode: newState };
    });
  },

  setSelectedTab: (tab) => {
    uiLogger.debug(`🔄 Cambiando pestaña seleccionada a: ${tab}`);
    set({ selectedTab: tab });
  }
});