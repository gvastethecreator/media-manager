'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageItem } from '@/components/features/file-viewer/file-viewer.types';

export interface FileViewerState {
	closeViewer: () => void;
	currentIndex: number;

	// Selectores
	getCurrentItem: () => ImageItem | null;
	// Estado
	isOpen: boolean;
	items: ImageItem[];
	nextItem: () => void;

	// Acciones
	openViewer: (items: ImageItem[], initialIndex?: number) => void;
	previousItem: () => void;
	setCurrentIndex: (index: number) => void;
}

/**
 * Store para gestionar el estado del visor de archivos
 */
export const useFileViewerStore = create<FileViewerState>()(
	persist(
		(set, get) => ({
			// Estado inicial
			isOpen: false,
			currentIndex: 0,
			items: [],

			// Acciones
			openViewer: (items, initialIndex = 0) =>
				set({
					isOpen: true,
					items,
					currentIndex: initialIndex >= 0 && initialIndex < items.length ? initialIndex : 0,
				}),

			closeViewer: () => set({ isOpen: false }),

			setCurrentIndex: (index) => {
				const { items } = get();
				if (index >= 0 && index < items.length) {
					set({ currentIndex: index });
				}
			},

			nextItem: () => {
				const { currentIndex, items } = get();
				const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				set({ currentIndex: newIndex });
			},

			previousItem: () => {
				const { currentIndex, items } = get();
				const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				set({ currentIndex: newIndex });
			},

			// Selectores
			getCurrentItem: () => {
				const { items, currentIndex } = get();
				return items[currentIndex] || null;
			},
		}),
		{
			name: 'file-viewer-store',
			partialize: (_state) => ({
				// No persistir los items, solo las preferencias
			}),
		}
	)
);
