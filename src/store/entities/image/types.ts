/**
 * @file Tipos para el store de imágenes
 * @module store/entities/image/types
 */

import type { Image, ImageSortCriteria, ImageViewMode } from '../../../types/entities/image';

/**
 * Estado principal del store de imágenes
 */
export interface ImageState {
	// Slices de estado
	core: ImageCoreState;
	ui: ImageUIState;
	filters: ImageFiltersState;
}

/**
 * Estado del slice core
 */
export interface ImageCoreState {
	images: Record<string, Image>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

/**
 * Estado del slice UI
 */
export interface ImageUIState {
	selectedIds: string[];
	viewMode: ImageViewMode;
	isViewerOpen: boolean;
	currentImageId: string | null;
	highlightedId: string | null;
	expandedIds: string[];
}

/**
 * Estado del slice de filtros
 */
export interface ImageFiltersState {
	sortBy: ImageSortCriteria;
	searchQuery: string;
	filterByTag: string[];
	filterByAlbum: string[];
	filterByFolderId: string | null;
	filterFavorites: boolean;
	filterPublic: boolean;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
}
