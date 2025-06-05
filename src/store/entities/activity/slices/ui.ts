/**
 * @file Slice para controlar el estado de la UI del store de actividades
 * @module store/entities/activity/slices/ui
 */

import type { StateCreator } from 'zustand';
import type { ActivityState } from '../types';

/**
 * Slice para controlar el estado de la UI
 */
export interface ActivityUISlice {
	// Selección
	selectActivity: (id: string | null) => void;
	unselectActivity: (id: string) => void;
	toggleActivitySelection: (id: string) => void;
	selectMultipleActivities: (ids: string[]) => void;
	clearSelection: () => void;

	// Expansión de detalles
	expandActivity: (id: string) => void;
	collapseActivity: (id: string) => void;
	toggleActivityExpansion: (id: string) => void;
	collapseAllActivities: () => void;

	// Detalle modal
	openDetailModal: (id: string) => void;
	closeDetailModal: () => void;

	// Resaltado
	highlightActivity: (id: string | null) => void;

	// Agrupación
	toggleGroupByDate: () => void;
	setGroupByDate: (groupByDate: boolean) => void;

	// Getters
	isActivitySelected: (id: string) => boolean;
	isActivityExpanded: (id: string) => boolean;
}

/**
 * Creador del slice de UI
 */
export const createActivityUISlice: StateCreator<ActivityState, [], [], ActivityUISlice> = (set, get) => ({
	// Funciones de selección
	selectActivity: (id: string | null) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			set((state) => ({
				ui: {
					...state.ui,
					selectedIds: [],
				},
			}));
			return;
		}

		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];
			if (currentSelectedIds.includes(id)) return state;

			return {
				ui: {
					...state.ui,
					selectedIds: [...currentSelectedIds, id],
				},
			};
		});
	},

	unselectActivity: (id: string) => {
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

	toggleActivitySelection: (id: string) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const selectedIds = state.ui.selectedIds || [];
			const isSelected = selectedIds.includes(id);

			return {
				ui: {
					...state.ui,
					selectedIds: isSelected ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id],
				},
			};
		});
	},

	selectMultipleActivities: (ids: string[]) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			// Filtrar para no tener duplicados
			const uniqueIds = [...new Set([...currentSelectedIds, ...ids])];
			return {
				ui: {
					...state.ui,
					selectedIds: uniqueIds,
				},
			};
		});
	},

	clearSelection: () => {
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	// Funciones de expansión
	expandActivity: (id: string) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];
			if (currentExpandedIds.includes(id)) return state;

			return {
				ui: {
					...state.ui,
					expandedIds: [...currentExpandedIds, id],
				},
			};
		});
	},

	collapseActivity: (id: string) => {
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

	toggleActivityExpansion: (id: string) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const expandedIds = state.ui.expandedIds || [];
			const isExpanded = expandedIds.includes(id);

			return {
				ui: {
					...state.ui,
					expandedIds: isExpanded ? expandedIds.filter((expandedId) => expandedId !== id) : [...expandedIds, id],
				},
			};
		});
	},

	collapseAllActivities: () => {
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: [],
			},
		}));
	},

	// Funciones de detalle modal
	openDetailModal: (id: string) => {
		set((state) => ({
			ui: {
				...state.ui,
				detailActivityId: id,
				isDetailModalOpen: true,
			},
		}));
	},

	closeDetailModal: () => {
		set((state) => ({
			ui: {
				...state.ui,
				isDetailModalOpen: false,
			},
		}));
	},

	// Funciones de resaltado
	highlightActivity: (id: string | null) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	// Funciones de agrupación
	toggleGroupByDate: () => {
		set((state) => ({
			ui: {
				...state.ui,
				groupByDate: !state.ui.groupByDate,
			},
		}));
	},

	setGroupByDate: (groupByDate: boolean) => {
		set((state) => ({
			ui: {
				...state.ui,
				groupByDate,
			},
		}));
	},

	// Getters
	isActivitySelected: (id: string) => {
		// Asegurarse de que selectedIds está inicializado
		const selectedIds = get().ui.selectedIds || [];
		return selectedIds.includes(id);
	},

	isActivityExpanded: (id: string) => {
		// Asegurarse de que expandedIds está inicializado
		const expandedIds = get().ui.expandedIds || [];
		return expandedIds.includes(id);
	},
});
