import { create } from 'zustand';

interface DetailsPanelState {
	isVisible: boolean;
	isFixed: boolean;
	toggleVisibility: () => void;
	toggleFixed: () => void;
	setVisible: (visible: boolean) => void;
	setFixed: (fixed: boolean) => void;
}

export const useDetailsPanel = create<DetailsPanelState>((set) => ({
	isVisible: true,
	isFixed: false,
	toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
	toggleFixed: () => set((state) => ({ isFixed: !state.isFixed })),
	setVisible: (visible: boolean) => set({ isVisible: visible }),
	setFixed: (fixed: boolean) => set({ isFixed: fixed }),
}));
