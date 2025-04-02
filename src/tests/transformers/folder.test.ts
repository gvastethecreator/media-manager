import { transformFolder, transformFolderToExtended } from '@/transformers/folder/transformer';
import type { Folder, FolderComplete } from '@/types/entities/folder/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Folder Transformer', () => {
  describe('transformFolder', () => {
    it('debería transformar un objeto Folder válido correctamente', () => {
      const mockFolder: Folder = {
        id: 'test-id',
        name: 'Test Folder',
        path: '/test',
        description: 'Test description',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        color: '#3b82f6',
        emoji: '📁',
        _count: {
          children: 0,
          images: 0,
          uploadedImages: 0,
          tags: 0
        }
      };

      const result = transformFolder(mockFolder);

      expect(result).toEqual({
        ...mockFolder,
        children: [],
        parent: null,
        metadata: {},
        stats: null
      });
    });

    it('debería manejar un objeto Folder inválido', () => {
      const result = transformFolder(null);

      expect(result).toEqual({
        id: 'unknown',
        name: 'Unknown Folder',
        path: '/',
        description: '',
        parentId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        children: [],
        parent: null,
        _count: {
          children: 0,
          images: 0,
          uploadedImages: 0,
          tags: 0
        },
        metadata: {},
        color: '#3b82f6',
        emoji: '📁',
        stats: null
      });
    });

    it('debería preservar las relaciones existentes', () => {
      const mockFolder: FolderComplete = {
        id: 'test-id',
        name: 'Test Folder',
        path: '/test',
        description: 'Test description',
        parentId: 'parent-id',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        color: '#3b82f6',
        emoji: '📁',
        children: [
          {
            id: 'child-id',
            name: 'Child Folder',
            path: '/test/child',
            description: '',
            parentId: 'test-id',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            color: '#3b82f6',
            emoji: '📁'
          }
        ],
        parent: {
          id: 'parent-id',
          name: 'Parent Folder',
          path: '/',
          description: '',
          parentId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          color: '#3b82f6',
          emoji: '📁'
        },
        _count: {
          children: 1,
          images: 0,
          uploadedImages: 0,
          tags: 0
        },
        metadata: {
          customField: 'value'
        },
        stats: null
      };

      const result = transformFolder(mockFolder);

      expect(result).toEqual(mockFolder);
    });
  });

  describe('transformFolderToExtended', () => {
    it('debería transformar a FolderExtended con valores por defecto', () => {
      const mockFolder: Folder = {
        id: 'test-id',
        name: 'Test Folder',
        path: '/test',
        description: 'Test description',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        color: '#3b82f6',
        emoji: '📁',
        _count: {
          children: 0,
          images: 0,
          uploadedImages: 0,
          tags: 0
        }
      };

      const result = transformFolderToExtended(mockFolder);

      expect(result).toEqual({
        ...transformFolder(mockFolder),
        isSelected: false,
        isOpen: false,
        isLoading: false,
        hasError: false,
        isDragging: false,
        isDropTarget: false,
        level: 0
      });
    });

    it('debería respetar los valores de UI proporcionados', () => {
      const mockFolder: Folder = {
        id: 'test-id',
        name: 'Test Folder',
        path: '/test',
        description: 'Test description',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        color: '#3b82f6',
        emoji: '📁',
        _count: {
          children: 0,
          images: 0,
          uploadedImages: 0,
          tags: 0
        }
      };

      const result = transformFolderToExtended(mockFolder, true, true);

      expect(result).toEqual({
        ...transformFolder(mockFolder),
        isSelected: true,
        isOpen: true,
        isLoading: false,
        hasError: false,
        isDragging: false,
        isDropTarget: false,
        level: 0
      });
    });

    it('debería manejar errores y devolver un objeto con hasError=true', () => {
      const result = transformFolderToExtended(null);

      expect(result).toEqual({
        id: 'unknown',
        name: 'Unknown Folder',
        path: '/',
        description: '',
        parentId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        children: [],
        parent: null,
        _count: {
          children: 0,
          images: 0,
          uploadedImages: 0,
          tags: 0
        },
        metadata: {},
        color: '#3b82f6',
        emoji: '📁',
        stats: null,
        isSelected: false,
        isOpen: false,
        isLoading: false,
        hasError: true,
        isDragging: false,
        isDropTarget: false,
        level: 0
      });
    });
  });
});