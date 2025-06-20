/**
 * @file Slice para el estado de UI del store de imágenes
 * @module store/entities/image/slices/ui
 */

import type { StateCreator } from 'zustand';
import type { ImageViewMode } from '../../../../types/entities/image/types';
import type { ImageState } from '../types';

// Slice para estado de UI
export interface ImageUISlice {
	// Selección de imágenes
	selectImage: (id: string | null) => void;
	deselectImage: (id: string) => void;
	toggleImageSelection: (id: string) => void;
	selectMultipleImages: (ids: string[]) => void;
	clearSelection: () => void;
	getSelectedImages: () => string[];
	isImageSelected: (id: string) => boolean;

	// Visor de imágenes
	openViewer: (imageId: string) => void;
	closeViewer: () => void;
	nextImage: () => void;
	previousImage: () => void;
	isViewerOpen: () => boolean;
	getCurrentImage: () => string | null;

	// Modo de visualización
	setViewMode: (viewMode: ImageViewMode) => void;
	getViewMode: () => ImageViewMode;

	// Expansión de detalles
	expandImage: (id: string) => void;
	collapseImage: (id: string) => void;
	toggleImageExpansion: (id: string) => void;
	isImageExpanded: (id: string) => boolean;

	// Resaltado
	highlightImage: (id: string | null) => void;
	getHighlightedImage: () => string | null;
}

// Creador del slice
export const createImageUISlice: StateCreator<ImageState, [], [], ImageUISlice> = (set, get) => ({
	// Selección de imágenes
	selectImage: (id: string | null) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			set((state) => ({
				ui: {
					...state.ui,
					selectedIds: [],
				},
			}));
			return;
		}

		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.includes(id) ? currentSelectedIds : [...currentSelectedIds, id],
				},
			};
		});
	},

	deselectImage: (id: string) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				},
			};
		});
	},

	toggleImageSelection: (id: string) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.includes(id)
						? currentSelectedIds.filter((selectedId) => selectedId !== id)
						: [...currentSelectedIds, id],
				},
			};
		});
	},

	selectMultipleImages: (ids: string[]) => {
		set((state) => {
			// Asegurarse de que selectedIds está inicializado
			const currentSelectedIds = state.ui.selectedIds || [];
			const uniqueIds = [...new Set([...currentSelectedIds, ...ids])];

			return {
				ui: {
					...state.ui,
					selectedIds: uniqueIds,
				},
			};
		});
	},

	clearSelection: () => {
		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));
	},

	getSelectedImages: () => {
		// Asegurarse de que selectedIds está inicializado
		return get().ui.selectedIds || [];
	},

	isImageSelected: (id: string) => {
		// Asegurarse de que selectedIds está inicializado
		const selectedIds = get().ui.selectedIds || [];
		return selectedIds.includes(id);
	},

	// Visor de imágenes
	openViewer: (imageId: string) => {
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: true,
				currentImageId: imageId,
			},
		}));
	},

	closeViewer: () => {
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: false,
			},
		}));
	},

	nextImage: () => {
		const state = get();
		const images = Object.values(state.core.images);
		if (images.length === 0 || !state.ui.currentImageId) return;

		const currentIndex = images.findIndex((img) => img.id === state.ui.currentImageId);
		if (currentIndex === -1) return;

		const nextIndex = (currentIndex + 1) % images.length;
		set((state) => ({
			ui: {
				...state.ui,
				currentImageId: images[nextIndex].id,
			},
		}));
	},

	previousImage: () => {
		const state = get();
		const images = Object.values(state.core.images);
		if (images.length === 0 || !state.ui.currentImageId) return;

		const currentIndex = images.findIndex((img) => img.id === state.ui.currentImageId);
		if (currentIndex === -1) return;

		const prevIndex = (currentIndex - 1 + images.length) % images.length;
		set((state) => ({
			ui: {
				...state.ui,
				currentImageId: images[prevIndex].id,
			},
		}));
	},

	isViewerOpen: () => {
		return get().ui.isViewerOpen;
	},

	getCurrentImage: () => {
		return get().ui.currentImageId;
	},

	// Modo de visualización
	setViewMode: (viewMode: ImageViewMode) => {
		set((state) => ({
			ui: {
				...state.ui,
				viewMode,
			},
		}));
	},

	getViewMode: () => {
		return get().ui.viewMode;
	},

	// Expansión de detalles
	expandImage: (id: string) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.includes(id) ? currentExpandedIds : [...currentExpandedIds, id],
				},
			};
		});
	},

	collapseImage: (id: string) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				},
			};
		});
	},

	toggleImageExpansion: (id: string) => {
		set((state) => {
			// Asegurarse de que expandedIds está inicializado
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.includes(id)
						? currentExpandedIds.filter((expandedId) => expandedId !== id)
						: [...currentExpandedIds, id],
				},
			};
		});
	},

	isImageExpanded: (id: string) => {
		// Asegurarse de que expandedIds está inicializado
		const expandedIds = get().ui.expandedIds || [];
		return expandedIds.includes(id);
	},

	// Resaltado
	highlightImage: (id: string | null) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	getHighlightedImage: () => {
		return get().ui.highlightedId;
	},
});
