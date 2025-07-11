/**
 * @file UI slice para el store de Favorite
 * @module store/entities/favorite/slices/ui
 */

import { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { FavoriteStore } from '..';

// Logger específico para este slice
const logger = clientLogger.withContext({ module: 'FavoriteStore.UISlice' });

// Estado
export interface UIState {
	viewMode: FavoriteViewMode;
	sortCriteria: FavoriteSortCriteria;
	sortDirection: 'asc' | 'desc';
	selectedIds: string[];
}

// Acciones
export interface UIActions {
	setViewMode: (mode: FavoriteViewMode) => void;
	setSortCriteria: (criteria: FavoriteSortCriteria) => void;
	toggleSortDirection: () => void;
	selectFavorite: (id: string) => void;
	deselectFavorite: (id: string) => void;
	toggleSelection: (id: string) => void;
	selectAll: () => void;
	deselectAll: () => void;
}

// Slice del store para UI
export const createUISlice: StateCreator<FavoriteStore, [], [], UIState & UIActions> = (set, get) => ({
	// Estado inicial
	viewMode: FavoriteViewMode.GRID,
	sortCriteria: FavoriteSortCriteria.CREATED_AT,
	sortDirection: 'desc',
	selectedIds: [],

	// Acciones
	setViewMode: (mode) => {
		set({ viewMode: mode });
		logger.info('📐 Modo de vista cambiado:', mode);
	},

	setSortCriteria: (criteria) => {
		set({ sortCriteria: criteria });
		logger.info('🔄 Criterio de ordenación cambiado:', criteria);
	},

	toggleSortDirection: () => {
		set((state) => ({
			sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
		}));
		logger.info('⬆️⬇️ Dirección de ordenación cambiada:', get().sortDirection);
	},

	selectFavorite: (id) => {
		set((state) => ({
			selectedIds: [...state.selectedIds, id],
		}));
		logger.info('✅ Favorito seleccionado:', id);
	},

	deselectFavorite: (id) => {
		set((state) => ({
			selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
		}));
		logger.info('❌ Favorito deseleccionado:', id);
	},

	toggleSelection: (id) => {
		const isSelected = get().selectedIds.includes(id);
		if (isSelected) {
			get().deselectFavorite(id);
		} else {
			get().selectFavorite(id);
		}
	},

	selectAll: () => {
		const allIds = get().favorites.map((favorite) => favorite.id);
		set({ selectedIds: allIds });
		logger.info('✅✅ Todos los favoritos seleccionados');
	},

	deselectAll: () => {
		set({ selectedIds: [] });
		logger.info('❌❌ Todos los favoritos deseleccionados');
	},
});
