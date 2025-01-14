import { createStoreFactory } from './store.factory';
import type { Place } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createPlace,
  deletePlace,
  getPlaces,
  updatePlace,
  type PlaceCreate,
  type PlaceUpdate
} from '../app/actions/place.actions';

// Estado extendido específico para Place
interface PlaceState {
  filters: {
    searchQuery: string;
    sortBy: 'name' | 'type' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
    type: string[];
    region: string[];
    climate: string[];
  };
}

export const usePlaceStore = createStoreFactory<Place, PlaceState, PlaceCreate, PlaceUpdate>(
  {
    name: 'places',
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
      afterCreate: async (place) => {
        logger.info('Lugar creado exitosamente', { place });
      },
      beforeUpdate: async (id, data) => {
        // Validar datos antes de actualizar
        if (data.name !== undefined && !data.name.trim()) {
          throw new Error('El nombre no puede estar vacío');
        }
        return data;
      },
      afterUpdate: async (place) => {
        logger.info('Lugar actualizado exitosamente', { place });
      },
      beforeDelete: async (id) => {
        // Aquí podríamos verificar si el lugar tiene imágenes asociadas
        logger.info('Preparando eliminación de lugar', { id });
      },
      afterDelete: async (id) => {
        logger.info('Lugar eliminado exitosamente', { id });
      }
    }
  },
  {
    getItems: getPlaces,
    createItem: createPlace,
    updateItem: updatePlace,
    deleteItem: deletePlace
  }
);