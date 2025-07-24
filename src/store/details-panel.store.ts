import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnyEntityWithStats } from '@/types/migration';

interface DetailsPanelState {
	isVisible: boolean;
	isFixed: boolean;
	showStatsWhenEmpty: boolean;
	selectedItems: AnyEntityWithStats[];
	toggleVisibility: () => void;
	toggleFixed: () => void;
	toggleShowStatsWhenEmpty: () => void;
	setVisible: (visible: boolean) => void;
	setFixed: (fixed: boolean) => void;
	setShowStatsWhenEmpty: (show: boolean) => void;
	setSelectedItems: (items: AnyEntityWithStats[]) => void;
}

export const useDetailsPanel = create<DetailsPanelState>()(
	persist(
		(set, get) => ({
			isVisible: true,
			isFixed: false,
			showStatsWhenEmpty: true,
			selectedItems: [],
			toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
			toggleFixed: () => set((state) => ({ isFixed: !state.isFixed })),
			toggleShowStatsWhenEmpty: () => set((state) => ({ showStatsWhenEmpty: !state.showStatsWhenEmpty })),
			setVisible: (visible: boolean) => {
				if (get().isVisible !== visible) {
					set({ isVisible: visible });
				}
			},
			setFixed: (fixed: boolean) => {
				if (get().isFixed !== fixed) {
					set({ isFixed: fixed });
				}
			},
			setShowStatsWhenEmpty: (show: boolean) => {
				if (get().showStatsWhenEmpty !== show) {
					set({ showStatsWhenEmpty: show });
				}
			},
			setSelectedItems: (items: AnyEntityWithStats[]) => {
				const currentItems = get().selectedItems;

				if (currentItems.length !== items.length) {
					set({ selectedItems: items });
					return;
				}

				const currentIds = new Set(currentItems.map((item) => item.id));
				const newIds = new Set(items.map((item) => item.id));

				if (currentIds.size !== newIds.size || ![...currentIds].every((id) => newIds.has(id))) {
					set({ selectedItems: items });
				}
			},
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

/**
 * 📝 Store actualizado para usar EntityWithStats
 * - Reemplaza ImageItem con EntityWithStats
 * - Mantiene la misma funcionalidad
 * - Compatible con el nuevo sistema de tipos
 */
