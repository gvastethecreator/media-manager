import { create } from 'zustand';

interface ReindexStoreState {
	isOpen: boolean;
	isMinimized: boolean;
	/** Folder whose reindex request is in flight; enables the Stop control. */
	runningFolderId: string | null;
	progress: number;
	statusText: string;
	// Acciones
	setOpen: (open: boolean) => void;
	setRunningFolderId: (folderId: string | null) => void;
	setMinimized: (minimized: boolean) => void;
	toggleMinimized: () => void;
	setProgress: (progress: number) => void;
	setStatusText: (statusText: string) => void;
	close: () => void;
}

export const useReindexStore = create<ReindexStoreState>((set) => ({
	isOpen: false,
	isMinimized: false,
	runningFolderId: null,
	progress: 0,
	statusText: 'Iniciando...',

	setOpen: (open) => set({ isOpen: open }),
	setRunningFolderId: (runningFolderId) => set({ runningFolderId }),
	setMinimized: (minimized) => set({ isMinimized: minimized }),
	toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
	setProgress: (progress) => set({ progress }),
	setStatusText: (statusText) => set({ statusText }),
	close: () => set({ isOpen: false, isMinimized: false, progress: 0, statusText: 'Iniciando...' }),
}));
