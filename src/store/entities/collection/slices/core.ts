/**
 * @file Slice principal del store de Collection
 * @module store/entities/collection/slices/core
 */

import type { CollectionCreateInput, CollectionExtended, CollectionUpdateInput } from '@/types/entities/collection';
import type { StateCreator } from 'zustand';
import {
	createCollection,
	deleteCollection,
	getCollection,
	updateCollection,
} from '../../../../app/actions/collections/collection.actions';
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

	// Acciones asíncronas con Server Actions
	fetchCollection: (id: string) => Promise<CollectionExtended | undefined>;
	fetchCollections: () => Promise<CollectionExtended[]>;
	createCollectionServer: (data: CollectionCreateInput) => Promise<CollectionExtended | undefined>;
	updateCollectionServer: (id: string, data: Partial<CollectionUpdateInput>) => Promise<CollectionExtended | undefined>;
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
		if (!selectedCollectionId) return undefined;
		return collections[selectedCollectionId];
	},

	// Operaciones de mutación
	setCollections: (collections: CollectionExtended[]) => {
		const collectionsRecord = collections.reduce(
			(acc, collection) => {
				acc[collection.id] = collection;
				return acc;
			},
			{} as Record<string, CollectionExtended>
		);
		set({ collections: collectionsRecord });
	},

	addCollection: (collection: CollectionExtended) => {
		set((state) => ({
			collections: {
				...state.collections,
				[collection.id]: collection,
			},
		}));
	},

	updateCollection: (id: string, data: Partial<CollectionExtended>) => {
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
			const collection = await getCollection(id);
			if (collection) {
				// Convertir CollectionComplete a CollectionExtended
				const extendedCollection: CollectionExtended = {
					...collection,
					imageCount: collection._count?.images || 0,
					videoCount: collection._count?.videos || 0,
					tagCount: collection._count?.tags || 0,
					groupCount: collection._count?.groups || 0,
					propertyCount: collection._count?.properties || 0,
				};
				get().addCollection(extendedCollection);
				return extendedCollection;
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
			// Usar getCollection múltiples veces o implementar lógica para obtener múltiples
			// Por ahora, retornamos array vacío ya que getCollections no existe
			const collections: CollectionExtended[] = [];
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
				// Convertir a CollectionExtended
				const extendedCollection: CollectionExtended = {
					...newCollection,
					imageCount: newCollection._count?.images || 0,
					videoCount: newCollection._count?.videos || 0,
					tagCount: newCollection._count?.tags || 0,
					groupCount: newCollection._count?.groups || 0,
					propertyCount: newCollection._count?.properties || 0,
				};
				get().addCollection(extendedCollection);
				return extendedCollection;
			}
			return undefined;
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
				// Convertir a CollectionExtended
				const extendedCollection: CollectionExtended = {
					...updatedCollection,
					imageCount: updatedCollection._count?.images || 0,
					videoCount: updatedCollection._count?.videos || 0,
					tagCount: updatedCollection._count?.tags || 0,
					groupCount: updatedCollection._count?.groups || 0,
					propertyCount: updatedCollection._count?.properties || 0,
				};
				get().updateCollection(id, extendedCollection);
				return extendedCollection;
			}
			return undefined;
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
