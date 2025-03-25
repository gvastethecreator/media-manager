/**
 * @file Slice principal para operaciones CRUD del store de álbumes
 * @module store/entities/album/slices/core
 */

import type { StateCreator } from 'zustand';
import {
    mapCreateAlbumDataToPrisma
} from '../../../../transformers/album/mappers';
import {
    extendAlbum,
    extendAlbums
} from '../../../../transformers/album/serializers';
import type {
    Album,
    AlbumBase,
    CreateAlbumData,
    UpdateAlbumData,
    UpdateAlbumItemsData
} from '../../../../types/entities/album';
import type { AlbumState } from '../types';

// Slice para operaciones CRUD básicas
export interface AlbumCoreSlice {
  // Getters
  getAlbum: (id: string) => Album | undefined;
  getAlbums: () => Album[];
  getChildAlbums: (parentId: string) => Album[];
  getRootAlbums: () => Album[];
  getAlbumItems: (albumId: string) => Array<{ id: string, type: 'image' | 'video' }>;

  // Operaciones
  addAlbum: (album: AlbumBase) => void;
  addAlbums: (albums: AlbumBase[]) => void;
  updateAlbum: (id: string, data: UpdateAlbumData) => void;
  deleteAlbum: (id: string) => void;

  // Gestión de elementos
  addItemToAlbum: (albumId: string, itemId: string, itemType: 'image' | 'video') => void;
  removeItemFromAlbum: (albumId: string, itemId: string) => void;
  updateAlbumItems: (albumId: string, data: UpdateAlbumItemsData) => void;
  clearAlbumItems: (albumId: string) => void;

  // Estado de carga
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones asíncronas
  fetchAlbum: (id: string) => Promise<Album | undefined>;
  fetchAlbums: (parentId?: string) => Promise<Album[]>;
  createAlbum: (data: CreateAlbumData) => Promise<Album | undefined>;
  removeAlbum: (id: string) => Promise<boolean>;
  moveAlbum: (id: string, newParentId: string | null) => Promise<boolean>;
}

// Creador del slice
export const createAlbumCoreSlice: StateCreator<
  AlbumState,
  [],
  [],
  AlbumCoreSlice
