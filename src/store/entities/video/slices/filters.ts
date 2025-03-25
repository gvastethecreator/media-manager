/**
 * @file Slice para filtros y ordenación del store de videos
 * @module store/entities/video/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { Video, VideoSortCriteria } from '../../../../types/entities/video';
import type { VideoState } from '../types';

// Slice para filtrado y ordenación
export interface VideoFiltersSlice {
  // Establecer filtros
  setSortBy: (sortBy: VideoSortCriteria) => void;
  setSearchQuery: (query: string) => void;
  setFilterByFolder: (folderId: string | null) => void;
  setFilterFavorites: (onlyFavorites: boolean) => void;
  setFilterPublic: (onlyPublic: boolean) => void;
  setFilterByDuration: (min: number | null, max: number | null) => void;
  setFilterByResolution: (resolution: string | null) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  resetFilters: () => void;

  // Obtener videos filtrados
  getFilteredVideos: () => Video[];
  applySort: (videos: Video[]) => Video[];
  applyFilters: (videos: Video[]) => Video[];
}

// Creador del slice
export const createVideoFiltersSlice: StateCreator<
  VideoState,
  [],
  [],
  VideoFiltersSlice
> = (set, get) => ({
  // Establecer filtros
  setSortBy: (sortBy: VideoSortCriteria) => {
    set((state) => ({
      filters: {
        ...state.filters,
        sortBy,
      },
    }));
  },

  setSearchQuery: (query: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: query,
      },
    }));
  },

  setFilterByFolder: (folderId: string | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByFolderId: folderId,
      },
    }));
  },

  setFilterFavorites: (onlyFavorites: boolean) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterFavorites: onlyFavorites,
      },
    }));
  },

  setFilterPublic: (onlyPublic: boolean) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterPublic: onlyPublic,
      },
    }));
  },

  setFilterByDuration: (min: number | null, max: number | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByDuration: { min, max },
      },
    }));
  },

  setFilterByResolution: (resolution: string | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByResolution: resolution,
      },
    }));
  },

  setDateRange: (from: Date | null, to: Date | null) => {
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: { from, to },
      },
    }));
  },

  resetFilters: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: '',
        filterByFolderId: null,
        filterFavorites: false,
        filterPublic: false,
        filterByDuration: { min: null, max: null },
        filterByResolution: null,
        dateRange: { from: null, to: null },
      },
    }));
  },

  // Funciones de filtrado
  getFilteredVideos: () => {
    const { getVideos } = get();
    const videos = getVideos();
    return get().applySort(get().applyFilters(videos));
  },

  applyFilters: (videos: Video[]) => {
    const {
      searchQuery,
      filterByFolderId,
      filterFavorites,
      filterPublic,
      filterByDuration,
      filterByResolution,
      dateRange,
    } = get().filters;

    return videos.filter((video) => {
      // Filtrado por búsqueda
      if (
        searchQuery &&
        !video.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(video.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filtrado por carpeta
      if (filterByFolderId && video.folderId !== filterByFolderId) {
        return false;
      }

      // Filtrado por favoritos
      if (filterFavorites && !video.isFavorite) {
        return false;
      }

      // Filtrado por público/privado
      if (filterPublic && !video.isPublic) {
        return false;
      }

      // Filtrado por duración
      if (video.metadata?.duration) {
        if (filterByDuration.min !== null && video.metadata.duration < filterByDuration.min) {
          return false;
        }
        if (filterByDuration.max !== null && video.metadata.duration > filterByDuration.max) {
          return false;
        }
      }

      // Filtrado por resolución
      if (filterByResolution && video.metadata?.height) {
        switch (filterByResolution) {
          case '4k':
            if (video.metadata.height < 2160) return false;
            break;
          case '2k':
            if (video.metadata.height < 1440 || video.metadata.height >= 2160) return false;
            break;
          case 'fullhd':
            if (video.metadata.height < 1080 || video.metadata.height >= 1440) return false;
            break;
          case 'hd':
            if (video.metadata.height < 720 || video.metadata.height >= 1080) return false;
            break;
          case 'sd':
            if (video.metadata.height >= 720) return false;
            break;
        }
      }

      // Filtrado por rango de fechas
      if (dateRange.from && new Date(video.createdAt) < dateRange.from) {
        return false;
      }

      if (dateRange.to) {
        // Agregar un día al límite superior para que sea inclusivo
        const maxDate = new Date(dateRange.to);
        maxDate.setDate(maxDate.getDate() + 1);
        if (new Date(video.createdAt) >= maxDate) {
          return false;
        }
      }

      return true;
    });
  },

  applySort: (videos: Video[]) => {
    const { sortBy } = get().filters;

    return [...videos].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size_asc':
          return (a.metadata?.size || 0) - (b.metadata?.size || 0);
        case 'size_desc':
          return (b.metadata?.size || 0) - (a.metadata?.size || 0);
        case 'duration_asc':
          return (a.metadata?.duration || 0) - (b.metadata?.duration || 0);
        case 'duration_desc':
          return (b.metadata?.duration || 0) - (a.metadata?.duration || 0);
        case 'resolution_asc':
          return ((a.metadata?.width || 0) * (a.metadata?.height || 0)) -
                 ((b.metadata?.width || 0) * (b.metadata?.height || 0));
        case 'resolution_desc':
          return ((b.metadata?.width || 0) * (b.metadata?.height || 0)) -
                 ((a.metadata?.width || 0) * (a.metadata?.height || 0));
        default:
          return 0;
      }
    });
  },
});