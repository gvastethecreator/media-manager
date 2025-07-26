/**
 * @file Slice para filtros y ordenación del store de videos
 * @module store/entities/video/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { VideoWithStats } from '../../../../types/entities/video';
import { VideoSortCriteria } from '../../../../types/entities/video/enums';
import type { VideoStore } from '..';

export interface VideoFiltersState {
	sortBy: VideoSortCriteria;
	searchQuery: string;
	filterByFolderId: string | null;
	filterFavorites: boolean;
	filterPublic: boolean;
	filterByDuration: {
		min: number | null;
		max: number | null;
	};
	filterByResolution: string | null;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}

export const initialFiltersState: VideoFiltersState = {
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
};

// Slice para filtrado y ordenación
export interface VideoFiltersSlice extends VideoFiltersState {
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
	getFilteredVideos: () => VideoWithStats[];
	applySort: (videos: VideoWithStats[]) => VideoWithStats[];
	applyFilters: (videos: VideoWithStats[]) => VideoWithStats[];
}

// Creador del slice
export const createVideoFiltersSlice: StateCreator<VideoStore, [], [], VideoFiltersSlice> = (set, get) => ({
	...initialFiltersState,
	// Establecer filtros
	setSortBy: (sortBy) => set({ sortBy }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setFilterByFolder: (folderId) => set({ filterByFolderId: folderId }),
	setFilterFavorites: (onlyFavorites) => set({ filterFavorites: onlyFavorites }),
	setFilterPublic: (onlyPublic) => set({ filterPublic: onlyPublic }),
	setFilterByDuration: (min, max) => set({ filterByDuration: { min, max } }),
	setFilterByResolution: (resolution) => set({ filterByResolution: resolution }),
	setDateRange: (from, to) => set({ dateRange: { from, to } }),
	resetFilters: () =>
		set({
			searchQuery: '',
			filterByFolderId: null,
			filterFavorites: false,
			filterPublic: false,
			filterByDuration: { min: null, max: null },
			filterByResolution: null,
			dateRange: { from: null, to: null },
		}),

	// Funciones de filtrado
	getFilteredVideos: () => {
		const videos = get().getVideos();
		return get().applySort(get().applyFilters(videos));
	},

	applyFilters: (videos: VideoWithStats[]) => {
		const {
			searchQuery,
			filterByFolderId,
			filterFavorites,
			filterPublic,
			filterByDuration,
			filterByResolution,
			dateRange,
		} = get();

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
			if (video.duration) {
				if (filterByDuration.min !== null && video.duration < filterByDuration.min) {
					return false;
				}
				if (filterByDuration.max !== null && video.duration > filterByDuration.max) {
					return false;
				}
			}

			// Filtrado por resolución
			if (filterByResolution && video.height) {
				switch (filterByResolution) {
					case '4k':
						if (video.height < 2160) return false;
						break;
					case '2k':
						if (video.height < 1440 || video.height >= 2160) return false;
						break;
					case 'fullhd':
						if (video.height < 1080 || video.height >= 1440) return false;
						break;
					case 'hd':
						if (video.height < 720 || video.height >= 1080) return false;
						break;
					case 'sd':
						if (video.height >= 720) return false;
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

	applySort: (videos: VideoWithStats[]) => {
		const { sortBy } = get();
		if (!sortBy) return videos;

		return [...videos].sort((a, b) => {
			switch (sortBy) {
				case VideoSortCriteria.NAME_ASC:
					return a.name.localeCompare(b.name);
				case VideoSortCriteria.NAME_DESC:
					return b.name.localeCompare(a.name);
				case VideoSortCriteria.DATE_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case VideoSortCriteria.DATE_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case VideoSortCriteria.SIZE_ASC:
					return (a.size || 0) - (b.size || 0);
				case VideoSortCriteria.SIZE_DESC:
					return (b.size || 0) - (a.size || 0);
				case VideoSortCriteria.DURATION_ASC:
					return (a.duration || 0) - (b.duration || 0);
				case VideoSortCriteria.DURATION_DESC:
					return (b.duration || 0) - (a.duration || 0);
				case VideoSortCriteria.RESOLUTION_ASC:
					return (a.width || 0) * (a.height || 0) - (b.width || 0) * (b.height || 0);
				case VideoSortCriteria.RESOLUTION_DESC:
					return (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0);
				default:
					return 0;
			}
		});
	},
});
