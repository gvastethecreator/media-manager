/**
 * @file Store principal para la entidad Video
 * @module store/entities/video
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
    VideoPlayState,
    VideoSortCriteria,
    VideoViewMode
} from '../../../types/entities/video';
import { type VideoCoreSlice, createVideoCoreSlice } from './slices/core';
import { type VideoFiltersSlice, createVideoFiltersSlice } from './slices/filters';
import { type VideoPlayerSlice, createVideoPlayerSlice } from './slices/player';
import { type VideoUISlice, createVideoUISlice } from './slices/ui';
import type { VideoState } from './types';

// Tipo del store completo
export type VideoStore = VideoCoreSlice & VideoUISlice & VideoFiltersSlice & VideoPlayerSlice;

// Estado inicial
const initialState: VideoState = {
  core: {
    videos: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedIds: [],
    viewMode: VideoViewMode.GRID,
    isViewerOpen: false,
    currentVideoId: null,
    highlightedId: null,
    expandedIds: [],
  },
  filters: {
    sortBy: VideoSortCriteria.DATE_DESC,
    searchQuery: '',
    filterByFolderId: null,
    filterFavorites: false,
    filterPublic: false,
    filterByDuration: {
      min: null,
      max: null,
    },
    filterByResolution: null,
    dateRange: {
      from: null,
      to: null,
    },
  },
  player: {
    isFullscreen: false,
    volume: 1,
    playbackRate: 1,
    isMuted: false,
    playState: VideoPlayState.STOPPED,
    currentTime: 0,
    duration: 0,
    bufferedPercentage: 0,
    quality: 'auto',
  },
};

// Crear store combinando slices
export const useVideoStore = create<VideoStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createVideoCoreSlice(...a),
        ...createVideoUISlice(...a),
        ...createVideoFiltersSlice(...a),
        ...createVideoPlayerSlice(...a),
      }),
      {
        name: 'video-store',
        partialize: (state) => ({
          ui: {
            viewMode: state.ui.viewMode,
          },
          filters: {
            sortBy: state.filters.sortBy,
          },
          player: {
            volume: state.player.volume,
            playbackRate: state.player.playbackRate,
            isMuted: state.player.isMuted,
            quality: state.player.quality,
          },
        }),
      }
    ),
    { name: 'VideoStore' }
  )
);

// Exportar todo desde types
export * from './types';

// Exportar slices para poder extenderlos
export { createVideoCoreSlice } from './slices/core';
export { createVideoFiltersSlice } from './slices/filters';
export { createVideoPlayerSlice } from './slices/player';
export { createVideoUISlice } from './slices/ui';
