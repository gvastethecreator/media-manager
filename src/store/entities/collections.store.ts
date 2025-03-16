import {
	type CollectionCreate,
	type CollectionUpdate,
	type CollectionWithStats,
	addImageToCollection,
	createCollection,
	deleteCollection,
	getCollections,
	updateCollection,
} from '@/app/actions/collections/collection.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Collection } from '@prisma/client';
import { create } from 'zustand';

interface CollectionsStore {
	collections: CollectionWithStats[];
	isLoading: boolean;
	error: Error | null;
	selectedItem: Collection | null;
	loadCollections: () => Promise<void>;
	createCollection: (data: CollectionCreate) => Promise<Collection>;
	updateCollection: (data: CollectionUpdate) => Promise<Collection>;
	deleteCollection: (id: string) => Promise<void>;
	addImageToCollection: (imageId: string, collectionId: string) => Promise<void>;
	selectItem: (collection: Collection) => void;
}

const collectionsLogger = serverLogger.withContext('CollectionsStore');

export const useCollectionsStore = create<CollectionsStore>((set, get) => ({
	collections: [],
	isLoading: false,
	error: null,
	selectedItem: null,

	loadCollections: async () => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('🔄 Cargando colecciones');
			const collections = await getCollections();
			set({ collections, isLoading: false });
			collectionsLogger.info('✅ Colecciones cargadas');
		} catch (error) {
			collectionsLogger.error('❌ Error al cargar colecciones:', error);
			set({ error: error as Error, isLoading: false });
		}
	},

	selectItem: (collection) => {
		set({ selectedItem: collection });
	},

	createCollection: async (data) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('📝 Creando colección:', data.name);
			const collection = await createCollection(data);
			await get().loadCollections();
			collectionsLogger.info('✅ Colección creada');
			return collection;
		} catch (error) {
			collectionsLogger.error('❌ Error al crear colección:', error);
			set({ error: error as Error, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateCollection: async (data) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('📝 Actualizando colección:', data.id);
			const collection = await updateCollection(data.id, data);
			await get().loadCollections();
			collectionsLogger.info('✅ Colección actualizada');
			return collection;
		} catch (error) {
			collectionsLogger.error('❌ Error al actualizar colección:', error);
			set({ error: error as Error, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deleteCollection: async (id) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('🗑️ Eliminando colección:', id);
			await deleteCollection(id);
			await get().loadCollections();
			collectionsLogger.info('✅ Colección eliminada');
		} catch (error) {
			collectionsLogger.error('❌ Error al eliminar colección:', error);
			set({ error: error as Error, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	addImageToCollection: async (imageId, collectionId) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('➕ Agregando imagen a colección:', { collectionId, imageId });
			await addImageToCollection(collectionId, imageId);
			await get().loadCollections();
			collectionsLogger.info('✅ Imagen agregada a la colección');
		} catch (error) {
			collectionsLogger.error('❌ Error al agregar imagen a la colección:', error);
			set({ error: error as Error, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
