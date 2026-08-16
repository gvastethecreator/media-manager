/**
 * @file Slice para el estado de UI del store de videos
 * @module store/entities/video/slices/ui
 */

import type { StateCreator } from 'zustand';
import { VideoViewMode } from '@/types/entities/video';
import type { VideoStore } from '..';

export interface VideoUIState {
	currentVideoId: string | null;
	expandedIds: string[];
	highlightedId: string | null;
	isViewerOpen: boolean;
	selectedIds: string[];
	viewMode: VideoViewMode;
}

export const initialUIState: VideoUIState = {
	selectedIds: [],
	viewMode: VideoViewMode.GRID,
	isViewerOpen: false,
	currentVideoId: null,
	highlightedId: null,
	expandedIds: [],
};

// Slice para estado de UI
export interface VideoUISlice extends VideoUIState {
	clearSelection: () => void;
	closeViewer: () => void;
	collapseVideo: (id: string) => void;
	deselectVideo: (id: string) => void;

	// Expansión de detalles
	expandVideo: (id: string) => void;
	getCurrentVideo: () => string | null;
	getHighlightedVideo: () => string | null;
	getSelectedVideos: () => string[];
	getViewMode: () => VideoViewMode;

	// Resaltado
	highlightVideo: (id: string | null) => void;
	isVideoExpanded: (id: string) => boolean;
	isVideoSelected: (id: string) => boolean;
	nextVideo: () => void;

	// Visor de videos
	openViewer: (videoId: string) => void;
	previousVideo: () => void;
	selectMultipleVideos: (ids: string[]) => void;
	// Selección de videos
	selectVideo: (id: string | null) => void;

	// Modo de visualización
	setViewMode: (viewMode: VideoViewMode) => void;
	toggleVideoExpansion: (id: string) => void;
	toggleVideoSelection: (id: string) => void;
}

// Creador del slice
export const createVideoUISlice: StateCreator<VideoStore, [], [], VideoUISlice> = (set, get) => ({
	...initialUIState,
	// Selección de videos
	selectVideo: (id) => {
		if (id === null) {
			set({ selectedIds: [] });
			return;
		}
		set((state) => ({
			selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id],
		}));
	},

	deselectVideo: (id) => set((state) => ({ selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) })),

	toggleVideoSelection: (id) => {
		set((state) => ({
			selectedIds: state.selectedIds.includes(id)
				? state.selectedIds.filter((selectedId) => selectedId !== id)
				: [...state.selectedIds, id],
		}));
	},

	selectMultipleVideos: (ids) => {
		set((state) => ({
			selectedIds: [...new Set([...state.selectedIds, ...ids])],
		}));
	},

	clearSelection: () => set({ selectedIds: [] }),
	getSelectedVideos: () => get().selectedIds,
	isVideoSelected: (id) => get().selectedIds.includes(id),

	// Visor de videos
	openViewer: (videoId) => set({ isViewerOpen: true, currentVideoId: videoId }),
	closeViewer: () => set({ isViewerOpen: false }),

	nextVideo: () => {
		const { videos, currentVideoId } = get();
		const videoArray = Object.values(videos);
		if (videoArray.length === 0 || !currentVideoId) {
			return;
		}

		const currentIndex = videoArray.findIndex((vid) => vid.id === currentVideoId);
		if (currentIndex === -1) {
			return;
		}

		const nextIndex = (currentIndex + 1) % videoArray.length;
		set({ currentVideoId: videoArray[nextIndex].id });
	},

	previousVideo: () => {
		const { videos, currentVideoId } = get();
		const videoArray = Object.values(videos);
		if (videoArray.length === 0 || !currentVideoId) {
			return;
		}

		const currentIndex = videoArray.findIndex((vid) => vid.id === currentVideoId);
		if (currentIndex === -1) {
			return;
		}

		const prevIndex = (currentIndex - 1 + videoArray.length) % videoArray.length;
		set({ currentVideoId: videoArray[prevIndex].id });
	},

	getCurrentVideo: () => get().currentVideoId,

	// Modo de visualización
	setViewMode: (viewMode) => {
		if (get().viewMode === viewMode) return;
		set({ viewMode });
	},
	getViewMode: () => get().viewMode,

	// Expansión de detalles
	expandVideo: (id) => {
		set((state) => ({
			expandedIds: state.expandedIds.includes(id) ? state.expandedIds : [...state.expandedIds, id],
		}));
	},

	collapseVideo: (id) => set((state) => ({ expandedIds: state.expandedIds.filter((expandedId) => expandedId !== id) })),

	toggleVideoExpansion: (id) => {
		set((state) => ({
			expandedIds: state.expandedIds.includes(id)
				? state.expandedIds.filter((expandedId) => expandedId !== id)
				: [...state.expandedIds, id],
		}));
	},

	isVideoExpanded: (id) => get().expandedIds.includes(id),

	// Resaltado
	highlightVideo: (id) => set({ highlightedId: id }),
	getHighlightedVideo: () => get().highlightedId,
});
