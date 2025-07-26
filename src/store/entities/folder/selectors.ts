/**
 * @file Selectores para el store de Folder
 * @module store/entities/folder/selectors
 */

import type { CompleteFolderStore } from './types';

/**
 * Selectores básicos para el estado del store
 */
export const selectFolders = (state: CompleteFolderStore) => Object.values(state.folders);

export const selectCurrentFolder = (state: CompleteFolderStore) =>
	state.currentFolderId ? state.getFolder(state.currentFolderId) : null;

export const selectIsLoading = (state: CompleteFolderStore) => state.isLoading;

export const selectError = (state: CompleteFolderStore) => state.error;

/**
 * Selectores de filtros
 */
export const selectViewMode = (state: CompleteFolderStore) => state.viewMode;

export const selectItemSize = (state: CompleteFolderStore) => state.itemSize || 'medium';

export const selectSortBy = (state: CompleteFolderStore) => state.sortBy;

export const selectSortDirection = (state: CompleteFolderStore) => state.sortDirection || 'asc';

export const selectSearchTerm = (state: CompleteFolderStore) => state.searchQuery;

export const selectShowFavorites = (state: CompleteFolderStore) => state.showOnlyFavorites;

/**
 * Selectores derivados
 */
export const selectFilteredFolders = (state: CompleteFolderStore) => {
	return state.getFilteredFolders();
};

export const selectFavoriteFolders = (state: CompleteFolderStore) => {
	return Object.values(state.folders).filter((folder) => folder.isFavorite);
};

export const selectFolderStats = (state: CompleteFolderStore) => {
	const allFolders = Object.values(state.folders);
	return {
		total: allFolders.length,
		favorites: allFolders.filter((f) => f.isFavorite).length,
		withImages: allFolders.filter((f) => f.stats.imageCount > 0).length,
  empty: allFolders.filter((f) => f.stats.imageCount === 0).length,
	};
};
