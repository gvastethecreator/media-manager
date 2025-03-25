/**
 * @file Slice para filtros y ordenación del store de imágenes
 * @module store/entities/image/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { Image, ImageSortCriteria } from '../../../../types/entities/image';
import type { ImageState } from '../types';

// Slice para filtrado y ordenación
export interface ImageFiltersSlice {
  // Establecer filtros
  setSortBy: (sortBy: ImageSortCriteria) => void;
  setSearchQuery: (query: string) => void;
  setFilterByTag: (tags: string[]) => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  setFilterByAlbum: (albums: string[]) => void;
  setFilterByFolder: (folderId: string | null) => void;
  setFilterFavorites: (onlyFavorites: boolean) => void;
  setFilterPublic: (onlyPublic: boolean) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  resetFilters: () => void;

  // Obtener imágenes filtradas
  getFilteredImages: () => Image[];
  applySort: (images: Image[]) => Image[];
  applyFilters: (images: Image[]) => Image[];
}

// Creador del slice
export const createImageFiltersSlice: StateCreator<
  ImageState,
  [],
  [],
  ImageFiltersSlice
> = (set, get) => ({
  // Establecer filtros
  setSortBy: (sortBy: ImageSortCriteria) => {
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

  setFilterByTag: (tags: string[]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByTag: tags,
      },
    }));
  },

  addTagFilter: (tag: string) => {
    set((state) => {
      if (state.filters.filterByTag.includes(tag)) {
        return state;
      }
      return {
        filters: {
          ...state.filters,
          filterByTag: [...state.filters.filterByTag, tag],
        },
      };
    });
  },

  removeTagFilter: (tag: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByTag: state.filters.filterByTag.filter((t) => t !== tag),
      },
    }));
  },

  setFilterByAlbum: (albums: string[]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        filterByAlbum: albums,
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
        filterByTag: [],
        filterByAlbum: [],
        filterByFolderId: null,
        filterFavorites: false,
        filterPublic: false,
        dateRange: { from: null, to: null },
      },
    }));
  },

  // Funciones de filtrado
  getFilteredImages: () => {
    const { getImages } = get();
    const images = getImages();
    return get().applySort(get().applyFilters(images));
  },

  applyFilters: (images: Image[]) => {
    const {
      searchQuery,
      filterByTag,
      filterByAlbum,
      filterByFolderId,
      filterFavorites,
      filterPublic,
      dateRange,
    } = get().filters;

    return images.filter((image) => {
      // Filtrado por búsqueda
      if (
        searchQuery &&
        !image.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(image.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filtrado por carpeta
      if (filterByFolderId && image.folderId !== filterByFolderId) {
        return false;
      }

      // Filtrado por etiquetas
      if (
        filterByTag.length > 0 &&
        (!image.tags || !filterByTag.every((tag) => image.tags?.some((t) => t.id === tag)))
      ) {
        return false;
      }

      // Filtrado por álbumes
      if (
        filterByAlbum.length > 0 &&
        (!image.albums || !filterByAlbum.some((albumId) => image.albums?.some((a) => a.id === albumId)))
      ) {
        return false;
      }

      // Filtrado por favoritos
      if (filterFavorites && !image.isFavorite) {
        return false;
      }

      // Filtrado por público/privado
      if (filterPublic && !image.isPublic) {
        return false;
      }

      // Filtrado por rango de fechas
      if (dateRange.from && new Date(image.createdAt) < dateRange.from) {
        return false;
      }

      if (dateRange.to) {
        // Agregar un día al límite superior para que sea inclusivo
        const maxDate = new Date(dateRange.to);
        maxDate.setDate(maxDate.getDate() + 1);
        if (new Date(image.createdAt) >= maxDate) {
          return false;
        }
      }

      return true;
    });
  },

  applySort: (images: Image[]) => {
    const { sortBy } = get().filters;

    return [...images].sort((a, b) => {
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
          return a.size - b.size;
        case 'size_desc':
          return b.size - a.size;
        case 'dimensions_asc':
          return a.width * a.height - b.width * b.height;
        case 'dimensions_desc':
          return b.width * b.height - a.width * a.height;
        case 'views_asc':
          return (a.stats?.views || 0) - (b.stats?.views || 0);
        case 'views_desc':
          return (b.stats?.views || 0) - (a.stats?.views || 0);
        default:
          return 0;
      }
    });
  },
});