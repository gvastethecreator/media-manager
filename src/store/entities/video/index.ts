/**
 * @file Store principal para la entidad Video
 * @module store/entities/video
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createVideoCoreSlice, initialCoreState, type VideoCoreSlice } from './slices/core';
import { createVideoFiltersSlice, initialFiltersState, type VideoFiltersSlice } from './slices/filters';
import { createVideoPlayerSlice, initialPlayerState, type VideoPlayerSlice } from './slices/player';
import { createVideoUISlice, initialUIState, type VideoUISlice } from './slices/ui';

// Tipo del store completo
export type VideoStore = VideoCoreSlice & VideoUISlice & VideoFiltersSlice & VideoPlayerSlice;

// Estado inicial plano
const initialState: VideoStore = {
	...initialCoreState,
	...initialUIState,
	...initialFiltersState,
	...initialPlayerState,
};

// Crear store combinando slices
export const useVideoStore = create<VideoStore>()(
	devtools(
		persist(
			(...a) => ({
				...initialState,
				...createVideoCoreSlice(...a),
				...createVideoUISlice(...a),
				...createVideoFiltersSlice(...a),
				...createVideoPlayerSlice(...a),
			}),
			{
				name: 'video-store',
				partialize: (state) => ({
					// Core state no se persiste para evitar datos obsoletos
					// Filters
					sortBy: state.sortBy,
					filterFavorites: state.filterFavorites,
					filterPublic: state.filterPublic,
					// UI
					viewMode: state.viewMode,
					// Player
					volume: state.volume,
					playbackRate: state.playbackRate,
					isMuted: state.isMuted,
					quality: state.quality,
				}),
			}
		),
		{ name: 'VideoStore' }
	)
);

// Exportar slices para poder extenderlos
export { createVideoCoreSlice } from './slices/core';
export { createVideoFiltersSlice } from './slices/filters';
export { createVideoPlayerSlice } from './slices/player';
export { createVideoUISlice } from './slices/ui';
// Exportar todo desde types
export * from './types';
