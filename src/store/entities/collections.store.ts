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
import { logger } from '@/lib/logger';
import type { Collection } from '@prisma/client';
import { create } from 'zustand';

interface CollectionsStore {
	collections: CollectionWithStats[];
	isLoading: boolean;
	error: Error | null;
	selectedItem: Collection | null;
	loadCollections: () => Promise<void>;
	createCollection: (data: CollectionCreate) => Promise<void>;
	updateCollection: (data: CollectionUpdate) => Promise<void>;
	deleteCollection: (id: string) => Promise<void>;
	addImageToCollection: (collectionId: string, imageId: string) => Promise<void>;
	selectItem: (collection: Collection) => void;
}

const collectionsLogger = logger.withContext('CollectionsStore');

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
			await createCollection(data);
			await get().loadCollections();
			collectionsLogger.info('✅ Colección creada');
		} catch (error) {
			collectionsLogger.error('❌ Error al crear colección:', error);
			set({ error: error as Error, isLoading: false });
		}
	},

	updateCollection: async (data) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('📝 Actualizando colección:', data.id);
			await updateCollection(data.id, data);
			await get().loadCollections();
			collectionsLogger.info('✅ Colección actualizada');
		} catch (error) {
			collectionsLogger.error('❌ Error al actualizar colección:', error);
			set({ error: error as Error, isLoading: false });
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
		}
	},

	addImageToCollection: async (collectionId, imageId) => {
		try {
			set({ isLoading: true, error: null });
			collectionsLogger.info('➕ Agregando imagen a colección:', { collectionId, imageId });
			await addImageToCollection(collectionId, imageId);
			await get().loadCollections();
			collectionsLogger.info('✅ Imagen agregada a la colección');
		} catch (error) {
			collectionsLogger.error('❌ Error al agregar imagen a la colección:', error);
			set({ error: error as Error, isLoading: false });
		}
	},
}));
