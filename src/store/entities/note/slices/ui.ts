import { serverLogger } from '@/lib/logger/server-logger';
import { NoteViewMode } from '@/types/entities/note/enums';
import { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const uiLogger = serverLogger.withContext('NoteStore:UI');

export interface UISlice {
  // Estado
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  isDetailsDrawerOpen: boolean;
  viewMode: NoteViewMode;

  // Acciones - modales y diálogos
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openDetailsDrawer: () => void;
  closeDetailsDrawer: () => void;

  // Acciones - vista
  setViewMode: (mode: NoteViewMode) => void;

  // Reset
  resetUI: () => void;
}

// Estado inicial por defecto para UI
const initialUIState = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteDialogOpen: false,
  isDetailsDrawerOpen: false,
  viewMode: NoteViewMode.GRID
};

export const createUISlice: StateCreator<
  NoteStore,
  [],
  [],
  UISlice
> = (set) => ({
  // Estado inicial
  ...initialUIState,

  // Acciones - modales y diálogos
  openCreateModal: () => {
    uiLogger.info('🔍 Abriendo modal de crear nota');
    set({ isCreateModalOpen: true });
  },

  closeCreateModal: () => {
    uiLogger.info('🔍 Cerrando modal de crear nota');
    set({ isCreateModalOpen: false });
  },

  openEditModal: () => {
    uiLogger.info('🔍 Abriendo modal de editar nota');
    set({ isEditModalOpen: true });
  },

  closeEditModal: () => {
    uiLogger.info('🔍 Cerrando modal de editar nota');
    set({ isEditModalOpen: false });
  },

  openDeleteDialog: () => {
    uiLogger.info('🔍 Abriendo diálogo de confirmación de eliminación');
    set({ isDeleteDialogOpen: true });
  },

  closeDeleteDialog: () => {
    uiLogger.info('🔍 Cerrando diálogo de confirmación de eliminación');
    set({ isDeleteDialogOpen: false });
  },

  openDetailsDrawer: () => {
    uiLogger.info('🔍 Abriendo drawer de detalles');
    set({ isDetailsDrawerOpen: true });
  },

  closeDetailsDrawer: () => {
    uiLogger.info('🔍 Cerrando drawer de detalles');
    set({ isDetailsDrawerOpen: false });
  },

  // Acciones - vista
  setViewMode: (mode) => {
    uiLogger.info('👁️ Cambiando modo de vista', { mode });
    set({ viewMode: mode });
  },

  // Reset
  resetUI: () => {
    uiLogger.info('🔄 Reseteando estado de UI');
    set({ ...initialUIState });
  }
});