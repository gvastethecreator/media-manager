/**
 * @file Tipos para el store de álbumes
 * @module store/entities/album/types
 */

import type {
    Album,
    AlbumDisplayState,
    AlbumSortCriteria,
    AlbumType,
    AlbumViewMode
} from '../../../types/entities/album';

/**
 * Estado principal del store de álbumes
 */
export interface AlbumState {
  // Slices de estado
  core: AlbumCoreState;
  ui: AlbumUIState;
  filters: AlbumFiltersState;
}

/**
 * Estado del slice core
 */
export interface AlbumCoreState {
  albums: Record<string, Album>;
  albumItems: Record<string, Array<{ id: string, type: 'image' | 'video' }>>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Estado del slice UI
 */
export interface AlbumUIState {
  selectedIds: string[];
  viewMode: AlbumViewMode;
  isViewerOpen: boolean;
  currentAlbumId: string | null;
  displayState: Record<string, AlbumDisplayState>;
  draggedAlbumId: string | null;
  dropTargetAlbumId: string | null;
  highlightedId: string | null;
  expandedIds: string[];
}

/**
 * Estado del slice de filtros
 */
export interface AlbumFiltersState {
  sortBy: AlbumSortCriteria;
  searchQuery: string;
  filterByType: AlbumType | null;
  filterByParentId: string | null;
  filterFavorites: boolean;
  filterShared: boolean;
  filterArchived: boolean;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}