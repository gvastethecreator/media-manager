/**
 * @file Slice de UI para el store de Property.
 * @module store/entities/property/slices/ui
 * @description Gestiona el estado de la interfaz de usuario para las propiedades.
 */

import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { PropertyStore, PropertyUIActions, PropertyUIState, PropertyViewMode } from '../types';

const initialState: PropertyUIState = {
	selectedId: null,
	editingId: null,
	highlightedId: null,
	viewMode: 'grid' as PropertyViewMode,
	isCreateModalOpen: false,
	isEditModalOpen: false,
	isDeleteModalOpen: false,
};

export const createPropertyUISlice: StateCreator<
	PropertyStore,
	[['zustand/immer', never]],
	[],
	PropertyUIState & PropertyUIActions
> = (set, _get) => ({
	...initialState,

	selectProperty: (id) => {
		set(
			produce((draft) => {
				draft.selectedId = id;
			})
		);
	},

	startEditing: (id) => {
		set(
			produce((draft) => {
				draft.editingId = id;
				if (id) {
					draft.isEditModalOpen = true;
				}
			})
		);
	},

	highlightProperty: (id) => {
		set(
			produce((draft) => {
				draft.highlightedId = id;
			})
		);
	},

	setViewMode: (mode) => {
		set(
			produce((draft) => {
				draft.viewMode = mode;
			})
		);
	},

	openCreateModal: () => {
		set(
			produce((draft) => {
				draft.isCreateModalOpen = true;
			})
		);
	},

	closeCreateModal: () => {
		set(
			produce((draft) => {
				draft.isCreateModalOpen = false;
			})
		);
	},

	openEditModal: (id) => {
		set(
			produce((draft) => {
				draft.editingId = id;
				draft.isEditModalOpen = true;
			})
		);
	},

	closeEditModal: () => {
		set(
			produce((draft) => {
				draft.editingId = null;
				draft.isEditModalOpen = false;
			})
		);
	},

	openDeleteModal: (id) => {
		set(
			produce((draft) => {
				draft.selectedId = id; // O el ID que se va a borrar
				draft.isDeleteModalOpen = true;
			})
		);
	},

	closeDeleteModal: () => {
		set(
			produce((draft) => {
				draft.isDeleteModalOpen = false;
			})
		);
	},
});
