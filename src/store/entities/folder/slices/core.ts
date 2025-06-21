/**
 * @file Core slice para el store de Folder optimizado
 * @module store/entities/folder/slices/core
 */

import type { StateCreator } from 'zustand';
import type { FolderWithStats } from '@/types/entities/folder';
import {
	foldersToRecord,
	getAllFolders,
	getFolderById,
	fromPrismaFoldersWithCounts
} from '@/transformers/folder';
import type { FolderStore } from '../types';

// Estado inicial
const initialState = {
	folders: {} as Record<string, FolderWithStats>,
	foldersByParent: {} as Record<string, string[]>,
	rootFolders: [] as string[],
	folderTree: {} as Record<string, string[]>,
	isLoading: false,
	error: null,
	lastUpdated: null,
	selectedFolderId: null,
	expandedFolders: new Set<string>(),
	currentPath: [] as string[],
};

/**
 * 🔧 Construye el índice de carpetas por padre
 */
function buildParentIndex(folders: Record<string, FolderWithStats>): Record<string, string[]> {
	const index: Record<string, string[]> = {};

	Object.values(folders).forEach(folder => {
		const parentKey = folder.parentId || 'root';
		if (!index[parentKey]) {
			index[parentKey] = [];
		}
		index[parentKey].push(folder.id);
	});

	return index;
}

/**
 * 🌳 Construye el índice del árbol de carpetas
 */
function buildTreeIndex(folders: Record<string, FolderWithStats>): Record<string, string[]> {
	const tree: Record<string, string[]> = {};

	// Función recursiva para obtener todos los descendientes
	function getDescendants(folderId: string, visited = new Set<string>()): string[] {
		if (visited.has(folderId)) return []; // Evitar ciclos
		visited.add(folderId);

		const directChildren = Object.values(folders)
			.filter(f => f.parentId === folderId)
			.map(f => f.id);

		const allDescendants = [...directChildren];
		directChildren.forEach(childId => {
			allDescendants.push(...getDescendants(childId, visited));
		});

		return allDescendants;
	}

	Object.keys(folders).forEach(folderId => {
		tree[folderId] = getDescendants(folderId);
	});

	return tree;
}

/**
 * 🔍 Encuentra las carpetas raíz
 */
function findRootFolders(folders: Record<string, FolderWithStats>): string[] {
	return Object.values(folders)
		.filter(folder => !folder.parentId)
		.map(folder => folder.id);
}

/**
 * 📁 Core slice del store de Folder
 */
export const createFolderCoreSlice: StateCreator<FolderStore, [], [], FolderStore> = (set, get) => ({
	...initialState,

	// Funciones de acceso O(1)
	getFolder: (id: string) => getFolderById(get().folders, id),

	getFoldersByParent: (parentId: string | null) => {
		const { folders, foldersByParent } = get();
		const key = parentId || 'root';
		const childIds = foldersByParent[key] || [];
		return childIds.map(id => folders[id]).filter(Boolean);
	},

	getRootFolders: () => {
		const { folders, rootFolders } = get();
		return rootFolders.map(id => folders[id]).filter(Boolean);
	},

	getFolderPath: (id: string) => {
		const { folders } = get();
		const path: FolderWithStats[] = [];
		let currentId: string | null = id;

		while (currentId && folders[currentId]) {
			const folder = folders[currentId];
			path.unshift(folder);
			currentId = folder.parentId;
		}

		return path;
	},

	// Funciones de manipulación
	setFolders: (folderArray: FolderWithStats[]) => {
		const folders = foldersToRecord(folderArray);
		const foldersByParent = buildParentIndex(folders);
		const rootFolders = findRootFolders(folders);
		const folderTree = buildTreeIndex(folders);

		set({
			folders,
			foldersByParent,
			rootFolders,
			folderTree,
			lastUpdated: new Date(),
			error: null,
		});
	},

	addFolder: (folder: FolderWithStats) => {
		const { folders } = get();
		const updatedFolders = { ...folders, [folder.id]: folder };

		set({
			folders: updatedFolders,
			foldersByParent: buildParentIndex(updatedFolders),
			rootFolders: findRootFolders(updatedFolders),
			folderTree: buildTreeIndex(updatedFolders),
			lastUpdated: new Date(),
		});
	},

	updateFolder: (id: string, updates: Partial<FolderWithStats>) => {
		const { folders } = get();
		const existingFolder = folders[id];

		if (!existingFolder) return;

		const updatedFolder = { ...existingFolder, ...updates };
		const updatedFolders = { ...folders, [id]: updatedFolder };

		set({
			folders: updatedFolders,
			foldersByParent: buildParentIndex(updatedFolders),
			rootFolders: findRootFolders(updatedFolders),
			folderTree: buildTreeIndex(updatedFolders),
			lastUpdated: new Date(),
		});
	},

	removeFolder: (id: string) => {
		const { folders } = get();
		const { [id]: removed, ...remainingFolders } = folders;

		set({
			folders: remainingFolders,
			foldersByParent: buildParentIndex(remainingFolders),
			rootFolders: findRootFolders(remainingFolders),
			folderTree: buildTreeIndex(remainingFolders),
			lastUpdated: new Date(),
		});
	},

	// Funciones de jerarquía
	moveFolder: (folderId: string, newParentId: string | null) => {
		const { updateFolder } = get();
		updateFolder(folderId, { parentId: newParentId });
	},

	getDescendants: (folderId: string) => {
		const { folders, folderTree } = get();
		const descendantIds = folderTree[folderId] || [];
		return descendantIds.map(id => folders[id]).filter(Boolean);
	},

	getAncestors: (folderId: string) => {
		const { getFolderPath } = get();
		const path = getFolderPath(folderId);
		return path.slice(0, -1); // Excluir la carpeta actual
	},

	// Funciones de UI
	selectFolder: (id: string | null) => {
		set({ selectedFolderId: id });
	},

	toggleExpanded: (id: string) => {
		const { expandedFolders } = get();
		const newExpanded = new Set(expandedFolders);

		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}

		set({ expandedFolders: newExpanded });
	},

	expandPath: (path: string[]) => {
		const { expandedFolders } = get();
		const newExpanded = new Set(expandedFolders);

		path.forEach(id => newExpanded.add(id));

		set({
			expandedFolders: newExpanded,
			currentPath: path,
		});
	},

	// Funciones de utilidad
	clear: () => {
		set(initialState);
	},

	refresh: async () => {
		set({ isLoading: true, error: null });

		try {
			// Aquí se llamaría a la server action para recargar datos
			// Por ahora solo actualizamos el timestamp
			set({
				isLoading: false,
				lastUpdated: new Date(),
			});
		} catch (error) {
			set({
				isLoading: false,
				error: error instanceof Error ? error.message : 'Error desconocido',
			});
		}
	},
});