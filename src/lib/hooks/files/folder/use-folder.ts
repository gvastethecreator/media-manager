/**
 * @file Hook personalizado para acceder al store de carpetas
 * @module hooks/folder/use-folder
 */

import { useEffect } from 'react';
import { useFolderStore } from '@/store/entities/folder';

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
		addFolder: createFolder,
		updateFolder,
		removeFolder: deleteFolder,
		selectFolder: setCurrentFolderId,
		selectFolder: setCurrentFolder,
		setSearchQuery: setSearchTerm,
		setSortBy,
		setSortDirection,
		toggleFavorites: setShowOnlyFavorites,
		resetFilters,
		setViewMode,
		setItemSize,
		toggleExpanded: toggleFolderExpanded,
	} = useFolderStore();

	// Acceso al estado mediante selectores para optimizar renders
	const folders = useFolderStore((state) => Object.values(state.folders));
	const filteredFolders = useFolderStore((state) => state.getFilteredFolders());
	const currentFolder = useFolderStore((state) =>
		state.selectedFolderId ? state.getFolder(state.selectedFolderId) : null
	);
	const isLoading = useFolderStore((state) => state.isLoading);
	const error = useFolderStore((state) => state.error);
	const viewMode = useFolderStore((state) => state.viewMode);
	const itemSize = useFolderStore((state) => state.itemSize);
	const sortBy = useFolderStore((state) => state.sortBy);
	const sortDirection = useFolderStore((state) => state.sortDirection);
	const searchTerm = useFolderStore((state) => state.searchQuery);
	const showFavorites = useFolderStore((state) => state.showOnlyFavorites);
	const favoriteFolders = useFolderStore((state) => Object.values(state.folders).filter((f) => f.isFavorite));
	const stats = useFolderStore((state) => ({ totalFolders: Object.keys(state.folders).length }));

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
		fetchFolderById: (id: string) => Promise.resolve(useFolderStore.getState().getFolder(id)),
		createFolder,
		updateFolder,
		deleteFolder,
		setCurrentFolder,
		setCurrentFolderId,
		resetError: () => useFolderStore.setState({ error: null }),

		// Acciones de filtrado
		setSearchTerm,
		setSortBy,
		setSortDirection,
		toggleFavorites: setShowOnlyFavorites,
		resetFilters,

		// Acciones de UI
		setViewMode,
		setItemSize,
		toggleFolderExpanded,
	};
}
