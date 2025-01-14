import { createStoreFactory } from './store.factory';
import type { Album } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createAlbum,
  deleteAlbum,
  getAlbums,
  updateAlbum,
  type AlbumCreate,
  type AlbumUpdate
} from '../app/actions/album.actions';

interface AlbumState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export const useAlbumStore = createStoreFactory<Album, AlbumState, AlbumCreate, AlbumUpdate>(
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