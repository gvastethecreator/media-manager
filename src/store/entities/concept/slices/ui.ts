import { clientLogger } from '@/lib/logger/client-logger';
import { ConceptViewMode } from '@/types/entities/concept/enums';
import type { StateCreator } from 'zustand';
import type { ConceptStore } from '../types';

const uiLogger = clientLogger.withContext('ConceptStore:UI');

export interface UISlice {
	// Estado
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	viewMode: ConceptViewMode;

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
	setViewMode: (mode: ConceptViewMode) => void;

	// Reset
	resetUI: () => void;
}

// Estado inicial por defecto para UI
const initialUIState = {
	isCreateModalOpen: false,
	isEditModalOpen: false,
	isDeleteDialogOpen: false,
	isDetailsDrawerOpen: false,
	viewMode: ConceptViewMode.GRID,
};

export const createUISlice: StateCreator<ConceptStore, [], [], UISlice> = (set) => ({
	// Estado inicial
	...initialUIState,

	// Acciones - modales y diálogos
	openCreateModal: () => {
		uiLogger.info('🔍 Abriendo modal de crear concepto');
		set({ isCreateModalOpen: true });
	},

	closeCreateModal: () => {
		uiLogger.info('🔍 Cerrando modal de crear concepto');
		set({ isCreateModalOpen: false });
	},

	openEditModal: () => {
		uiLogger.info('🔍 Abriendo modal de editar concepto');
		set({ isEditModalOpen: true });
	},

	closeEditModal: () => {
		uiLogger.info('🔍 Cerrando modal de editar concepto');
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
	},
});
