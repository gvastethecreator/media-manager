/**
 * @file Slice para el estado de UI del store de grupos
 * @module store/entities/group/slices/ui
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { GroupViewConfig, GroupViewMode, GroupWithStats } from '@/types/entities/group';
import type { GroupDisplayState, GroupStore } from '../types';

const groupLogger = clientLogger.withContext('GroupUI');

// Slice para estado de UI
export interface GroupUISlice {
	// Estado de UI
	selectedIds: string[];
	setSelectedIds: (ids: string[]) => void;
	viewMode: GroupViewMode;
	isViewerOpen: boolean;
	currentGroupId: string | null;
	displayState: Record<string, GroupDisplayState>;
	draggedGroupId: string | null;
	dropTargetGroupId: string | null;
	highlightedId: string | null;
	expandedIds: string[];
	viewConfig: GroupViewConfig;

	// Selección de grupos
	selectGroup: (id: string | null) => void;
	deselectGroup: (id: string) => void;
	toggleGroupSelection: (id: string) => void;
	selectMultipleGroups: (ids: string[]) => void;
	clearSelection: () => void;
	getSelectedGroups: () => string[];
	isGroupSelected: (id: string) => boolean;

	// Visor de grupos
	openViewer: (groupId: string) => void;
	closeViewer: () => void;
	getCurrentGroup: () => GroupWithStats | null;

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
export const createGroupUISlice: StateCreator<GroupStore, [], [], GroupUISlice> = (set, get) => ({
	// Estado inicial de UI
	selectedIds: [],
	viewMode: 'grid' as GroupViewMode,
	isViewerOpen: false,
	currentGroupId: null,
	displayState: {},
	draggedGroupId: null,
	dropTargetGroupId: null,
	highlightedId: null,
	expandedIds: [],
	viewConfig: {
		viewType: 'grid',
		gridColumns: 4,
		cardSize: 'medium',
		sortBy: 'name',
		sortDirection: 'asc',
		showImages: true,
		imageCount: 3,
		enableAnimations: true,
		groupBy: null,
		showStats: true,
		compactView: false,
	},
	setSelectedIds: (ids: string[]) => {
		groupLogger.info('📝 Estableciendo IDs seleccionados:', ids.length);
		set({ selectedIds: ids });
	},

	// Selección de grupos
	selectGroup: (id) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			groupLogger.info('🧹 Limpiando selección de grupos');
			set({ selectedIds: [] });
			return;
		}

		groupLogger.info('🎯 Seleccionando grupo:', id);
		set({ selectedIds: [id] });
	},

	deselectGroup: (id) => {
		groupLogger.info('⭕ Deseleccionando grupo:', id);
		const currentSelectedIds = get().selectedIds || [];
		set({ selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id) });
	},

	toggleGroupSelection: (id) => {
		groupLogger.info('🔄 Alternando selección de grupo:', id);
		const currentSelectedIds = get().selectedIds || [];
		const isSelected = currentSelectedIds.includes(id);
		set({
			selectedIds: isSelected
				? currentSelectedIds.filter((selectedId) => selectedId !== id)
				: [...currentSelectedIds, id],
		});
	},

	selectMultipleGroups: (ids) => {
		groupLogger.info('📑 Seleccionando múltiples grupos:', ids.length);
		const currentSelectedIds = get().selectedIds || [];
		set({ selectedIds: [...new Set([...currentSelectedIds, ...ids])] });
	},

	clearSelection: () => {
		groupLogger.info('🧹 Limpiando selección de grupos');
		set({ selectedIds: [] });
	},

	getSelectedGroups: () => {
		return get().selectedIds || [];
	},

	isGroupSelected: (id) => {
		const selectedIds = get().selectedIds || [];
		return selectedIds.includes(id);
	},

	// Visor de grupos
	openViewer: (groupId) => {
		groupLogger.info('👁️ Abriendo visor para grupo:', groupId);
		set({ isViewerOpen: true, currentGroupId: groupId });
	},

	closeViewer: () => {
		groupLogger.info('🚪 Cerrando visor de grupo');
		set({ isViewerOpen: false, currentGroupId: null });
	},

	getCurrentGroup: () => {
		const currentGroupId = get().currentGroupId;
		if (!currentGroupId) return null;
		const groups = get().groups;
		return groups.find((group) => group.id === currentGroupId) || null;
	},

	// Modo de visualización
	setViewMode: (viewMode) => {
		groupLogger.info('🔍 Cambiando modo de visualización:', viewMode);
		set({ viewMode });
	},

	getViewMode: () => {
		return get().viewMode;
	},

	// Estado de visualización
	setGroupDisplayState: (id, displayState) => {
		set((state) => ({
			displayState: {
				...state.displayState,
				[id]: displayState,
			},
		}));
	},

	getGroupDisplayState: (id) => {
		const state = get().displayState[id];
		if (!state) {
			// Retornar un GroupDisplayState por defecto
			return {
				isExpanded: false,
				isVisible: true,
			};
		}
		return state;
	},

	// Expansión de grupos
	expandGroup: (id) => {
		groupLogger.info('📂 Expandiendo grupo:', id);
		const currentExpandedIds = get().expandedIds || [];
		if (!currentExpandedIds.includes(id)) {
			set({ expandedIds: [...currentExpandedIds, id] });
		}
	},

	collapseGroup: (id) => {
		groupLogger.info('📁 Colapsando grupo:', id);
		const currentExpandedIds = get().expandedIds || [];
		set({ expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id) });
	},

	toggleGroupExpansion: (id) => {
		groupLogger.info('🔄 Alternando expansión de grupo:', id);
		const currentExpandedIds = get().expandedIds || [];
		const isExpanded = currentExpandedIds.includes(id);
		set({
			expandedIds: isExpanded
				? currentExpandedIds.filter((expandedId) => expandedId !== id)
				: [...currentExpandedIds, id],
		});
	},

	isGroupExpanded: (id) => {
		const expandedIds = get().expandedIds || [];
		return expandedIds.includes(id);
	},

	expandAllGroups: () => {
		groupLogger.info('📂 Expandiendo todos los grupos');
		const allGroupIds = get().groups.map((group) => group.id);
		set({ expandedIds: allGroupIds });
	},

	collapseAllGroups: () => {
		groupLogger.info('📁 Colapsando todos los grupos');
		set({ expandedIds: [] });
	},

	// Drag & Drop
	setDraggedGroup: (id) => {
		set({ draggedGroupId: id });
	},

	setDropTargetGroup: (id) => {
		set({ dropTargetGroupId: id });
	},

	getDraggedGroup: () => {
		return get().draggedGroupId;
	},

	getDropTargetGroup: () => {
		return get().dropTargetGroupId;
	},

	// Resaltado
	highlightGroup: (id) => {
		set({ highlightedId: id });
	},

	getHighlightedGroup: () => {
		return get().highlightedId;
	},
});
