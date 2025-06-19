/**
 * @file Slice principal del store de Collection
 * @module store/entities/collection/slices/core
 */

import type { CollectionComplete, CollectionCreateInput, CollectionUpdateInput } from '@/types/entities/collection';
import type { StateCreator } from 'zustand';
import {
    createCollection,
    deleteCollection,
    getCollection,
    getCollections,
    updateCollection,
} from '../../../../app/actions/collections/collection.actions';
import type { CollectionState } from '../types';

/**
 * Slice principal con operaciones CRUD básicas para colecciones
 */
export interface CollectionCoreSlice {
	// Operaciones de consulta
	getCollectionById: (id: string) => CollectionComplete | undefined;
	getCollections: () => CollectionComplete[];
	getSelectedCollection: () => CollectionComplete | undefined;

	// Operaciones de mutación
	setCollections: (collections: CollectionComplete[]) => void;
	addCollection: (collection: CollectionComplete) => void;
	updateCollection: (id: string, data: Partial<CollectionComplete>) => void;
	removeCollection: (id: string) => void;
	selectCollection: (id: string | null) => void;

	// Estado de carga y errores
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas con Server Actions
	fetchCollection: (id: string) => Promise<CollectionComplete | undefined>;
	fetchCollections: () => Promise<CollectionComplete[]>;
	createCollectionServer: (data: CollectionCreateInput) => Promise<CollectionComplete | undefined>;
	updateCollectionServer: (id: string, data: Partial<CollectionUpdateInput>) => Promise<CollectionComplete | undefined>;
	removeCollectionServer: (id: string) => Promise<boolean>;
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
	setCollections: (collections: CollectionComplete[]) => {
		set({ collections });
	},

	addCollection: (collection: CollectionComplete) => {
		set((state) => ({
			collections: [...state.collections, collection],
		}));
	},

	updateCollection: (id: string, data: Partial<CollectionComplete>) => {
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

	// Acciones asíncronas con Server Actions
	fetchCollection: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			const collection = await getCollection(id);
			if (collection) {
				get().addCollection(collection);
				return collection;
			}
			return undefined;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error fetching collection:', error);
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},

	fetchCollections: async () => {
		set({ isLoading: true, error: null });
		try {
			const collections = await getCollections();
			get().setCollections(collections);
			return collections;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error fetching collections:', error);
			return [];
		} finally {
			set({ isLoading: false });
		}
	},

	createCollectionServer: async (data: CollectionCreateInput) => {
		set({ isLoading: true, error: null });
		try {
			const newCollection = await createCollection(data);
			if (newCollection) {
				get().addCollection(newCollection);
			}
			return newCollection;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error creating collection:', error);
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},

	updateCollectionServer: async (id: string, data: Partial<CollectionUpdateInput>) => {
		set({ isLoading: true, error: null });
		try {
			const updatedCollection = await updateCollection(id, data);
			if (updatedCollection) {
				get().updateCollection(id, updatedCollection);
			}
			return updatedCollection;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error updating collection:', error);
			return undefined;
		} finally {
			set({ isLoading: false });
		}
	},

	removeCollectionServer: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			await deleteCollection(id);
			get().removeCollection(id);
			return true;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error removing collection:', error);
			return false;
		} finally {
			set({ isLoading: false });
		}
	},
});
