/**
 * @file Slice para el estado de UI del store de grupos
 * @module store/entities/group/slices/ui
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { GroupDisplayState, GroupViewMode } from '@/types/entities/group';
import type { StateCreator } from 'zustand';
import type { GroupState } from '../types';

const groupLogger = clientLogger.withContext('GroupUI');

// Slice para estado de UI
export interface GroupUISlice {
	// Selección de grupos
	selectGroup: (id: string) => void;
	deselectGroup: (id: string) => void;
	toggleGroupSelection: (id: string) => void;
	selectMultipleGroups: (ids: string[]) => void;
	clearSelection: () => void;
	getSelectedGroups: () => string[];
	isGroupSelected: (id: string) => boolean;

	// Visor de grupos
	openViewer: (groupId: string) => void;
	closeViewer: () => void;
	isViewerOpen: () => boolean;
	getCurrentGroup: () => string | null;

	// Modo de visualización
	setViewMode: (viewMode: GroupViewMode) => void;
	getViewMode: () => GroupViewMode;

	// Estado de visualización
	setGroupDisplayState: (id: string, state: GroupDisplayState) => void;
	getGroupDisplayState: (id: string) => GroupDisplayState;

	// Expansión de grupos
	expandGroup: (id: string) => void;
	collapseGroup: (id: string) => void;
	toggleGroupExpansion: (id: string) => void;
	isGroupExpanded: (id: string) => boolean;
	expandAllGroups: () => void;
	collapseAllGroups: () => void;

	// Drag & Drop
	setDraggedGroup: (id: string | null) => void;
	setDropTargetGroup: (id: string | null) => void;
	getDraggedGroup: () => string | null;
	getDropTargetGroup: () => string | null;

	// Resaltado
	highlightGroup: (id: string | null) => void;
	getHighlightedGroup: () => string | null;
}

// Creador del slice
export const createGroupUISlice: StateCreator<GroupState, [], [], GroupUISlice> = (set, get) => ({
	// Selección de grupos
	selectGroup: (id) => {
		groupLogger.info('🎯 Seleccionando grupo:', id);
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [id],
			},
		}));
	},

	deselectGroup: (id) => {
		groupLogger.info('⭕ Deseleccionando grupo:', id);
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: state.ui.selectedIds.filter((selectedId) => selectedId !== id),
			},
		}));
	},

	toggleGroupSelection: (id) => {
		groupLogger.info('🔄 Alternando selección de grupo:', id);
		set((state) => {
			const isSelected = state.ui.selectedIds.includes(id);
			return {
				ui: {
					...state.ui,
					selectedIds: isSelected
						? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
						: [...state.ui.selectedIds, id],
				},
			};
		});
	},

	selectMultipleGroups: (ids) => {
		groupLogger.info('📑 Seleccionando múltiples grupos:', ids.length);
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [...new Set([...state.ui.selectedIds, ...ids])],
			},
		}));
	},

	clearSelection: () => {
		groupLogger.info('🧹 Limpiando selección de grupos');
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	getSelectedGroups: () => {
		return get().ui.selectedIds;
	},

	isGroupSelected: (id) => {
		return get().ui.selectedIds.includes(id);
	},

	// Visor de grupos
	openViewer: (groupId) => {
		groupLogger.info('👁️ Abriendo visor para grupo:', groupId);
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: true,
				currentGroupId: groupId,
			},
		}));
	},

	closeViewer: () => {
		groupLogger.info('🚪 Cerrando visor de grupo');
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: false,
				currentGroupId: null,
			},
		}));
	},

	isViewerOpen: () => {
		return get().ui.isViewerOpen;
	},

	getCurrentGroup: () => {
		return get().ui.currentGroupId;
	},

	// Modo de visualización
	setViewMode: (viewMode) => {
		groupLogger.info('🔍 Cambiando modo de visualización:', viewMode);
		set((state) => ({
			ui: {
				...state.ui,
				viewMode,
			},
		}));
	},

	getViewMode: () => {
		return get().ui.viewMode;
	},

	// Estado de visualización
	setGroupDisplayState: (id, state) => {
		set((state) => ({
			ui: {
				...state.ui,
				displayState: {
					...state.ui.displayState,
					[id]: state,
				},
			},
		}));
	},

	getGroupDisplayState: (id) => {
		return get().ui.displayState[id] || { isExpanded: false, isVisible: true };
	},

	// Expansión de grupos
	expandGroup: (id) => {
		groupLogger.info('📂 Expandiendo grupo:', id);
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: state.ui.expandedIds.includes(id) ? state.ui.expandedIds : [...state.ui.expandedIds, id],
			},
		}));
	},

	collapseGroup: (id) => {
		groupLogger.info('📁 Colapsando grupo:', id);
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: state.ui.expandedIds.filter((expandedId) => expandedId !== id),
			},
		}));
	},

	toggleGroupExpansion: (id) => {
		groupLogger.info('🔄 Alternando expansión de grupo:', id);
		set((state) => {
			const isExpanded = state.ui.expandedIds.includes(id);
			return {
				ui: {
					...state.ui,
					expandedIds: isExpanded
						? state.ui.expandedIds.filter((expandedId) => expandedId !== id)
						: [...state.ui.expandedIds, id],
				},
			};
		});
	},

	isGroupExpanded: (id) => {
		return get().ui.expandedIds.includes(id);
	},

	expandAllGroups: () => {
		groupLogger.info('📂 Expandiendo todos los grupos');
		const allGroupIds = Object.keys(get().core.groups);
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: allGroupIds,
			},
		}));
	},

	collapseAllGroups: () => {
		groupLogger.info('📁 Colapsando todos los grupos');
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: [],
			},
		}));
	},

	// Drag & Drop
	setDraggedGroup: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				draggedGroupId: id,
			},
		}));
	},

	setDropTargetGroup: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				dropTargetGroupId: id,
			},
		}));
	},

	getDraggedGroup: () => {
		return get().ui.draggedGroupId;
	},

	getDropTargetGroup: () => {
		return get().ui.dropTargetGroupId;
	},

	// Resaltado
	highlightGroup: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	getHighlightedGroup: () => {
		return get().ui.highlightedId;
	},
});
