/**
 * @file Slice de UI para el store de Tag
 * @module store/entities/tag/slices/ui.slice
 */

import { TagViewMode } from '@/types/entities/tag/enums';
import { StateCreator } from 'zustand';
import type { TagStore, TagUIActions, TagUIState } from '../types';

/**
 * 🎨 Creador del slice de UI para el store de Tag
 */
export const createTagUISlice: StateCreator<TagStore, [], [], TagUIState & TagUIActions> = (set) => ({
	// Estado inicial de UI
	selectedId: null,
	selectedIds: [],
	expandedIds: [],
	editingId: null,
	highlightedId: null,
	viewMode: TagViewMode.LIST,
	isCreateModalOpen: false,
	isEditModalOpen: false,
	isDeleteModalOpen: false,

	// Selecciona un tag
	selectTag: (id) => {
		set({
			selectedId: id,
			highlightedId: id,
		});
	},

	// Selecciona múltiples tags
	selectTags: (ids) => {
		set({
			selectedIds: ids,
			selectedId: ids.length === 1 ? ids[0] : null,
		});
	},

	// Limpia la selección
	clearSelection: () => {
		set({
			selectedId: null,
			selectedIds: [],
			highlightedId: null,
		});
	},

	// Inicia edición de un tag
	startEditing: (id) => {
		set({
			editingId: id,
			selectedId: id,
		});
	},

	// Resalta un tag (hover)
	highlightTag: (id) => {
		set({
			highlightedId: id,
		});
	},

	// Cambia el modo de visualización
	setViewMode: (mode) => {
		set({
			viewMode: mode,
		});
	},

	// Abre el modal de crear tag
	openCreateModal: () => {
		set({
			isCreateModalOpen: true,
		});
	},

	// Cierra el modal de crear tag
	closeCreateModal: () => {
		set({
			isCreateModalOpen: false,
		});
	},

	// Abre el modal de editar tag
	openEditModal: (id) => {
		set({
			isEditModalOpen: true,
			editingId: id,
			selectedId: id,
		});
	},

	// Cierra el modal de editar tag
	closeEditModal: () => {
		set({
			isEditModalOpen: false,
			editingId: null,
		});
	},

	// Abre el modal de confirmación de eliminación
	openDeleteModal: (id) => {
		set({
			isDeleteModalOpen: true,
			selectedId: id,
		});
	},

	// Cierra el modal de confirmación de eliminación
	closeDeleteModal: () => {
		set({
			isDeleteModalOpen: false,
		});
	},
});
