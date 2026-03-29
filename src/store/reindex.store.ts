import { create } from 'zustand';

interface ReindexStoreState {
	isOpen: boolean;
	isMinimized: boolean;
	progress: number;
	statusText: string;
	// Acciones
	setOpen: (open: boolean) => void;
	setMinimized: (minimized: boolean) => void;
	toggleMinimized: () => void;
	setProgress: (progress: number) => void;
	setStatusText: (statusText: string) => void;
	close: () => void;
}

export const useReindexStore = create<ReindexStoreState>((set) => ({
	isOpen: false,
	isMinimized: false,
	progress: 0,
	statusText: 'Iniciando...',

	setOpen: (open) => set({ isOpen: open }),
	setMinimized: (minimized) => set({ isMinimized: minimized }),
	toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
	setProgress: (progress) => set({ progress }),
	setStatusText: (statusText) => set({ statusText }),
	close: () => set({ isOpen: false, isMinimized: false, progress: 0, statusText: 'Iniciando...' }),
}));
