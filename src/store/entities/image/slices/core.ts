/**
 * @file Slice principal para operaciones CRUD del store de imágenes
 * @module store/entities/image/slices/core
 */

import type { StateCreator } from 'zustand';
import {
    mapCreateImageDataToPrisma
} from '../../../../transformers/image/mappers';
import {
    extendImage,
    extendImages
} from '../../../../transformers/image/serializers';
import type {
    CreateImageData,
    Image,
    ImageBase,
    UpdateImageData
} from '../../../../types/entities/image';
import type { ImageState } from '../types';

// Slice para operaciones CRUD básicas
export interface ImageCoreSlice {
  // Getters
  getImage: (id: string) => Image | undefined;
  getImages: () => Image[];
  getImagesByFolder: (folderId: string) => Image[];

  // Operaciones
  addImage: (image: ImageBase) => void;
  addImages: (images: ImageBase[]) => void;
  updateImage: (id: string, data: UpdateImageData) => void;
  deleteImage: (id: string) => void;

  // Estado de carga
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones asíncronas
  fetchImage: (id: string) => Promise<Image | undefined>;
  fetchImages: (folderIds?: string[]) => Promise<Image[]>;
  createImage: (data: CreateImageData) => Promise<Image | undefined>;
  removeImage: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createImageCoreSlice: StateCreator<
  ImageState,
  [],
  [],
  ImageCoreSlice
> = (set, get) => ({
  // Getters
  getImage: (id: string) => {
    return get().core.images[id];
  },

  getImages: () => {
    return Object.values(get().core.images);
  },

  getImagesByFolder: (folderId: string) => {
    return Object.values(get().core.images).filter(
      (image) => image.folderId === folderId
    );
  },

  // Operaciones síncronas
  addImage: (image: ImageBase) => {
    const extendedImage = extendImage(image);
    set((state) => ({
      core: {
        ...state.core,
        images: {
          ...state.core.images,
          [image.id]: extendedImage,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  addImages: (images: ImageBase[]) => {
    const extendedImages = extendImages(images);
    const imagesMap = extendedImages.reduce(
      (acc, image) => {
        acc[image.id] = image;
        return acc;
      },
      {} as Record<string, Image>
    );

    set((state) => ({
      core: {
        ...state.core,
        images: {
          ...state.core.images,
          ...imagesMap,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  updateImage: (id: string, data: UpdateImageData) => {
    set((state) => {
      const image = state.core.images[id];
      if (!image) return state;

      return {
        core: {
          ...state.core,
          images: {
            ...state.core.images,
            [id]: {
              ...image,
              ...data,
            },
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  deleteImage: (id: string) => {
    set((state) => {
      const newImages = { ...state.core.images };
      delete newImages[id];

      return {
        core: {
          ...state.core,
          images: newImages,
          lastUpdated: Date.now(),
        },
      };
    });
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
  fetchImage: async (id: string) => {
    const { setLoading, setError, addImage } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/images/${id}`);
      if (!response.ok) throw new Error('Error al cargar la imagen');

      const imageData = await response.json();
      addImage(imageData);
      return get().core.images[id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  fetchImages: async (folderIds?: string[]) => {
    const { setLoading, setError, addImages } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      let url = '/api/images';
      if (folderIds && folderIds.length > 0) {
        url += `?folders=${folderIds.join(',')}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar las imágenes');

      const imagesData = await response.json();
      addImages(imagesData);
      return Object.values(get().core.images);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    } finally {
      setLoading(false);
    }
  },

  createImage: async (data: CreateImageData) => {
    const { setLoading, setError, addImage } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const prismaData = mapCreateImageDataToPrisma(data);
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prismaData),
      });

      if (!response.ok) throw new Error('Error al crear la imagen');

      const createdImage = await response.json();
      addImage(createdImage);
      return get().core.images[createdImage.id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  removeImage: async (id: string) => {
    const { setLoading, setError, deleteImage } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la imagen');

      deleteImage(id);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  },
});