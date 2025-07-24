/**
 * @file Hook personalizado para acceder al store de carpetas
 * @module hooks/folder/use-folder
 */

import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import {
	selectCurrentFolder,
	selectError,
	selectFavoriteFolders,
	selectFilteredFolders,
	selectFolderStats,
	selectFolders,
	selectIsLoading,
	selectItemSize,
	selectSearchTerm,
	selectShowFavorites,
	selectSortBy,
	selectSortDirection,
	selectViewMode,
	useFolderStore,
} from '@/store/entities/folder';

/**
 * Hook para facilitar el acceso al store de carpetas
 * @param options Opciones para personalizar el comportamiento (filtrado automático, etc)
 * @returns Objeto con estado y acciones de carpetas
 */
export function useFolder(options: { autoFilter?: boolean; loadOnMount?: boolean } = {}) {
	const { autoFilter = true, loadOnMount = true } = options;

	// Acceso a las acciones del store
	const {
		fetchFolders,
		fetchFolderById,
		createFolder,
		updateFolder,
		deleteFolder,
		setCurrentFolderId,
		setCurrentFolder,
		resetError,
		setSearchTerm,
		setSortBy,
		setSortDirection,
		toggleFavorites,
		resetFilters,
		setViewMode,
		setItemSize,
		toggleFolderExpanded,
	} = useFolderStore();

	// Acceso al estado mediante selectores para optimizar renders
	const folders = useFolderStore(selectFolders);
	const filteredFolders = useFolderStore(selectFilteredFolders, shallow);
	const currentFolder = useFolderStore(selectCurrentFolder);
	const isLoading = useFolderStore(selectIsLoading);
	const error = useFolderStore(selectError);
	const viewMode = useFolderStore(selectViewMode);
	const itemSize = useFolderStore(selectItemSize);
	const sortBy = useFolderStore(selectSortBy);
	const sortDirection = useFolderStore(selectSortDirection);
	const searchTerm = useFolderStore(selectSearchTerm);
	const showFavorites = useFolderStore(selectShowFavorites);
	const favoriteFolders = useFolderStore(selectFavoriteFolders, shallow);
	const stats = useFolderStore(selectFolderStats, shallow);

	// Efecto para cargar datos al montar el componente
	useEffect(() => {
		if (loadOnMount && folders.length === 0 && !isLoading) {
			fetchFolders();
		}
	}, [loadOnMount, folders.length, isLoading, fetchFolders]);

	// Devolver estado y funciones
	return {
		// Estado
		folders: autoFilter ? filteredFolders : folders,
		currentFolder,
		isLoading,
		error,
		viewMode,
		itemSize,
		sortBy,
		sortDirection,
		searchTerm,
		showFavorites,
		favoriteFolders,
		stats,

		// Acciones
		fetchFolders,
		fetchFolderById,
		createFolder,
		updateFolder,
		deleteFolder,
		setCurrentFolder,
		setCurrentFolderId,
		resetError,

		// Acciones de filtrado
		setSearchTerm,
		setSortBy,
		setSortDirection,
		toggleFavorites,
		resetFilters,

		// Acciones de UI
		setViewMode,
		setItemSize,
		toggleFolderExpanded,
	};
}
