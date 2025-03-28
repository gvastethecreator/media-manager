/**
 * @file Store principal de carpetas que combina los slices y define selectores optimizados
 * @module store/entities/folder/store
 */

import type { FolderExtended } from '@/types/entities/folder';
import { create } from 'zustand';
import { createCoreSlice } from './slices/core';
import { createFiltersSlice } from './slices/filters';
import { createUISlice } from './slices/ui';
import type { FolderStore } from './types';

/**
 * Creación del store combinando los diferentes slices
 */
export const useFolderStore = create<FolderStore>()((...a) => ({
	...createCoreSlice(...a),
	...createUISlice(...a),
	...createFiltersSlice(...a),
}));

/**
 * Selectores optimizados - Evitan re-renders innecesarios
 */

// Selectores de estado principal (core)
export const selectFolders = (state: FolderStore) => state.coreState.folders;
export const selectCurrentFolderId = (state: FolderStore) => state.coreState.currentFolderId;
export const selectCurrentFolder = (state: FolderStore) => state.coreState.currentFolder;
export const selectIsLoading = (state: FolderStore) => state.coreState.loading;
export const selectIsCreating = (state: FolderStore) => state.coreState.isCreating;
export const selectIsUpdating = (state: FolderStore) => state.coreState.isUpdating;
export const selectIsDeleting = (state: FolderStore) => state.coreState.isDeleting;
export const selectError = (state: FolderStore) => state.coreState.error;

// Selectores de estado UI
export const selectViewMode = (state: FolderStore) => state.uiState.viewMode;
export const selectItemSize = (state: FolderStore) => state.uiState.itemSize;
export const selectSidebarExpanded = (state: FolderStore) => state.uiState.sidebarExpanded;
export const selectExpandedFolders = (state: FolderStore) => state.uiState.expandedFolders;
export const selectShowCreateModal = (state: FolderStore) => state.uiState.showCreateModal;
export const selectShowEditModal = (state: FolderStore) => state.uiState.showEditModal;
export const selectShowDeleteModal = (state: FolderStore) => state.uiState.showDeleteModal;

// Selectores de filtros
export const selectSearchTerm = (state: FolderStore) => state.filtersState.searchTerm;
export const selectSortBy = (state: FolderStore) => state.filtersState.sortBy;
export const selectSortDirection = (state: FolderStore) => state.filtersState.sortDirection;
export const selectShowFavorites = (state: FolderStore) => state.filtersState.showFavorites;
export const selectActiveOnly = (state: FolderStore) => state.filtersState.activeOnly;
export const selectCategoryFilter = (state: FolderStore) => state.filtersState.categoryFilter;

// Selectores compuestos que calculan información derivada
export const selectFilteredFolders = (state: FolderStore): FolderExtended[] => {
	const { folders } = state.coreState;
	const { searchTerm, sortBy, sortDirection, showFavorites, activeOnly, categoryFilter } = state.filtersState;

	// Aplicar filtros
	return folders
		.filter((folder) => {
			// Filtro por término de búsqueda
			if (searchTerm && !folder.name.toLowerCase().includes(searchTerm.toLowerCase())) {
				return false;
			}

			// Filtro por favoritos
			if (showFavorites && !folder.isFavorite) {
				return false;
			}

			// Filtro por activo/inactivo (si applicable)
			if (activeOnly && folder.isHidden) {
				return false;
			}

			// Filtro por categoría
			if (categoryFilter && folder.category !== categoryFilter) {
				return false;
			}

			return true;
		})
		.sort((a, b) => {
			// Ordenación básica
			const aValue = a[sortBy as keyof FolderExtended];
			const bValue = b[sortBy as keyof FolderExtended];

			// Para fechas y números
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
			}

			// Para strings
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}

			// Para fechas
			if (aValue instanceof Date && bValue instanceof Date) {
				return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
			}

			return 0;
		});
};

// Selector para carpetas favoritas
export const selectFavoriteFolders = (state: FolderStore): FolderExtended[] => {
	return state.coreState.folders.filter((folder) => folder.isFavorite);
};

// Selector para estadísticas generales
export const selectFolderStats = (state: FolderStore) => {
	const folders = state.coreState.folders;
	return {
		total: folders.length,
		favorites: folders.filter((folder) => folder.isFavorite).length,
		empty: folders.filter((folder) => (folder.totalFiles || 0) === 0).length,
		// Otras estadísticas relevantes
	};
};
