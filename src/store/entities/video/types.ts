/**
 * @file Tipos para el store de videos
 * @module store/entities/video/types
 */

import type { Video, VideoPlayState, VideoSortCriteria, VideoViewMode } from '../../../types/entities/video';

/**
 * Estado principal del store de videos
 */
export interface VideoState {
  // Slices de estado
  core: VideoCoreState;
  ui: VideoUIState;
  filters: VideoFiltersState;
  player: VideoPlayerState;
}

/**
 * Estado del slice core
 */
export interface VideoCoreState {
  videos: Record<string, Video>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Estado del slice UI
 */
export interface VideoUIState {
  selectedIds: string[];
  viewMode: VideoViewMode;
  isViewerOpen: boolean;
  currentVideoId: string | null;
  highlightedId: string | null;
  expandedIds: string[];
}

/**
 * Estado del slice de filtros
 */
export interface VideoFiltersState {
  sortBy: VideoSortCriteria;
  searchQuery: string;
  filterByFolderId: string | null;
  filterFavorites: boolean;
  filterPublic: boolean;
  filterByDuration: {
    min: number | null; // en segundos
    max: number | null; // en segundos
  };
  filterByResolution: string | null; // "hd", "fullhd", "4k", etc.
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

/**
 * Estado del reproductor de video
 */
export interface VideoPlayerState {
  isFullscreen: boolean;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  playState: VideoPlayState;
  currentTime: number;
  duration: number;
  bufferedPercentage: number;
  quality: string;
}