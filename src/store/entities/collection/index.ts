/**
 * @file Store principal para la entidad Collection
 * @module store/entities/collection
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type CollectionCoreSlice, createCollectionCoreSlice } from './slices/core';
import { type CollectionFiltersSlice, createCollectionFiltersSlice } from './slices/filters';
import type { CollectionState } from './types';

/**
 * Tipo completo del store combinado
 */
export type CollectionStore = CollectionState & CollectionCoreSlice & CollectionFiltersSlice;

/**
 * Estado inicial del store
 */
const initialState: CollectionState = {
	// Datos principales - usando Record para mejor performance
	collections: {},

	// Estado UI
	viewConfig: {
		viewType: 'grid',

		gridColumns: 3,
		cardSize: 'medium',
		sortBy: 'name',
		sortDirection: 'asc',
		showImages: true,
		imageCount: 10,
		enableAnimations: true,
		groupBy: null,
		showStats: true,
		compactView: false,
	},
	selectedCollectionId: null,
	hoveredCollectionId: null,
	expandedCollectionIds: [],

	// Estado de carga y errores
	isLoading: false,
	error: null,

	// Filtrado y ordenamiento
	activeFilters: [],
	searchTerm: '',
	defaultSortOption: 'name_asc',
	currentSortOption: 'name_asc',

	// Agrupamiento
	groupBy: null,
};

/**
 * Store de Zustand para Collections
 */
export const useCollectionStore = create<CollectionStore>()(
	persist(
		(...a) => ({
			...initialState,
			...createCollectionCoreSlice(...a),
			...createCollectionFiltersSlice(...a),
		}),
		{
			name: 'collection-store',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				collections: state.collections,
				viewConfig: state.viewConfig,
				selectedCollectionId: state.selectedCollectionId,
				defaultSortOption: state.defaultSortOption,
				currentSortOption: state.currentSortOption,
				groupBy: state.groupBy,
			}),
		}
	)
);

/**
 * Selectores para datos derivados y operaciones comunes
 */

/**
 * Obtiene una colección por su ID
 * @param id ID de la colección
 * @returns Función selectora para obtener la colección
 */
export const selectCollectionById = (id: string) => (state: CollectionStore) => state.collections[id];

/**
 * Obtiene todas las colecciones ordenadas según la configuración actual
 */
export const selectSortedCollections = (state: CollectionStore) => {
	const { sortBy, sortDirection } = state.viewConfig;
	const option = `${sortBy}_${sortDirection}`;
	return state.getSortedCollections(option);
};

/**
 * Obtiene las colecciones agrupadas según la configuración actual
 */
export const selectGroupedCollections = (state: CollectionStore) => {
	return state.getGroupedCollections();
};

/**
 * Obtiene las colecciones favoritas
 */
export const selectFavoriteCollections = (state: CollectionStore) => {
	return Object.values(state.collections).filter((collection) => collection.isFavorite);
};

/**
 * Obtiene la colección seleccionada actualmente
 */
export const selectCurrentCollection = (state: CollectionStore) => {
	return state.getSelectedCollection();
};

/**
 * Obtiene todas las colecciones como array
 */
export const selectAllCollections = (state: CollectionStore) => {
	return Object.values(state.collections);
};

/**
 * Obtiene el número total de colecciones
 */
export const selectCollectionCount = (state: CollectionStore) => {
	return Object.keys(state.collections).length;
};
