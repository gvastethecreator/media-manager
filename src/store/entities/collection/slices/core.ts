/**
 * @file Slice principal del store de Collection
 * @module store/entities/collection/slices/core
 */

import type { StateCreator } from 'zustand';
// Server actions eliminados - usar servicios API
// Se migran las llamadas al servicio hacia el cliente de API
import {
	createCollectionInApi,
	deleteCollectionFromApi,
	getCollectionFromApi,
	getCollectionsFromApi,
	updateCollectionInApi,
} from '@/lib/api/client/collection.client';
import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import type { CollectionState } from '../types';

/**
 * Slice principal con operaciones CRUD básicas para colecciones
 */
export interface CollectionCoreSlice {
	// Operaciones de consulta
	getCollectionById: (id: string) => CollectionWithStats | undefined;
	getCollections: () => CollectionWithStats[];
	getSelectedCollection: () => CollectionWithStats | undefined;

	// Operaciones de mutación
	setCollections: (collections: CollectionWithStats[]) => void;
	addCollection: (collection: CollectionWithStats) => void;
	updateCollection: (id: string, data: Partial<CollectionWithStats>) => void;
	removeCollection: (id: string) => void;
	selectCollection: (id: string | null) => void;

	// Estado de carga y errores
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas con Server Actions
	fetchCollection: (id: string) => Promise<CollectionWithStats | undefined>;
	fetchCollections: () => Promise<CollectionWithStats[]>;
	createCollectionServer: (data: CollectionCreateInput) => Promise<CollectionWithStats | undefined>;
	updateCollectionServer: (
		id: string,
		data: Partial<CollectionUpdateInput>
	) => Promise<CollectionWithStats | undefined>;
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
		return get().collections[id];
	},

	getCollections: () => {
		return Object.values(get().collections);
	},

	getSelectedCollection: () => {
		const { selectedCollectionId, collections } = get();
		if (!selectedCollectionId) return;
		return collections[selectedCollectionId];
	},

	// Operaciones de mutación
	setCollections: (collections: CollectionWithStats[]) => {
		const collectionsRecord = collections.reduce(
			(acc, collection) => {
				acc[collection.id] = collection;
				return acc;
			},
			{} as Record<string, CollectionWithStats>
		);
		set({ collections: collectionsRecord });
	},

	addCollection: (collection: CollectionWithStats) => {
		set((state) => ({
			collections: {
				...state.collections,
				[collection.id]: collection,
			},
		}));
	},

	updateCollection: (id: string, data: Partial<CollectionWithStats>) => {
		set((state) => {
			const existingCollection = state.collections[id];
			if (!existingCollection) return state;

			return {
				collections: {
					...state.collections,
					[id]: { ...existingCollection, ...data },
				},
			};
		});
	},

	removeCollection: (id: string) => {
		set((state) => {
			const newCollections = { ...state.collections };
			delete newCollections[id];

			return {
				collections: newCollections,
				// Si la colección seleccionada es la que estamos eliminando, limpiar la selección
				selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
			};
		});
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
			const collection = await getCollectionFromApi(id);
			if (collection) {
				get().addCollection(collection);
				return collection;
			}
			return;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error fetching collection:', error);
			return;
		} finally {
			set({ isLoading: false });
		}
	},

	fetchCollections: async () => {
		set({ isLoading: true, error: null });
		try {
			const collections = await getCollectionsFromApi();
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
			const newCollection = await createCollectionInApi(data);
			get().addCollection(newCollection);
			return newCollection;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error creating collection:', error);
			return;
		} finally {
			set({ isLoading: false });
		}
	},

	updateCollectionServer: async (id: string, data: Partial<CollectionUpdateInput>) => {
		set({ isLoading: true, error: null });
		try {
			const updatedCollection = await updateCollectionInApi(id, data);
			get().updateCollection(id, updatedCollection);
			return updatedCollection;
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
			console.error('Error updating collection:', error);
			return;
		} finally {
			set({ isLoading: false });
		}
	},

	removeCollectionServer: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			await deleteCollectionFromApi(id);
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
