import {
    transformImage,
    transformImageToComplete,
    transformImageToExtended,
    transformImages
} from '@/transformers/image/transformer';
import type { ImageComplete, ImageExtended } from '@/types/entities/image/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Image Transformer', () => {
  const mockImageBase = {
    id: 'test-id',
    name: 'test-image.jpg',
    description: 'Test image description',
    path: '/path/to/test-image.jpg',
    hash: 'test-hash',
    size: 1024,
    width: 800,
    height: 600,
    metadata: null,
    isFavorite: false,
    addedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  describe('transformImage', () => {
    it('debería transformar una imagen válida a formato base', () => {
      const result = transformImage(mockImageBase);

      expect(result).toEqual(mockImageBase);
    });

    it('debería manejar una imagen nula o indefinida', () => {
      expect(() => transformImage(null)).toThrow();
      expect(() => transformImage(undefined)).toThrow();
    });

    it('debería manejar una imagen con campos faltantes', () => {
      const incompleteImage = {
        id: 'test-id',
        name: 'test-image.jpg',
        path: '/path/to/test-image.jpg'
      };

      const result = transformImage(incompleteImage);

      expect(result).toMatchObject({
        id: 'test-id',
        name: 'test-image.jpg',
        path: '/path/to/test-image.jpg',
        hash: expect.any(String),
        size: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number)
      });
    });
  });

  describe('transformImages', () => {
    it('debería transformar un array de imágenes válidas', () => {
      const images = [mockImageBase, { ...mockImageBase, id: 'test-id-2' }];
      const result = transformImages(images);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockImageBase);
      expect(result[1]).toEqual({ ...mockImageBase, id: 'test-id-2' });
    });

    it('debería manejar un array vacío', () => {
      const result = transformImages([]);
      expect(result).toEqual([]);
    });

    it('debería filtrar imágenes inválidas del array', () => {
      const images = [mockImageBase, null, undefined, { id: 'invalid' }];
      const result = transformImages(images);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockImageBase);
    });
  });

  describe('transformImageToComplete', () => {
    const mockImageComplete: ImageComplete = {
      ...mockImageBase,
      thumbnail: null,
      thumbnailSize: null,
      thumbnailWidth: null,
      thumbnailHeight: null,
      thumbnailError: null,
      thumbnailErrorAt: null,
      thumbnailOptimizedAt: null,
      folder: { id: 'folder-id' },
      _count: {
        activities: 0,
        uploadedImages: 0,
        profiles: 0,
        albums: 0,
        collections: 0,
        tags: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0,
        groups: 0
      }
    };

    it('debería transformar una imagen a formato completo', () => {
      const result = transformImageToComplete(mockImageComplete);

      expect(result).toEqual(mockImageComplete);
    });

    it('debería manejar una imagen sin relaciones', () => {
      const result = transformImageToComplete(mockImageBase);

      expect(result).toMatchObject({
        ...mockImageBase,
        folder: expect.any(Object),
        _count: expect.any(Object)
      });
    });

    it('debería manejar una imagen nula', () => {
      expect(() => transformImageToComplete(null)).toThrow();
    });
  });

  describe('transformImageToExtended', () => {
    const mockImageExtended: ImageExtended = {
      ...mockImageComplete,
      isSelected: false,
      isLoading: false,
      hasError: false,
      isDragging: false,
      isDropTarget: false
    };

    it('debería transformar una imagen a formato extendido', () => {
      const result = transformImageToExtended(mockImageComplete);

      expect(result).toEqual(mockImageExtended);
    });

    it('debería respetar los valores de UI proporcionados', () => {
      const customUI = {
        isSelected: true,
        isLoading: true,
        hasError: false,
        isDragging: true,
        isDropTarget: true
      };

      const result = transformImageToExtended({
        ...mockImageComplete,
        ...customUI
      });

      expect(result).toMatchObject({
        ...mockImageExtended,
        ...customUI
      });
    });

    it('debería manejar una imagen nula', () => {
      expect(() => transformImageToExtended(null)).toThrow();
    });
  });
});