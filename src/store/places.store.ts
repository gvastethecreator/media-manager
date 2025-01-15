import { createStoreFactory } from './store.factory';
import type { Place } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createPlace,
  deletePlace,
  getPlaces,
  updatePlace,
  addImageToPlace as addImageToPlaceAction,
  type PlaceCreate,
  type PlaceUpdate
} from '../app/actions/place.actions';

interface PlaceState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const basePlaceStore = createStoreFactory<Place, PlaceState, PlaceCreate, PlaceUpdate>(
  {
    name: 'places',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Aquí podríamos hacer validaciones o transformaciones antes de crear
        return data;
      },
      afterCreate: async (place) => {
        // Aquí podríamos hacer acciones después de crear, como notificaciones
        logger.info('Lugar creado exitosamente', { place });
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

// Exportar el hook con funcionalidad extendida
export const usePlaceStore = () => {
  const store = basePlaceStore();
  return {
    ...store,
    addImageToPlace: async (placeId: string, imageId: string) => {
      try {
        await addImageToPlaceAction(placeId, imageId);
        await store.loadItems();
      } catch (error) {
        logger.error('Error adding image to place:', error);
        throw error;
      }
    }
  };
};