import { createStoreFactory } from './store.factory';
import type { Album } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createAlbum,
  deleteAlbum,
  getAlbums,
  updateAlbum,
  addImageToAlbum as addImageToAlbumAction,
  type AlbumCreate,
  type AlbumUpdate
} from '../app/actions/album.actions';

interface AlbumState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const baseAlbumStore = createStoreFactory<Album, AlbumState, AlbumCreate, AlbumUpdate>(
  {
    name: 'albums',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Aquí podríamos hacer validaciones o transformaciones antes de crear
        return data;
      },
      afterCreate: async (album) => {
        // Aquí podríamos hacer acciones después de crear, como notificaciones
        logger.info('Album creado exitosamente', { album });
      }
    }
  },
  {
    getItems: getAlbums,
    createItem: createAlbum,
    updateItem: updateAlbum,
    deleteItem: deleteAlbum
  }
);

// Exportar el hook con funcionalidad extendida
export const useAlbumStore = () => {
  const store = baseAlbumStore();
  return {
    ...store,
    addImageToAlbum: async (albumId: string, imageId: string) => {
      try {
        await addImageToAlbumAction(albumId, imageId);
        await store.loadItems();
      } catch (error) {
        logger.error('Error adding image to album:', error);
        throw error;
      }
    }
  };
};