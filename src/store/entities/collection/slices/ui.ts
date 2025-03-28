/**
 * @file Slice de UI del store de Collection
 * @module store/entities/collection/slices/ui
 */

import type { CollectionViewConfig } from '@/types/entities/collection';
import type { StateCreator } from 'zustand';
import type { CollectionState } from '../types';

/**
 * Slice con operaciones relacionadas con la UI para colecciones
 */
export interface CollectionUISlice {
	// Operaciones de consulta
	getViewConfig: () => CollectionViewConfig;

	// Operaciones de mutación
	setViewConfig: (config: Partial<CollectionViewConfig>) => void;
	setViewType: (viewType: CollectionViewConfig['viewType']) => void;
	setSortBy: (sortBy: CollectionViewConfig['sortBy']) => void;
	setSortDirection: (direction: CollectionViewConfig['sortDirection']) => void;
	setShowImages: (show: boolean) => void;
	setImageCount: (count: number) => void;
	setGroupBy: (groupBy: CollectionViewConfig['groupBy']) => void;
	setEnableAnimations: (enable: boolean) => void;

	// Operaciones de selección visual
	toggleHoverCollection: (id: string | null) => void;
	toggleExpandCollection: (id: string | null) => void;
	setLoadingState: (id: string, isLoading: boolean) => void;
	setErrorState: (id: string, hasError: boolean) => void;

	// Resetear estados
	resetUIStates: () => void;
}

/**
 * Implementación del slice de UI
 */
export const createCollectionUISlice: StateCreator<CollectionState & CollectionUISlice, [], [], CollectionUISlice> = (
	set,
	get
) => ({
	// Operaciones de consulta
	getViewConfig: () => {
		return get().viewConfig;
	},

	// Operaciones de mutación de configuración de vista
	setViewConfig: (config: Partial<CollectionViewConfig>) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, ...config },
		}));
	},

	setViewType: (viewType: CollectionViewConfig['viewType']) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, viewType },
		}));
	},

	setSortBy: (sortBy: CollectionViewConfig['sortBy']) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, sortBy },
		}));
	},

	setSortDirection: (sortDirection: CollectionViewConfig['sortDirection']) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, sortDirection },
		}));
	},

	setShowImages: (showImages: boolean) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, showImages },
		}));
	},

	setImageCount: (imageCount: number) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, imageCount },
		}));
	},

	setGroupBy: (groupBy: CollectionViewConfig['groupBy']) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, groupBy },
		}));
	},

	setEnableAnimations: (enableAnimations: boolean) => {
		set((state) => ({
			viewConfig: { ...state.viewConfig, enableAnimations },
		}));
	},

	// Operaciones de selección visual
	toggleHoverCollection: (id: string | null) => {
		set((state) => ({
			collections: state.collections.map((collection) => ({
				...collection,
				isHovered: collection.id === id ? !collection.isHovered : false,
			})),
		}));
	},

	toggleExpandCollection: (id: string | null) => {
		set((state) => ({
			collections: state.collections.map((collection) => ({
				...collection,
				isOpen: collection.id === id ? !collection.isOpen : false,
			})),
		}));
	},

	setLoadingState: (id: string, isLoading: boolean) => {
		set((state) => ({
			collections: state.collections.map((collection) =>
				collection.id === id ? { ...collection, isLoading } : collection
			),
		}));
	},

	setErrorState: (id: string, hasError: boolean) => {
		set((state) => ({
			collections: state.collections.map((collection) =>
				collection.id === id ? { ...collection, hasError } : collection
			),
		}));
	},

	// Resetear estados
	resetUIStates: () => {
		set((state) => ({
			collections: state.collections.map((collection) => ({
				...collection,
				isSelected: false,
				isHovered: false,
				isOpen: false,
				isLoading: false,
				hasError: false,
			})),
		}));
	},
});
