/**
 * @file Slice de UI para el store de comodines
 * @module store/entities/wildcard/slices/ui
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { WildcardViewMode } from '@/types/entities/wildcard';
import type { WildcardDisplayState, WildcardState } from '../types';
import type { WildcardCoreSlice } from './core';

const uiLogger = clientLogger.withContext('WildcardStore:UI');

// Slice para operaciones de UI
export interface WildcardUISlice {
	clearWildcardSelection: () => void;
	closeViewer: () => void;
	collapseAllWildcards: () => void;
	collapseBranch: (id: string) => void;
	collapseWildcard: (id: string) => void;
	deselectWildcard: (id: string) => void;
	expandAllWildcards: () => void;

	// Opciones jerárquicas específicas
	expandBranch: (id: string) => void;
	expandWildcard: (id: string) => void;
	isWildcardSelected: (id: string) => boolean;

	// Visor
	openViewer: (wildcardId: string) => void;

	// Reset
	resetUI: () => void;
	resetWildcardDisplayState: (wildcardId: string) => void;
	selectMultipleWildcards: (ids: string[]) => void;
	// Selección
	selectWildcard: (id: string) => void;
	setCurrentWildcard: (wildcardId: string | null) => void;

	// Drag & drop
	setDraggedWildcard: (id: string | null) => void;
	setDropTargetWildcard: (id: string | null) => void;

	// Navegación
	setHighlightedWildcard: (id: string | null) => void;

	// Vista
	setViewMode: (mode: WildcardViewMode) => void;

	// Estados visuales
	setWildcardDisplayState: (wildcardId: string, state: Partial<WildcardDisplayState>) => void;

	// Expansión (para vistas jerárquicas)
	toggleWildcardExpanded: (id: string) => void;
	toggleWildcardSelection: (id: string) => void;
}

export const createWildcardUISlice: StateCreator<
	WildcardState & WildcardUISlice & WildcardCoreSlice,
	[],
	[],
	WildcardUISlice
> = (set, get) => ({
	// Selección
	selectWildcard: (id) => {
		uiLogger.info('✅ Seleccionando comodín:', id);
		set((state) => {
			const currentSelectedIds = state.ui.selectedIds || [];
			if (currentSelectedIds.includes(id)) {
				return state;
			}

			return {
				ui: {
					...state.ui,
					selectedIds: [...currentSelectedIds, id],
				},
			};
		});
	},

	deselectWildcard: (id) => {
		uiLogger.info('❌ Deseleccionando comodín:', id);
		set((state) => {
			const currentSelectedIds = state.ui.selectedIds || [];
			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				},
			};
		});
	},

	toggleWildcardSelection: (id) => {
		const selectedIds = get().ui.selectedIds || [];
		const isSelected = selectedIds.includes(id);
		uiLogger.info(`🔄 ${isSelected ? 'Deseleccionando' : 'Seleccionando'} comodín:`, id);

		if (isSelected) {
			get().deselectWildcard(id);
		} else {
			get().selectWildcard(id);
		}
	},

	selectMultipleWildcards: (ids) => {
		uiLogger.info('🔍 Seleccionando múltiples comodines:', ids.length);
		set((state) => {
			const currentSelectedIds = state.ui.selectedIds || [];
			return {
				ui: {
					...state.ui,
					selectedIds: [...new Set([...currentSelectedIds, ...ids])],
				},
			};
		});
	},

	clearWildcardSelection: () => {
		uiLogger.info('🧹 Limpiando selección de comodines');
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	isWildcardSelected: (id) => {
		const selectedIds = get().ui.selectedIds || [];
		return selectedIds.includes(id);
	},

	// Visor
	openViewer: (wildcardId) => {
		uiLogger.info('👁️ Abriendo visor para comodín:', wildcardId);
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: true,
				currentWildcardId: wildcardId,
			},
		}));
	},

	closeViewer: () => {
		uiLogger.info('👁️ Cerrando visor de comodines');
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: false,
			},
		}));
	},

	setCurrentWildcard: (wildcardId) => {
		uiLogger.info('👁️ Cambiando comodín actual a:', wildcardId);
		set((state) => ({
			ui: {
				...state.ui,
				currentWildcardId: wildcardId,
			},
		}));
	},

	// Vista
	setViewMode: (mode) => {
		uiLogger.info('👁️ Cambiando modo de vista a:', mode);
		set((state) => ({
			ui: {
				...state.ui,
				viewMode: mode,
			},
		}));
	},

	// Estados visuales
	setWildcardDisplayState: (wildcardId, displayState) => {
		uiLogger.info('🎨 Actualizando estado visual para comodín:', wildcardId);
		set((state) => ({
			ui: {
				...state.ui,
				displayState: {
					...state.ui.displayState,
					[wildcardId]: {
						...state.ui.displayState[wildcardId],
						...displayState,
					},
				},
			},
		}));
	},

	resetWildcardDisplayState: (wildcardId) => {
		uiLogger.info('🧹 Reseteando estado visual para comodín:', wildcardId);
		set((state) => {
			const { [wildcardId]: _, ...rest } = state.ui.displayState;
			return {
				ui: {
					...state.ui,
					displayState: rest,
				},
			};
		});
	},

	// Drag & drop
	setDraggedWildcard: (id) => {
		uiLogger.info('🖱️ Estableciendo comodín arrastrado:', id);
		set((state) => ({
			ui: {
				...state.ui,
				draggedWildcardId: id,
			},
		}));
	},

	setDropTargetWildcard: (id) => {
		uiLogger.info('🎯 Estableciendo comodín objetivo para soltar:', id);
		set((state) => ({
			ui: {
				...state.ui,
				dropTargetWildcardId: id,
			},
		}));
	},

	// Navegación
	setHighlightedWildcard: (id) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	// Expansión (para vistas jerárquicas)
	toggleWildcardExpanded: (id) => {
		const expandedIds = get().ui.expandedIds || [];
		const isExpanded = expandedIds.includes(id);
		uiLogger.info(`🔄 ${isExpanded ? 'Colapsando' : 'Expandiendo'} comodín:`, id);

		if (isExpanded) {
			get().collapseWildcard(id);
		} else {
			get().expandWildcard(id);
		}
	},

	expandWildcard: (id) => {
		uiLogger.info('📂 Expandiendo comodín:', id);
		set((state) => {
			const currentExpandedIds = state.ui.expandedIds || [];
			if (currentExpandedIds.includes(id)) {
				return state;
			}

			return {
				ui: {
					...state.ui,
					expandedIds: [...currentExpandedIds, id],
				},
			};
		});
	},

	collapseWildcard: (id) => {
		uiLogger.info('📁 Colapsando comodín:', id);
		set((state) => {
			const currentExpandedIds = state.ui.expandedIds || [];
			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				},
			};
		});
	},

	expandAllWildcards: () => {
		uiLogger.info('📂 Expandiendo todos los comodines');
		const allIds = Object.keys(get().core.wildcards);
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: allIds,
			},
		}));
	},

	collapseAllWildcards: () => {
		uiLogger.info('📁 Colapsando todos los comodines');
		set((state) => ({
			ui: {
				...state.ui,
				expandedIds: [],
			},
		}));
	},

	// Opciones jerárquicas específicas
	expandBranch: (id) => {
		uiLogger.info('🌳 Expandiendo rama completa desde comodín:', id);

		const getChildrenIds = (parentId: string): string[] => {
			const children = get().getChildWildcards(parentId);
			let allIds = children.map((c) => c.id);

			for (const child of children) {
				allIds = [...allIds, ...getChildrenIds(child.id)];
			}

			return allIds;
		};

		const branchIds = [id, ...getChildrenIds(id)];

		set((state) => {
			const currentExpandedIds = state.ui.expandedIds || [];
			return {
				ui: {
					...state.ui,
					expandedIds: [...new Set([...currentExpandedIds, ...branchIds])],
				},
			};
		});
	},

	collapseBranch: (id) => {
		uiLogger.info('🌳 Colapsando rama completa desde comodín:', id);

		const getChildrenIds = (parentId: string): string[] => {
			const children = get().getChildWildcards(parentId);
			let allIds = children.map((c) => c.id);

			for (const child of children) {
				allIds = [...allIds, ...getChildrenIds(child.id)];
			}

			return allIds;
		};

		const branchIds = [id, ...getChildrenIds(id)];

		set((state) => {
			const currentExpandedIds = state.ui.expandedIds || [];
			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => !branchIds.includes(expandedId)),
				},
			};
		});
	},

	// Reset
	resetUI: () => {
		uiLogger.info('🔄 Reseteando estado de UI');
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
				isViewerOpen: false,
				currentWildcardId: null,
				displayState: {},
				draggedWildcardId: null,
				dropTargetWildcardId: null,
				highlightedId: null,
				expandedIds: [],
			},
		}));
	},
});
