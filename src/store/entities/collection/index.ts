/**
 * @file Store principal para la entidad Collection
 * @module store/entities/collection
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type CollectionCoreSlice, createCollectionCoreSlice } from './slices/core';
import { type CollectionFiltersSlice, createCollectionFiltersSlice } from './slices/filters';
import { type CollectionUISlice, createCollectionUISlice } from './slices/ui';
import type { CollectionState } from './types';

/**
 * Tipo completo del store combinado
 */
export type CollectionStore = CollectionState & CollectionCoreSlice & CollectionUISlice & CollectionFiltersSlice;

/**
 * Estado inicial del store
 */
const initialState: CollectionState = {
	collections: [],
	viewConfig: {
		viewType: 'grid',
		sortBy: 'name',
		sortDirection: 'asc',
		showImages: true,
		imageCount: 3,
		enableAnimations: true,
		groupBy: null,
	},
	selectedCollectionId: null,
	isLoading: false,
	error: null,
};

/**
 * Store de Zustand para Collections
 */
export const useCollectionStore = create<CollectionStore>()(
	persist(
		(...a) => ({
			...initialState,
			...createCollectionCoreSlice(...a),
			...createCollectionUISlice(...a),
			...createCollectionFiltersSlice(...a),
		}),
		{
			name: 'collection-store',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				viewConfig: state.viewConfig,
				selectedCollectionId: state.selectedCollectionId,
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
export const selectCollectionById = (id: string) => (state: CollectionStore) =>
	state.collections.find((collection) => collection.id === id);

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
	return state.collections.filter((collection) => collection.isFavorite);
};

/**
 * Obtiene la colección seleccionada actualmente
 */
export const selectCurrentCollection = (state: CollectionStore) => {
	return state.getSelectedCollection();
};
