/**
 * @file Store principal de Folder optimizado con Zustand
 * @module store/entities/folder
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createFolderCoreSlice } from './slices/core';
import { createFolderFiltersSlice } from './slices/filters';
import { createFolderNavigationSlice } from './slices/navigation';
import type { CompleteFolderStore } from './types';

/**
 * 📁 Store principal de Folder con todos los slices combinados
 */
export const useFolderStore = create<CompleteFolderStore>()(
	devtools(
		subscribeWithSelector((...args) => ({
			...createFolderCoreSlice(...args),
			...createFolderFiltersSlice(...args),
			...createFolderNavigationSlice(...args),
		})),
		{
			name: 'folder-store',
		}
	)
);

// Exportar selectores
export * from './selectors';
// Exportar tipos para uso externo
export type {
	CompleteFolderStore,
	FolderFiltersSlice,
	FolderNavigationSlice,
	FolderStore,
} from './types';

// Exportar funciones auxiliares
export const folderStoreHelpers = {
	/**
	 * 🔍 Busca carpetas por texto
	 */
	searchFolders: (folders: Record<string, any>, query: string) => {
		const searchTerm = query.toLowerCase();
		return Object.values(folders).filter(
			(folder) =>
				folder.name.toLowerCase().includes(searchTerm) ||
				folder.description?.toLowerCase().includes(searchTerm) ||
				folder.path.toLowerCase().includes(searchTerm) ||
				folder.statistics.autoTags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
		);
	},

	/**
	 * 📊 Filtra por score de organización
	 */
	filterByOrganization: (folders: Record<string, any>, minScore: number) => {
		return Object.values(folders).filter((folder) => folder.statistics.organizationScore >= minScore);
	},

	/**
	 * 🍞 Construye breadcrumbs para una carpeta
	 */
	buildBreadcrumbs: (folders: Record<string, any>, folderId: string) => {
		const breadcrumbs: any[] = [];
		let currentId: string | null = folderId;

		while (currentId && folders[currentId]) {
			const folder = folders[currentId];
			breadcrumbs.unshift(folder);
			currentId = folder.parentId;
		}

		return breadcrumbs;
	},

	/**
	 * 🛤️ Encuentra el camino entre dos carpetas
	 */
	findPath: (folders: Record<string, any>, fromId: string, toId: string) => {
		// Implementación simplificada - encontrar ancestro común
		const fromPath = folderStoreHelpers.buildBreadcrumbs(folders, fromId);
		const toPath = folderStoreHelpers.buildBreadcrumbs(folders, toId);

		// Retornar IDs del camino
		return [...fromPath.map((f) => f.id), ...toPath.map((f) => f.id)];
	},
};

// Hook personalizado para acceso fácil a funciones comunes
export const useFolderActions = () => {
	const store = useFolderStore();

	return {
		// Datos
		folders: store.folders,
		currentFolder: store.currentFolderId ? store.getFolder(store.currentFolderId) : null,
		rootFolders: store.getRootFolders(),
		breadcrumbs: store.breadcrumbs,

		// Estados
		isLoading: store.isLoading,
		error: store.error,
		selectedFolderId: store.selectedFolderId,

		// Acciones principales
		setFolders: store.setFolders,
		selectFolder: store.selectFolder,
		navigateToFolder: store.navigateToFolder,
		navigateUp: store.navigateUp,

		// Filtros
		searchQuery: store.searchQuery,
		setSearchQuery: store.setSearchQuery,
		sortBy: store.sortBy,
		setSortBy: store.setSortBy,
		getFilteredFolders: store.getFilteredFolders,

		// Navegación
		canGoBack: store.canGoBack(),
		canGoForward: store.canGoForward(),
		navigateBack: store.navigateBack,
		navigateForward: store.navigateForward,

		// Utilidades
		refresh: store.refresh,
		clear: store.clear,
	};
};

// Hook para jerarquía de carpetas
export const useFolderHierarchy = (folderId?: string) => {
	const store = useFolderStore();

	if (!folderId) {
		return {
			folder: null,
			children: store.getRootFolders(),
			ancestors: [],
			descendants: [],
		};
	}

	const folder = store.getFolder(folderId);

	return {
		folder,
		children: store.getFoldersByParent(folderId),
		ancestors: store.getAncestors(folderId),
		descendants: store.getDescendants(folderId),
	};
};
