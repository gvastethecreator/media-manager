/**
 * @file Tipos para el store de imágenes
 * @module store/entities/image/types
 */

import type { ImageExtended, ImageSortCriteria, ImageViewMode } from '../../../types/entities/image/types';

/**
 * Tipos de agrupamiento para imágenes
 */
export enum ImageGroupType {
	FOLDER = 'folder',
	DATE = 'date',
	MONTH = 'month',
	YEAR = 'year',
	TAG = 'tag',
	SIZE = 'size',
	RESOLUTION = 'resolution',
	NONE = 'none',
}

/**
 * Estructura de un grupo de imágenes
 */
export interface ImageGroup {
	id: string;
	label: string;
	count: number;
	images: ImageExtended[];
	subgroups?: ImageGroup[];
}

/**
 * Estado principal del store de imágenes
 */
export interface ImageState {
	// Slices de estado
	core: ImageCoreState;
	ui: ImageUIState;
	filters: ImageFiltersState;
	grouping: ImageGroupingState;
}

/**
 * Estado del slice core
 */
export interface ImageCoreState {
	images: Record<string, ImageExtended>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

/**
 * Estado del slice de agrupación
 */
export interface ImageGroupingState {
	groupBy: ImageGroupType | null;
	sortCriteria: ImageSortCriteria;
	groupedImages: ImageGroup[];
	filteredImages: ImageExtended[];
	stats: ImageStoreStats;
	selection: {
		selectedIds: string[];
	};
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

/**
 * Estadísticas de imágenes
 */
export interface ImageStoreStats {
	totalImages: number;
	totalSize: number;
	averageSize: number;
	byFolder: Record<string, number>;
	byTag: Record<string, number>;
	byMonth: Record<string, number>;
	byResolution: Record<string, number>;
	favorites: number;
	public: number;
	private: number;
	withThumbnails: number;
	withoutThumbnails: number;
	largest: ImageExtended | null;
	smallest: ImageExtended | null;
	newest: ImageExtended | null;
	oldest: ImageExtended | null;
}