> = (set, get) => ({
  // Getters
  getAlbum: (id: string) => {
    return get().core.albums[id];
  },

  getAlbums: () => {
    return Object.values(get().core.albums);
  },

  getChildAlbums: (parentId: string) => {
    return Object.values(get().core.albums).filter(
      (album) => album.parentId === parentId
    );
  },

  getRootAlbums: () => {
    return Object.values(get().core.albums).filter(
      (album) => !album.parentId
    );
  },

  getAlbumItems: (albumId: string) => {
    return get().core.albumItems[albumId] || [];
  },

  // Operaciones síncronas
  addAlbum: (album: AlbumBase) => {
    const extendedAlbum = extendAlbum(album);
    set((state) => ({
      core: {
        ...state.core,
        albums: {
          ...state.core.albums,
          [album.id]: extendedAlbum,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  addAlbums: (albums: AlbumBase[]) => {
    const extendedAlbums = extendAlbums(albums);
    const albumsMap = extendedAlbums.reduce(
      (acc, album) => {
        acc[album.id] = album;
        return acc;
      },
      {} as Record<string, Album>
    );

    set((state) => ({
      core: {
        ...state.core,
        albums: {
          ...state.core.albums,
          ...albumsMap,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  updateAlbum: (id: string, data: UpdateAlbumData) => {
    set((state) => {
      const album = state.core.albums[id];
      if (!album) return state;

      return {
        core: {
          ...state.core,
          albums: {
            ...state.core.albums,
            [id]: {
              ...album,
              ...data,
            },
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  deleteAlbum: (id: string) => {
    set((state) => {
      const newAlbums = { ...state.core.albums };
      delete newAlbums[id];

      const newAlbumItems = { ...state.core.albumItems };
      delete newAlbumItems[id];

      return {
        core: {
          ...state.core,
          albums: newAlbums,
          albumItems: newAlbumItems,
          lastUpdated: Date.now(),
        },
      };
    });
  },

  // Gestión de elementos de álbum
  addItemToAlbum: (albumId: string, itemId: string, itemType: 'image' | 'video') => {
    set((state) => {
      const currentItems = state.core.albumItems[albumId] || [];

      // Verificar si el item ya existe
      if (currentItems.some(item => item.id === itemId)) {
        return state;
      }

      return {
        core: {
          ...state.core,
          albumItems: {
            ...state.core.albumItems,
            [albumId]: [
              ...currentItems,
              { id: itemId, type: itemType }
            ],
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  removeItemFromAlbum: (albumId: string, itemId: string) => {
    set((state) => {
      const currentItems = state.core.albumItems[albumId] || [];

      return {
        core: {
          ...state.core,
          albumItems: {
            ...state.core.albumItems,
            [albumId]: currentItems.filter(item => item.id !== itemId),
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  updateAlbumItems: (albumId: string, data: UpdateAlbumItemsData) => {
    set((state) => {
      const currentItems = state.core.albumItems[albumId] || [];

      // Convertir elementos a formato interno
      const newItems = data.items.map(item => ({
        id: item.itemId,
        type: item.itemType
      }));

      // Reemplazar todos o añadir a los existentes
      const updatedItems = data.replaceExisting
        ? newItems
        : [...currentItems, ...newItems.filter(
            newItem => !currentItems.some(item => item.id === newItem.id)
          )];

      return {
        core: {
          ...state.core,
          albumItems: {
            ...state.core.albumItems,
            [albumId]: updatedItems,
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  clearAlbumItems: (albumId: string) => {
    set((state) => ({
      core: {
        ...state.core,
        albumItems: {
          ...state.core.albumItems,
          [albumId]: [],
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  // Estado de carga
  setLoading: (isLoading: boolean) => {
    set((state) => ({
      core: {
        ...state.core,
        isLoading,
      },
    }));
  },

  setError: (error: string | null) => {
    set((state) => ({
      core: {
        ...state.core,
        error,
      },
    }));
  },

  // Operaciones asíncronas (simuladas, se implementarán con llamadas reales a la API)
  fetchAlbum: async (id: string) => {
    const { setLoading, setError, addAlbum } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/albums/${id}`);
      if (!response.ok) throw new Error('Error al cargar el álbum');

      const albumData = await response.json();
      addAlbum(albumData);
      return get().core.albums[id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  fetchAlbums: async (parentId?: string) => {
    const { setLoading, setError, addAlbums } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      let url = '/api/albums';
      if (parentId) {
        url += `?parentId=${parentId}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar los álbumes');

      const albumsData = await response.json();
      addAlbums(albumsData);

      return parentId
        ? get().getChildAlbums(parentId)
        : get().getAlbums();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    } finally {
      setLoading(false);
    }
  },

  createAlbum: async (data: CreateAlbumData) => {
    const { setLoading, setError, addAlbum } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const prismaData = mapCreateAlbumDataToPrisma(data);
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prismaData),
      });

      if (!response.ok) throw new Error('Error al crear el álbum');

      const createdAlbum = await response.json();
      addAlbum(createdAlbum);

      // Si tiene elementos iniciales, añadirlos
      if (data.items && data.items.length > 0 && createdAlbum.id) {
        get().updateAlbumItems(createdAlbum.id, {
          items: data.items,
          replaceExisting: true
        });
      }

      return get().core.albums[createdAlbum.id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  removeAlbum: async (id: string) => {
    const { setLoading, setError, deleteAlbum } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar el álbum');

      deleteAlbum(id);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  },

  moveAlbum: async (id: string, newParentId: string | null) => {
    const { setLoading, setError, updateAlbum } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/albums/${id}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parentId: newParentId }),
      });

      if (!response.ok) throw new Error('Error al mover el álbum');

      updateAlbum(id, { parentId: newParentId });
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  },
});