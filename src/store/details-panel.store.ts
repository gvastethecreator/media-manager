import type { ImageItem } from '@/types/image-item';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DetailsPanelState {
	isVisible: boolean;
	isFixed: boolean;
	showStatsWhenEmpty: boolean;
	selectedItems: ImageItem[];
	toggleVisibility: () => void;
	toggleFixed: () => void;
	toggleShowStatsWhenEmpty: () => void;
	setVisible: (visible: boolean) => void;
	setFixed: (fixed: boolean) => void;
	setShowStatsWhenEmpty: (show: boolean) => void;
	setSelectedItems: (items: ImageItem[]) => void;
}

export const useDetailsPanel = create<DetailsPanelState>()(
	persist(
		(set) => ({
			isVisible: true,
			isFixed: false,
			showStatsWhenEmpty: true,
			selectedItems: [],
			toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
			toggleFixed: () => set((state) => ({ isFixed: !state.isFixed })),
			toggleShowStatsWhenEmpty: () => set((state) => ({ showStatsWhenEmpty: !state.showStatsWhenEmpty })),
			setVisible: (visible: boolean) => set({ isVisible: visible }),
			setFixed: (fixed: boolean) => set({ isFixed: fixed }),
			setShowStatsWhenEmpty: (show: boolean) => set({ showStatsWhenEmpty: show }),
			setSelectedItems: (items: ImageItem[]) => set({ selectedItems: items }),
		}),
		{
			name: 'details-panel-storage',
			partialize: (state) => ({
				isVisible: state.isVisible,
				isFixed: state.isFixed,
				showStatsWhenEmpty: state.showStatsWhenEmpty,
			}),
		}
	)
);
