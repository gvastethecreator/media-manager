import { createStoreFactory } from './store.factory';
import type { Collection } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
  addImageToCollection as addImageToCollectionAction,
  type CollectionCreate,
  type CollectionUpdate
} from '../app/actions/collection.actions';

interface CollectionState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const baseCollectionStore = createStoreFactory<Collection, CollectionState, CollectionCreate, CollectionUpdate>(
  {
    name: 'collections',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Aquí podríamos hacer validaciones o transformaciones antes de crear
        return data;
      },
      afterCreate: async (collection) => {
        // Aquí podríamos hacer acciones después de crear, como notificaciones
        logger.info('Colección creada exitosamente', { collection });
      }
    }
  },
  {
    getItems: getCollections,
    createItem: createCollection,
    updateItem: updateCollection,
    deleteItem: deleteCollection
  }
);

// Exportar el hook con funcionalidad extendida
export const useCollectionStore = () => {
  const store = baseCollectionStore();
  return {
    ...store,
    addImageToCollection: async (collectionId: string, imageId: string) => {
      try {
        await addImageToCollectionAction(collectionId, imageId);
        await store.loadItems();
      } catch (error) {
        logger.error('Error adding image to collection:', error);
        throw error;
      }
    }
  };
};