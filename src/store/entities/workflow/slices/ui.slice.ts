/**
 * @file Slice de UI para el store de Workflow.
 * @module store/entities/workflow/slices/ui
 * @description Gestiona el estado de la interfaz de usuario para los workflows.
 */

import type { StateCreator } from 'zustand';
import type { WorkflowStore, WorkflowUIActions, WorkflowUIState } from '../types';

const initialState: WorkflowUIState = {
	selectedId: null,
	editingId: null,
	isCreateModalOpen: false,
};

export const createWorkflowUISlice: StateCreator<
	WorkflowStore,
	[['zustand/immer', never]],
	[],
	WorkflowUIState & WorkflowUIActions
> = (set, get) => ({
	...initialState,

	selectWorkflow: id => {
		set(state => {
			state.selectedId = id;
		});
	},

	openCreateModal: () => {
		set(state => {
			state.isCreateModalOpen = true;
		});
	},

	closeCreateModal: () => {
		set(state => {
			state.isCreateModalOpen = false;
		});
	},

	openEditModal: id => {
		set(state => {
			state.editingId = id;
		});
	},

	closeEditModal: () => {
		set(state => {
			state.editingId = null;
		});
	},
});