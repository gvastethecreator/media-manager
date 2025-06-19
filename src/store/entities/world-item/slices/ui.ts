/**
 * @file Slice para el estado de la UI del store de WorldItem
 * @module store/entities/world-item/slices/ui
 */

import { WorldItemViewMode } from '@/types/entities/world-item';
import type { StateCreator } from 'zustand';
import type { WorldItemActions, WorldItemState, WorldItemUIState } from '../types';

export interface WorldItemUISlice {
	ui: WorldItemUIState;
	selectWorldItem: (id: string | null) => void;
	startEditing: (id: string | null) => void;
	highlightWorldItem: (id: string | null) => void;
	setViewMode: (mode: WorldItemViewMode) => void;
}

export const createWorldItemUISlice: StateCreator<
	WorldItemState & WorldItemActions,
	[],
	[],
	WorldItemUISlice
> = (set) => ({
	ui: {
		selectedId: null,
		editingId: null,
		highlightedId: null,
		viewMode: WorldItemViewMode.LIST,
	},
	selectWorldItem: (id) => set((state) => ({ ui: { ...state.ui, selectedId: id, editingId: null } })),
	startEditing: (id) => set((state) => ({ ui: { ...state.ui, editingId: id } })),
	highlightWorldItem: (id) => set((state) => ({ ui: { ...state.ui, highlightedId: id } })),
	setViewMode: (mode) => set((state) => ({ ui: { ...state.ui, viewMode: mode } })),
});
