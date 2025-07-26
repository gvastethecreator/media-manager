/**
 * @file Slice para el estado de UI del store de videos
 * @module store/entities/video/slices/ui
 */

import type { StateCreator } from 'zustand';
import { VideoViewMode } from '@/types/entities/video';
import type { VideoStore } from '..';

export interface VideoUIState {
	selectedIds: string[];
	viewMode: VideoViewMode;
	isViewerOpen: boolean;
	currentVideoId: string | null;
	highlightedId: string | null;
	expandedIds: string[];
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
		if (videoArray.length === 0 || !currentVideoId) return;

		const currentIndex = videoArray.findIndex((vid) => vid.id === currentVideoId);
		if (currentIndex === -1) return;

		const nextIndex = (currentIndex + 1) % videoArray.length;
		set({ currentVideoId: videoArray[nextIndex].id });
	},

	previousVideo: () => {
		const { videos, currentVideoId } = get();
		const videoArray = Object.values(videos);
		if (videoArray.length === 0 || !currentVideoId) return;

		const currentIndex = videoArray.findIndex((vid) => vid.id === currentVideoId);
		if (currentIndex === -1) return;

		const prevIndex = (currentIndex - 1 + videoArray.length) % videoArray.length;
		set({ currentVideoId: videoArray[prevIndex].id });
	},

	isViewerOpen: () => get().isViewerOpen,
	getCurrentVideo: () => get().currentVideoId,

	// Modo de visualización
	setViewMode: (viewMode) => set({ viewMode }),
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
