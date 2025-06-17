/**
 * @file Slice de UI para el store de Tag
 * @module store/entities/tag/slices/ui
 */

import type { StateCreator } from 'zustand';
import { TagViewMode } from '@/types/entities/tag/enums';
import type { TagState, TagUIState } from '../types';

export interface TagUISlice {
	// Estado
	ui: TagUIState;

	// Acciones de selección
	selectTag: (id: string | null) => void;
	deselectTag: (id: string) => void;
	toggleTagSelection: (id: string) => void;
	selectMultipleTags: (ids: string[]) => void;
	clearTagsSelection: () => void;

	// Acciones de expansión
	expandTag: (id: string) => void;
	collapseTag: (id: string) => void;
	toggleTagExpansion: (id: string) => void;
	expandMultipleTags: (ids: string[]) => void;
	collapseAllTags: () => void;

	// Acciones de edición
	setEditingTag: (id: string | null) => void;

	// Acciones de resaltado
	highlightTag: (id: string | null) => void;

	// Acciones de visualización
	setViewMode: (mode: TagViewMode) => void;
}

export const createTagUISlice: StateCreator<TagState & TagUISlice, [], [], TagUISlice> = (set, _get) => ({
	ui: {
		selectedId: null,
		selectedIds: [],
		expandedIds: [],
		editingId: null,
		highlightedId: null,
		viewMode: TagViewMode.LIST,
	},

	// Acción para seleccionar una etiqueta
	selectTag: (id) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			set((state) => ({
				ui: {
					...state.ui,
					selectedId: null,
					selectedIds: [],
				},
			}));
			return;
		}

		// Si id tiene un valor, añadirlo a la selección
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedId: id,
					selectedIds: currentSelectedIds.includes(id) ? currentSelectedIds : [...currentSelectedIds, id],
				},
			};
		});
	},

	// Acción para deseleccionar una etiqueta
	deselectTag: (id) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				},
			};
		});
	},

	// Acción para alternar la selección de una etiqueta
	toggleTagSelection: (id) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.includes(id)
						? currentSelectedIds.filter((selectedId) => selectedId !== id)
						: [...currentSelectedIds, id],
				},
			};
		});
	},

	// Acción para seleccionar múltiples etiquetas
	selectMultipleTags: (ids) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];
			const uniqueIds = [...new Set([...currentSelectedIds, ...ids])];

			return {
				ui: {
					...state.ui,
					selectedIds: uniqueIds,
				},
			};
		});
	},

	// Acción para limpiar la selección de etiquetas
	clearTagsSelection: () => {
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	// Acción para expandir una etiqueta
	expandTag: (id) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.includes(id) ? currentExpandedIds : [...currentExpandedIds, id],
				},
			};
		});
	},

	// Acción para colapsar una etiqueta
	collapseTag: (id) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				},
			};
		});
	},

	// Acción para alternar la expansión de una etiqueta
	toggleTagExpansion: (id) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.includes(id)
						? currentExpandedIds.filter((expandedId) => expandedId !== id)
						: [...currentExpandedIds, id],
				},
			};
		});
	},

	// Acción para expandir múltiples etiquetas
	expandMultipleTags: (ids) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];
			const uniqueIds = [...new Set([...currentExpandedIds, ...ids])];

			return {
				ui: {
					...state.ui,
					expandedIds: uniqueIds,
				},
			};
		});
	},

	// Acción para colapsar todas las etiquetas
	collapseAllTags: () => {
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: [],
			},
		}));
	},

	// Acción para establecer la etiqueta en edición
	setEditingTag: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				editingId: id,
			},
		}));
	},

	// Acción para resaltar una etiqueta
	highlightTag: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	// Acción para establecer el modo de visualización
	setViewMode: (mode) => {
		set((state) => ({
			ui: {
				...state.ui,
				viewMode: mode,
			},
		}));
	},
});
