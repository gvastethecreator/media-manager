/**
 * @file Store principal para la entidad Image
 * @module store/entities/image
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ImageSortCriteria, ImageSortOption, ImageViewMode } from '@/types/entities/image/types';
import { createImageCoreSlice, type ImageCoreSlice } from './slices/core';
import { createImageUISlice, type ImageUISlice } from './slices/ui';
import type { ImageState } from './types';

// Tipo del store completo
export type ImageStore = ImageState & ImageCoreSlice & ImageUISlice;

// Estado inicial
const initialState: ImageState = {
	core: {
		images: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},
	ui: {
		selectedIds: [],
		viewMode: 'grid' as ImageViewMode,
		isViewerOpen: false,
		currentImageId: null,
		highlightedId: null,
		expandedIds: [],
		viewConfig: {
			viewMode: ImageViewMode.GRID,
			sortBy: ImageSortOption.DATE,
			sortDirection: 'desc',
			gridSize: 'medium',
			showMetadata: true,
			showThumbnails: true,
			showFilenames: false,
			showDimensions: false,
			showFileSize: false,
			groupBy: null,
			enableAnimations: true,
			autoPlay: false,
			showFavorites: false,
			enableZoom: true,
			enableFullscreen: true,
		},
	},
	filters: {
		sortBy: ImageSortCriteria.DATE_DESC,
		searchQuery: '',
		filterByTag: [],
		filterByAlbum: [],
		filterByFolderId: null,
		filterFavorites: false,
		filterPublic: false,
		dateRange: {
			from: null,
			to: null,
		},
	},
	grouping: {
		groupBy: null,
		sortCriteria: ImageSortCriteria.DATE_DESC,
		groupedImages: [],
		filteredImages: [],
		stats: {
			totalImages: 0,
			totalSize: 0,
			averageSize: 0,
			byFolder: {},
			byTag: {},
			byMonth: {},
			byResolution: {},
			favorites: 0,
			public: 0,
			private: 0,
			withThumbnails: 0,
			withoutThumbnails: 0,
			largest: null,
			smallest: null,
			newest: null,
			oldest: null,
		},
		selection: {
			selectedIds: [],
		},
	},
};

// Crear store combinando slices
export const useImageStore = create<ImageStore>()(
	devtools(
		persist(
			(set, get, api) => ({
				...initialState,
				...createImageCoreSlice(set, get, api),
				...createImageUISlice(set, get, api),
			}),
			{
				name: 'image-store',
				partialize: (state) => ({
					ui: {
						viewMode: state.ui.viewMode,
					},
				}),
			}
		),
		{ name: 'ImageStore' }
	)
);

// Exportar slices para poder extenderlos
export { createImageCoreSlice } from './slices/core';
export { createImageUISlice } from './slices/ui';
// Exportar todo desde types
export * from './types';
