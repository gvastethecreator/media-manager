/**
 * @file Slice para navegación del store de Folder
 * @module store/entities/folder/slices/navigation
 */

import type { StateCreator } from 'zustand';
import type { FolderNavigationSlice, FolderStore } from '../types';

export interface FolderNavigationState {
	currentFolderId: string | null;
	breadcrumbs: Array<{ id: string; name: string; path: string }>;
	history: string[];
	historyIndex: number;
}

export const initialNavigationState: FolderNavigationState = {
	currentFolderId: null,
	breadcrumbs: [],
	history: [],
	historyIndex: -1,
};

// Creador del slice de navegación
export const createFolderNavigationSlice: StateCreator<FolderStore, [], [], FolderNavigationSlice> = (set, get) => ({
	...initialNavigationState,

	// Navegación
	navigateToFolder: (id: string) => {
		const { history, historyIndex, updateBreadcrumbs } = get();

		// Agregar al historial
		const newHistory = [...history.slice(0, historyIndex + 1), id];
		const newIndex = newHistory.length - 1;

		set({
			currentFolderId: id,
			history: newHistory,
			historyIndex: newIndex,
		});

		// Actualizar breadcrumbs
		updateBreadcrumbs(id);
	},

	navigateUp: () => {
		const { currentFolderId, getFolder } = get();

		if (!currentFolderId) return;

		const currentFolder = getFolder(currentFolderId);
		if (currentFolder?.parentId) {
			get().navigateToFolder(currentFolder.parentId);
		}
	},

	navigateBack: () => {
		const { history, historyIndex, updateBreadcrumbs } = get();

		if (historyIndex > 0) {
			const newIndex = historyIndex - 1;
			const folderId = history[newIndex];

			set({
				currentFolderId: folderId,
				historyIndex: newIndex,
			});

			updateBreadcrumbs(folderId);
		}
	},

	navigateForward: () => {
		const { history, historyIndex, updateBreadcrumbs } = get();

		if (historyIndex < history.length - 1) {
			const newIndex = historyIndex + 1;
			const folderId = history[newIndex];

			set({
				currentFolderId: folderId,
				historyIndex: newIndex,
			});

			updateBreadcrumbs(folderId);
		}
	},

	// Historial
	canGoBack: () => {
		const { historyIndex } = get();
		return historyIndex > 0;
	},

	canGoForward: () => {
		const { history, historyIndex } = get();
		return historyIndex < history.length - 1;
	},

	clearHistory: () => {
		set({
			history: [],
			historyIndex: -1,
		});
	},

	// Breadcrumbs
	updateBreadcrumbs: (folderId: string) => {
		const { getFolderPath } = get();

		const path = getFolderPath(folderId);
		const breadcrumbs = path.map((folder) => ({
			id: folder.id,
			name: folder.name,
			path: folder.path,
		}));

		set({ breadcrumbs });
	},
});
