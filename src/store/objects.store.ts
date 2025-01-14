import { createStoreFactory } from './store.factory';
import type { Object } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createObject,
  deleteObject,
  getObjects,
  updateObject,
  addImageToObject as addImageToObjectAction,
  type ObjectCreate,
  type ObjectUpdate
} from '../app/actions/object.actions';

interface ObjectState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const baseObjectStore = createStoreFactory<Object, ObjectState, ObjectCreate, ObjectUpdate>(
  {
    name: 'objects',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Aquí podríamos hacer validaciones o transformaciones antes de crear
        return data;
      },
      afterCreate: async (object) => {
        // Aquí podríamos hacer acciones después de crear, como notificaciones
        logger.info('Objeto creado exitosamente', { object });
      }
    }
  },
  {
    getItems: getObjects,
    createItem: createObject,
    updateItem: updateObject,
    deleteItem: deleteObject
  }
);

// Exportar el hook con funcionalidad extendida
export const useObjectStore = () => {
  const store = baseObjectStore();
  return {
    ...store,
    addImageToObject: async (objectId: string, imageId: string) => {
      try {
        await addImageToObjectAction(objectId, imageId);
        await store.loadItems();
      } catch (error) {
        logger.error('Error adding image to object:', error);
        throw error;
      }
    }
  };
};