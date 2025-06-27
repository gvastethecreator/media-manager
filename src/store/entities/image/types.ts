/**
 * @file Tipos para el store de imágenes
 * @module store/entities/image/types
 * @description Tipos optimizados usando ImageWithStats y patrón Record
 * Última actualización: 2025-01-27
 */

import type { ImageSortCriteria, ImageViewMode, ImageWithStats } from '../../../types/entities/image/types';

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
	id: string;
	label: string;
	count: number;
	images: ImageWithStats[];
	subgroups?: ImageGroup[];
}

/**
 * Estado principal del store de imágenes
 */
export interface ImageState {
	core: ImageCoreState;
	ui: ImageUIState;
	filters: ImageFiltersState;
	grouping: ImageGroupingState;
}

/**
 * Estado del slice core (optimizado con Record)
 */
export interface ImageCoreState {
	images: Record<string, ImageWithStats>;
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
	filteredImages: ImageWithStats[];
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
 * Estadísticas optimizadas de imágenes
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
	largest: ImageWithStats | null;
	smallest: ImageWithStats | null;
	newest: ImageWithStats | null;
	oldest: ImageWithStats | null;
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
