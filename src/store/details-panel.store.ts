import type { ImageItem } from '@/types/image-item';
import { create } from 'zustand';

interface DetailsPanelState {
	isVisible: boolean;
	isFixed: boolean;
	selectedItems: ImageItem[];
	toggleVisibility: () => void;
	toggleFixed: () => void;
	setVisible: (visible: boolean) => void;
	setFixed: (fixed: boolean) => void;
	setSelectedItems: (items: ImageItem[]) => void;
}

export const useDetailsPanel = create<DetailsPanelState>((set) => ({
	isVisible: true,
	isFixed: false,
	selectedItems: [],
	toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
	toggleFixed: () => set((state) => ({ isFixed: !state.isFixed })),
	setVisible: (visible: boolean) => set({ isVisible: visible }),
	setFixed: (fixed: boolean) => set({ isFixed: fixed }),
	setSelectedItems: (items: ImageItem[]) => set({ selectedItems: items }),
}));
