/**
 * @file Slice para filtros y ordenación del store de álbumes
 * @module store/entities/album/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { Album, AlbumSortCriteria, AlbumType } from '../../../../types/entities/album';
import type { AlbumState } from '../types';

// Slice para filtrado y ordenación
export interface AlbumFiltersSlice {
	// Establecer filtros
	setSortBy: (sortBy: AlbumSortCriteria) => void;
	setSearchQuery: (query: string) => void;
	setFilterByType: (type: AlbumType | null) => void;
	setFilterByParentId: (parentId: string | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setFilterShared: (onlyShared: boolean) => void;
	setFilterArchived: (includeArchived: boolean) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	resetFilters: () => void;

	// Obtener álbumes filtrados
	getFilteredAlbums: () => Album[];
	applySort: (albums: Album[]) => Album[];
	applyFilters: (albums: Album[]) => Album[];
}

// Creador del slice
export const createAlbumFiltersSlice: StateCreator<AlbumState, [], [], AlbumFiltersSlice> = (set, get) => ({
	// Establecer filtros
	setSortBy: (sortBy: AlbumSortCriteria) => {
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

	setFilterByType: (type: AlbumType | null) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByType: type,
			},
		}));
	},

	setFilterByParentId: (parentId: string | null) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByParentId: parentId,
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

	setFilterShared: (onlyShared: boolean) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterShared: onlyShared,
			},
		}));
	},

	setFilterArchived: (includeArchived: boolean) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterArchived: includeArchived,
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
				filterByType: null,
				filterByParentId: null,
				filterFavorites: false,
				filterShared: false,
				filterArchived: false,
				dateRange: { from: null, to: null },
			},
		}));
	},

	// Funciones de filtrado
	getFilteredAlbums: () => {
		const { getAlbums } = get();
		const albums = getAlbums();
		return get().applySort(get().applyFilters(albums));
	},

	applyFilters: (albums: Album[]) => {
		const { searchQuery, filterByType, filterByParentId, filterFavorites, filterShared, filterArchived, dateRange } =
			get().filters;

		return albums.filter((album) => {
			// Filtrado por búsqueda
			if (
				searchQuery &&
				!album.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!(album.description || '').toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}

			// Filtrado por tipo
			if (filterByType && album.type !== filterByType) {
				return false;
			}

			// Filtrado por álbum padre
			if (filterByParentId !== null) {
				if (filterByParentId === 'root') {
					// Álbumes raíz (sin padre)
					if (album.parentId) {
						return false;
					}
				} else if (album.parentId !== filterByParentId) {
					return false;
				}
			}

			// Filtrado por favoritos (si existe la propiedad)
			if (filterFavorites && !album.isFavorite) {
				return false;
			}

			// Filtrado por compartidos
			if (filterShared && (!album.sharedWith || album.sharedWith.length === 0)) {
				return false;
			}

			// Filtrado por archivados
			if (!filterArchived && album.isArchived) {
				return false;
			}

			// Filtrado por rango de fechas
			if (dateRange.from && new Date(album.createdAt) < dateRange.from) {
				return false;
			}

			if (dateRange.to) {
				// Agregar un día al límite superior para que sea inclusivo
				const maxDate = new Date(dateRange.to);
				maxDate.setDate(maxDate.getDate() + 1);
				if (new Date(album.createdAt) >= maxDate) {
					return false;
				}
			}

			return true;
		});
	},

	applySort: (albums: Album[]) => {
		const { sortBy } = get().filters;

		return [...albums].sort((a, b) => {
			switch (sortBy) {
				case 'name_asc':
					return a.name.localeCompare(b.name);
				case 'name_desc':
					return b.name.localeCompare(a.name);
				case 'date_created_asc':
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case 'date_created_desc':
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case 'date_updated_asc':
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
				case 'date_updated_desc':
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				case 'item_count_asc':
					return (a.metadata?.itemCount || 0) - (b.metadata?.itemCount || 0);
				case 'item_count_desc':
					return (b.metadata?.itemCount || 0) - (a.metadata?.itemCount || 0);
				case 'custom':
					// Ordenar por sortOrder si existe, si no por nombre
					return (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name);
				default:
					return 0;
			}
		});
	},
});
