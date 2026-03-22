/**
 * @file UI slice para el store de File
 * @module store/entities/file/slices/ui
 */

import { StateCreator } from 'zustand';
import { FileStore } from '..';

// Modos de visualización
export type ViewMode = 'list' | 'grid' | 'tree' | 'details';

// Estado
export interface UIState {
	// Detalles
	activeFileId: string | null;
	breadcrumbItems: { id: string; path: string; name: string }[];
	clipboardFiles: { id: string; path: string; action: 'copy' | 'cut' }[];
	expandedFolders: string[];

	// Modales
	isCreateFolderModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isPropertiesModalOpen: boolean;
	isRenameModalOpen: boolean;
	isUploadModalOpen: boolean;
	lastVisitedPath: string | null;
	// Selección
	selectedFileIds: string[];

	// Visualización
	viewMode: ViewMode;
}

// Acciones
export interface UIActions {
	// Clipboard
	addToClipboard: (fileId: string, filePath: string, action: 'copy' | 'cut') => void;
	clearClipboard: () => void;
	closeCreateFolderModal: () => void;
	closeDeleteModal: () => void;
	closePropertiesModal: () => void;
	closeRenameModal: () => void;
	closeUploadModal: () => void;
	collapseFolder: (path: string) => void;
	deselectAllFiles: () => void;
	deselectFile: (id: string) => void;
	expandFolder: (path: string) => void;

	// Modales
	openCreateFolderModal: () => void;
	openDeleteModal: () => void;
	openPropertiesModal: (id: string) => void;
	openRenameModal: (id: string) => void;
	openUploadModal: () => void;
	selectAllFiles: () => void;
	// Selección
	selectFile: (id: string) => void;

	// Activo
	setActiveFileId: (id: string | null) => void;
	setLastVisitedPath: (path: string | null) => void;

	// Visualización
	setViewMode: (mode: ViewMode) => void;
	toggleExpandFolder: (path: string) => void;
	toggleSelectFile: (id: string) => void;

	// Breadcrumbs
	updateBreadcrumbs: (path: string | null) => void;
}

// Estado inicial
const initialState: UIState = {
	selectedFileIds: [],
	viewMode: 'grid',
	lastVisitedPath: null,
	expandedFolders: [],
	isCreateFolderModalOpen: false,
	isDeleteModalOpen: false,
	isPropertiesModalOpen: false,
	isUploadModalOpen: false,
	isRenameModalOpen: false,
	activeFileId: null,
	clipboardFiles: [],
	breadcrumbItems: [] as { id: string; path: string; name: string }[],
};

// Crear slice
export const createUISlice: StateCreator<FileStore, [], [], UIState & UIActions> = (set, get) => ({
	...initialState,

	// Selección
	selectFile: (id) => {
		const { selectedFileIds } = get();
		if (!selectedFileIds.includes(id)) {
			set({ selectedFileIds: [...selectedFileIds, id] });
		}
	},

	deselectFile: (id) => {
		const { selectedFileIds } = get();
		set({
			selectedFileIds: selectedFileIds.filter((selectedId) => selectedId !== id),
		});
	},

	toggleSelectFile: (id) => {
		const { selectedFileIds } = get();
		if (selectedFileIds.includes(id)) {
			get().deselectFile(id);
		} else {
			get().selectFile(id);
		}
	},

	selectAllFiles: () => {
		const { files } = get();
		set({
			selectedFileIds: files.map((file) => file.id),
		});
	},

	deselectAllFiles: () => {
		set({ selectedFileIds: [] });
	},

	// Visualización
	setViewMode: (viewMode) => {
		if (get().viewMode === viewMode) return;
		set({ viewMode });
	},

	setLastVisitedPath: (lastVisitedPath) => set({ lastVisitedPath }),

	toggleExpandFolder: (path) => {
		const { expandedFolders } = get();
		if (expandedFolders.includes(path)) {
			set({ expandedFolders: expandedFolders.filter((p) => p !== path) });
		} else {
			set({ expandedFolders: [...expandedFolders, path] });
		}
	},

	expandFolder: (path) => {
		const { expandedFolders } = get();
		if (!expandedFolders.includes(path)) {
			set({ expandedFolders: [...expandedFolders, path] });
		}
	},

	collapseFolder: (path) => {
		const { expandedFolders } = get();
		set({ expandedFolders: expandedFolders.filter((p) => p !== path) });
	},

	// Modales
	openCreateFolderModal: () => set({ isCreateFolderModalOpen: true }),
	closeCreateFolderModal: () => set({ isCreateFolderModalOpen: false }),
	openDeleteModal: () => set({ isDeleteModalOpen: true }),
	closeDeleteModal: () => set({ isDeleteModalOpen: false }),
	openPropertiesModal: (id) =>
		set({
			isPropertiesModalOpen: true,
			activeFileId: id,
		}),
	closePropertiesModal: () =>
		set({
			isPropertiesModalOpen: false,
			activeFileId: null,
		}),
	openUploadModal: () => set({ isUploadModalOpen: true }),
	closeUploadModal: () => set({ isUploadModalOpen: false }),
	openRenameModal: (id) =>
		set({
			isRenameModalOpen: true,
			activeFileId: id,
		}),
	closeRenameModal: () =>
		set({
			isRenameModalOpen: false,
			activeFileId: null,
		}),

	// Clipboard
	addToClipboard: (fileId, filePath, action) => {
		const clipboardItem = { id: fileId, path: filePath, action };
		set({ clipboardFiles: [clipboardItem] }); // Reemplazar el clipboard actual
	},

	clearClipboard: () => set({ clipboardFiles: [] }),

	// Breadcrumbs
	updateBreadcrumbs: (path) => {
		if (!path) {
			set({ breadcrumbItems: [] });
			return;
		}

		// Dividir la ruta en segmentos
		const segments = path.split('/').filter(Boolean);
		const breadcrumbs: { id: string; path: string; name: string }[] = [];

		// Construir la ruta acumulativa
		let currentPath = '';
		for (let index = 0; index < segments.length; index++) {
			const segment = segments[index];
			currentPath += (index === 0 ? '' : '/') + segment;
			breadcrumbs.push({
				id: `breadcrumb-${index}`,
				path: currentPath,
				name: segment,
			});
		}

		set({ breadcrumbItems: breadcrumbs });
	},

	// Activo
	setActiveFileId: (activeFileId) => set({ activeFileId }),
});
