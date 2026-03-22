/**
 * @file Tipos para el store de imágenes
 * @module store/entities/image/types
 * @description Tipos optimizados usando ImageWithStats y patrón Record
 * Última actualización: 2025-01-27
 */

import type {
	ImageSortCriteria,
	ImageViewConfig,
	ImageViewMode,
	ImageWithStats,
} from '../../../types/entities/image/types';

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
 * Estructura optimizada de un grupo de imágenes
 */
export interface ImageGroup {
	count: number;
	id: string;
	images: ImageWithStats[];
	label: string;
	subgroups?: ImageGroup[];
}

/**
 * Estado principal del store de imágenes
 */
export interface ImageState {
	core: ImageCoreState;
	filters: ImageFiltersState;
	grouping: ImageGroupingState;
	ui: ImageUIState;
}

/**
 * Estado del slice core (optimizado con Record)
 */
export interface ImageCoreState {
	error: string | null;
	images: Record<string, ImageWithStats>;
	isLoading: boolean;
	lastUpdated: number | null;
}

/**
 * Estado del slice de agrupación
 */
export interface ImageGroupingState {
	filteredImages: ImageWithStats[];
	groupBy: ImageGroupType | null;
	groupedImages: ImageGroup[];
	selection: {
		selectedIds: string[];
	};
	sortCriteria: ImageSortCriteria;
	stats: ImageStoreStats;
}

/**
 * Estado del slice UI
 */
export interface ImageUIState {
	currentImageId: string | null;
	expandedIds: string[];
	highlightedId: string | null;
	isViewerOpen: boolean;
	selectedIds: string[];
	viewConfig: ImageViewConfig;
	viewMode: ImageViewMode;
}

/**
 * Estado del slice de filtros
 */
export interface ImageFiltersState {
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	filterByAlbum: string[];
	filterByFolderId: string | null;
	filterByTag: string[];
	filterFavorites: boolean;
	filterPublic: boolean;
	searchQuery: string;
	sortBy: ImageSortCriteria;
}

/**
 * Estadísticas optimizadas de imágenes
 */
export interface ImageStoreStats {
	averageSize: number;
	byFolder: Record<string, number>;
	byMonth: Record<string, number>;
	byResolution: Record<string, number>;
	byTag: Record<string, number>;
	favorites: number;
	largest: ImageWithStats | null;
	newest: ImageWithStats | null;
	oldest: ImageWithStats | null;
	private: number;
	public: number;
	smallest: ImageWithStats | null;
	totalImages: number;
	totalSize: number;
	withoutThumbnails: number;
	withThumbnails: number;
}

/**
 * 🔄 Funciones auxiliares para manipular Record de imágenes
 */
export function imagesToRecord(images: ImageWithStats[]): Record<string, ImageWithStats> {
	return images.reduce(
		(record, image) => {
			record[image.id] = image;
			return record;
		},
		{} as Record<string, ImageWithStats>
	);
}

export function getImageById(images: Record<string, ImageWithStats>, id: string): ImageWithStats | undefined {
	return images[id];
}

export function getAllImages(images: Record<string, ImageWithStats>): ImageWithStats[] {
	return Object.values(images);
}
