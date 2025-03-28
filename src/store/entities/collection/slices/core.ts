/**
 * @file Slice principal del store de Collection
 * @module store/entities/collection/slices/core
 */

import type { CollectionExtended } from '@/types/entities/collection';
import type { StateCreator } from 'zustand';
import type { CollectionState } from '../types';

/**
 * Slice principal con operaciones CRUD básicas para colecciones
 */
export interface CollectionCoreSlice {
	// Operaciones de consulta
	getCollectionById: (id: string) => CollectionExtended | undefined;
	getCollections: () => CollectionExtended[];
	getSelectedCollection: () => CollectionExtended | undefined;

	// Operaciones de mutación
	setCollections: (collections: CollectionExtended[]) => void;
	addCollection: (collection: CollectionExtended) => void;
	updateCollection: (id: string, data: Partial<CollectionExtended>) => void;
	removeCollection: (id: string) => void;
	selectCollection: (id: string | null) => void;

	// Estado de carga y errores
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
}

/**
 * Implementación del slice principal
 */
export const createCollectionCoreSlice: StateCreator<
	CollectionState & CollectionCoreSlice,
	[],
	[],
	CollectionCoreSlice
> = (set, get) => ({
	// Operaciones de consulta
	getCollectionById: (id: string) => {
		return get().collections.find((collection) => collection.id === id);
	},

	getCollections: () => {
		return get().collections;
	},

	getSelectedCollection: () => {
		const { selectedCollectionId, collections } = get();
		if (!selectedCollectionId) return undefined;
		return collections.find((c) => c.id === selectedCollectionId);
	},

	// Operaciones de mutación
	setCollections: (collections: CollectionExtended[]) => {
		set({ collections });
	},

	addCollection: (collection: CollectionExtended) => {
		set((state) => ({
			collections: [...state.collections, collection],
		}));
	},

	updateCollection: (id: string, data: Partial<CollectionExtended>) => {
		set((state) => ({
			collections: state.collections.map((collection) =>
				collection.id === id ? { ...collection, ...data } : collection
			),
		}));
	},

	removeCollection: (id: string) => {
		set((state) => ({
			collections: state.collections.filter((collection) => collection.id !== id),
			// Si la colección seleccionada es la que estamos eliminando, limpiar la selección
			selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
		}));
	},

	selectCollection: (id: string | null) => {
		set({ selectedCollectionId: id });
	},

	// Estado de carga y errores
	setLoading: (isLoading: boolean) => {
		set({ isLoading });
	},

	setError: (error: string | null) => {
		set({ error });
	},
});
