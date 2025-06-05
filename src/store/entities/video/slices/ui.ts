/**
 * @file Slice para el estado de UI del store de videos
 * @module store/entities/video/slices/ui
 */

import type { StateCreator } from 'zustand';
import type { VideoViewMode } from '../../../../types/entities/video';
import type { VideoState } from '../types';

// Slice para estado de UI
export interface VideoUISlice {
	// Selección de videos
	selectVideo: (id: string | null) => void;
	deselectVideo: (id: string) => void;
	toggleVideoSelection: (id: string) => void;
	selectMultipleVideos: (ids: string[]) => void;
	clearSelection: () => void;
	getSelectedVideos: () => string[];
	isVideoSelected: (id: string) => boolean;

	// Visor de videos
	openViewer: (videoId: string) => void;
	closeViewer: () => void;
	nextVideo: () => void;
	previousVideo: () => void;
	isViewerOpen: () => boolean;
	getCurrentVideo: () => string | null;

	// Modo de visualización
	setViewMode: (viewMode: VideoViewMode) => void;
	getViewMode: () => VideoViewMode;

	// Expansión de detalles
	expandVideo: (id: string) => void;
	collapseVideo: (id: string) => void;
	toggleVideoExpansion: (id: string) => void;
	isVideoExpanded: (id: string) => boolean;

	// Resaltado
	highlightVideo: (id: string | null) => void;
	getHighlightedVideo: () => string | null;
}

// Creador del slice
export const createVideoUISlice: StateCreator<VideoState, [], [], VideoUISlice> = (set, get) => ({
	// Selección de videos
	selectVideo: (id: string | null) => {
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

	deselectVideo: (id: string) => {
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

	toggleVideoSelection: (id: string) => {
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

	selectMultipleVideos: (ids: string[]) => {
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

	getSelectedVideos: () => {
		// Asegurarse de que selectedIds está inicializado
		return get().ui.selectedIds || [];
	},

	isVideoSelected: (id: string) => {
		// Asegurarse de que selectedIds está inicializado
		const selectedIds = get().ui.selectedIds || [];
		return selectedIds.includes(id);
	},

	// Visor de videos
	openViewer: (videoId: string) => {
		set((state) => ({
			ui: {
				...state.ui,
				isViewerOpen: true,
				currentVideoId: videoId,
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

	nextVideo: () => {
		const state = get();
		const videos = Object.values(state.core.videos);
		if (videos.length === 0 || !state.ui.currentVideoId) return;

		const currentIndex = videos.findIndex((vid) => vid.id === state.ui.currentVideoId);
		if (currentIndex === -1) return;

		const nextIndex = (currentIndex + 1) % videos.length;
		set((state) => ({
			ui: {
				...state.ui,
				currentVideoId: videos[nextIndex].id,
			},
		}));
	},

	previousVideo: () => {
		const state = get();
		const videos = Object.values(state.core.videos);
		if (videos.length === 0 || !state.ui.currentVideoId) return;

		const currentIndex = videos.findIndex((vid) => vid.id === state.ui.currentVideoId);
		if (currentIndex === -1) return;

		const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
		set((state) => ({
			ui: {
				...state.ui,
				currentVideoId: videos[prevIndex].id,
			},
		}));
	},

	isViewerOpen: () => {
		return get().ui.isViewerOpen;
	},

	getCurrentVideo: () => {
		return get().ui.currentVideoId;
	},

	// Modo de visualización
	setViewMode: (viewMode: VideoViewMode) => {
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
	expandVideo: (id: string) => {
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

	collapseVideo: (id: string) => {
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

	toggleVideoExpansion: (id: string) => {
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

	isVideoExpanded: (id: string) => {
		// Asegurarse de que expandedIds está inicializado
		const expandedIds = get().ui.expandedIds || [];
		return expandedIds.includes(id);
	},

	// Resaltado
	highlightVideo: (id: string | null) => {
		set((state) => ({
			ui: {
				...state.ui,
				highlightedId: id,
			},
		}));
	},

	getHighlightedVideo: () => {
		return get().ui.highlightedId;
	},
});
