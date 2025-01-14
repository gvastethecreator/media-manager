import { createStoreFactory } from './store.factory';
import type { Object } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createObject,
  deleteObject,
  getObjects,
  updateObject,
  type ObjectCreate,
  type ObjectUpdate
} from '../app/actions/object.actions';

// Estado extendido específico para Object
interface ObjectState {
  filters: {
    searchQuery: string;
    sortBy: 'name' | 'type' | 'rarity' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
    type: string[];
    rarity: string[];
    status: string[];
  };
}

export const useObjectStore = createStoreFactory<Object, ObjectState, ObjectCreate, ObjectUpdate>(
  {
    name: 'objects',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Validar datos antes de crear
        if (!data.name?.trim()) {
          throw new Error('El nombre es requerido');
        }
        if (!data.type?.trim()) {
          throw new Error('El tipo es requerido');
        }
        return data;
      },
      afterCreate: async (object) => {
        logger.info('Objeto creado exitosamente', { object });
      },
      beforeUpdate: async (id, data) => {
        // Validar datos antes de actualizar
        if (data.name !== undefined && !data.name.trim()) {
          throw new Error('El nombre no puede estar vacío');
        }
        return data;
      },
      afterUpdate: async (object) => {
        logger.info('Objeto actualizado exitosamente', { object });
      },
      beforeDelete: async (id) => {
        // Aquí podríamos verificar si el objeto tiene imágenes asociadas
        logger.info('Preparando eliminación de objeto', { id });
      },
      afterDelete: async (id) => {
        logger.info('Objeto eliminado exitosamente', { id });
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