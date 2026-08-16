import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { PromptViewMode } from '@/types/entities/prompt';
import type { PromptStore } from '../types';

const uiLogger = clientLogger.withContext('PromptStore:UI');

export interface UISlice {
	closeCreateModal: () => void;
	closeDeleteDialog: () => void;
	closeDetailsDrawer: () => void;
	closeEditModal: () => void;
	closeExecuteModal: () => void;
	isCreateModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	isEditModalOpen: boolean;
	isExecuteModalOpen: boolean;
	openCreateModal: () => void;
	openDeleteDialog: () => void;
	openDetailsDrawer: () => void;
	openEditModal: () => void;
	openExecuteModal: () => void;
	resetUI: () => void;

	// Acciones
	setViewMode: (viewMode: PromptViewMode) => void;
	// Estado
	viewMode: PromptViewMode;
}

export const createUISlice: StateCreator<PromptStore, [], [], UISlice> = (set) => ({
	// Estado inicial
	viewMode: PromptViewMode.GRID,
	isCreateModalOpen: false,
	isEditModalOpen: false,
	isDeleteDialogOpen: false,
	isDetailsDrawerOpen: false,
	isExecuteModalOpen: false,

	// Acciones
	setViewMode: (viewMode) => {
		uiLogger.info('🎯 Cambiando modo de vista:', viewMode);
		set({ viewMode });
	},

	openCreateModal: () => {
		uiLogger.info('✨ Abriendo modal de creación');
		set({ isCreateModalOpen: true });
	},

	closeCreateModal: () => {
		uiLogger.info('❌ Cerrando modal de creación');
		set({ isCreateModalOpen: false });
	},

	openEditModal: () => {
		uiLogger.info('✏️ Abriendo modal de edición');
		set({ isEditModalOpen: true });
	},

	closeEditModal: () => {
		uiLogger.info('❌ Cerrando modal de edición');
		set({ isEditModalOpen: false });
	},

	openDeleteDialog: () => {
		uiLogger.info('🗑️ Abriendo diálogo de eliminación');
		set({ isDeleteDialogOpen: true });
	},

	closeDeleteDialog: () => {
		uiLogger.info('❌ Cerrando diálogo de eliminación');
		set({ isDeleteDialogOpen: false });
	},

	openDetailsDrawer: () => {
		uiLogger.info('ℹ️ Abriendo panel de detalles');
		set({ isDetailsDrawerOpen: true });
	},

	closeDetailsDrawer: () => {
		uiLogger.info('❌ Cerrando panel de detalles');
		set({ isDetailsDrawerOpen: false });
	},

	openExecuteModal: () => {
		uiLogger.info('🚀 Abriendo modal de ejecución');
		set({ isExecuteModalOpen: true });
	},

	closeExecuteModal: () => {
		uiLogger.info('❌ Cerrando modal de ejecución');
		set({ isExecuteModalOpen: false });
	},

	resetUI: () => {
		uiLogger.info('🔄 Reseteando estado de UI');
		set({
			isCreateModalOpen: false,
			isEditModalOpen: false,
			isDeleteDialogOpen: false,
			isDetailsDrawerOpen: false,
			isExecuteModalOpen: false,
		});
	},
});
