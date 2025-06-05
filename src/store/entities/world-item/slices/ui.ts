/**
 * @file Slice UI para el store de WorldItem
 * @module store/entities/world-item/slices/ui
 */

import type { StateCreator } from 'zustand';
import { type WorldItemFilters, WorldItemViewMode } from '../../../../types/entities/world-item';
import type { WorldItemStore } from '../index';

export interface WorldItemUISlice {
	// Estado de visualización
	viewMode: WorldItemViewMode;
	sortBy: string;
	filters: WorldItemFilters;
	expandedIds: string[];
	selectedIds: string[];
	currentItemId: string | null;

	// UI control
	isCreatingItem: boolean;
	isEditingItem: boolean;
	isProcessingAction: boolean;
	searchQuery: string;

	// Acciones
	setViewMode: (mode: WorldItemViewMode) => void;
	setSortBy: (sortBy: string) => void;
	setFilters: (filters: Partial<WorldItemFilters>) => void;
	resetFilters: () => void;
	toggleExpanded: (id: string) => void;
	toggleSelected: (id: string) => void;
	selectItems: (ids: string[] | null) => void;
	selectWorldItem: (id: string | null) => void;
	clearSelection: () => void;
	setCurrentItemId: (id: string | null) => void;
	setIsCreatingItem: (isCreating: boolean) => void;
	setIsEditingItem: (isEditing: boolean) => void;
	setIsProcessingAction: (isProcessing: boolean) => void;
	setSearchQuery: (query: string) => void;
}

export const createWorldItemUISlice: StateCreator<WorldItemStore, [], [], WorldItemUISlice> = (set, get) => ({
	// Estado inicial
	viewMode: WorldItemViewMode.GRID,
	sortBy: 'name_asc',
	filters: {},
	expandedIds: [],
	selectedIds: [],
	currentItemId: null,
	isCreatingItem: false,
	isEditingItem: false,
	isProcessingAction: false,
	searchQuery: '',

	// Acciones
	setViewMode: (mode) => {
		set({ viewMode: mode });
	},

	setSortBy: (sortBy) => {
		set({ sortBy });
	},

	setFilters: (filters) => {
		set((state) => ({
			filters: { ...state.filters, ...filters },
		}));
	},

	resetFilters: () => {
		set({ filters: {} });
	},

	toggleExpanded: (id) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.expandedIds || [];

			if (currentExpandedIds.includes(id)) {
				return {
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				};
			}
			return {
				expandedIds: [...currentExpandedIds, id],
			};
		});
	},

	toggleSelected: (id) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.selectedIds || [];

			if (currentSelectedIds.includes(id)) {
				return {
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				};
			}
			return {
				selectedIds: [...currentSelectedIds, id],
			};
		});
	},

	selectItems: (ids) => {
		// Si ids es null, limpiar la selección
		if (ids === null) {
			set({ selectedIds: [] });
			return;
		}

		set({ selectedIds: ids });
	},

	// Método específico para seleccionar un solo ítem (o limpiar selección)
	selectWorldItem: (id) => {
		if (id === null) {
			set({ selectedIds: [] });
			return;
		}

		set({
			selectedIds: [id],
			currentItemId: id
		});
	},

	clearSelection: () => {
		set({ selectedIds: [] });
	},

	setCurrentItemId: (id) => {
		set({ currentItemId: id });
	},

	setIsCreatingItem: (isCreating) => {
		set({ isCreatingItem });
	},

	setIsEditingItem: (isEditing) => {
		set({ isEditingItem });
	},

	setIsProcessingAction: (isProcessing) => {
		set({ isProcessingAction });
	},

	setSearchQuery: (query) => {
		set({
			searchQuery: query,
			filters: { ...get().filters, searchQuery: query },
		});
	},
});
