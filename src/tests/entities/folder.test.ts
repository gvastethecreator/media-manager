/**
 * @file Pruebas para los transformadores de Folder
 * @module tests/entities/folder
 */

import {
    mapCreateFolderDataToPrisma,
    mapFolderFiltersToPrisma,
    mapUpdateFolderDataToPrisma
} from '../../transformers/folder/mappers';
import {
    extendFolder,
    extendFolders,
    parseFolderTags,
    serializeFolderTags
} from '../../transformers/folder/serializers';
import type { CreateFolderData, FolderBase, FolderFilters, UpdateFolderData } from '../../types/entities/folder';

describe('Folder Serializers', () => {
  const mockFolderBase: FolderBase = {
    id: 'folder1',
    name: 'Test Folder',
    emoji: '📁',
    color: '#64748b',
    description: 'Test folder description',
    tags: '["tag1", "tag2"]',
    isFavorite: true,
    parentId: null,
    path: '/test-folder',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  describe('parseFolderTags', () => {
    it('should parse tags JSON string to array', () => {
      const result = parseFolderTags(mockFolderBase.tags);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should return empty array for "empty_array" string', () => {
      const result = parseFolderTags('empty_array');
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseFolderTags('invalid json');
      expect(result).toEqual([]);
    });
  });

  describe('serializeFolderTags', () => {
    it('should serialize array to JSON string', () => {
      const tags = ['tag1', 'tag2'];
      const result = serializeFolderTags(tags);
      expect(result).toBe(JSON.stringify(tags));
    });

    it('should return "empty_array" for empty array', () => {
      const result = serializeFolderTags([]);
      expect(result).toBe('empty_array');
    });

    it('should return "empty_array" for null or undefined', () => {
      const result1 = serializeFolderTags(null as any);
      const result2 = serializeFolderTags(undefined as any);
      expect(result1).toBe('empty_array');
      expect(result2).toBe('empty_array');
    });
  });

  describe('extendFolder', () => {
    it('should extend a folder with calculated properties', () => {
      const mockFolderWithCounts = {
        ...mockFolderBase,
        _count: {
          images: 4,
          videos: 2,
          subfolders: 3,
          files: 5,
          tagEntities: 2
        }
      };

      const result = extendFolder(mockFolderWithCounts);

      // Verificar campos básicos
      expect(result.id).toBe(mockFolderWithCounts.id);
      expect(result.name).toBe(mockFolderWithCounts.name);
      expect(result.path).toBe(mockFolderWithCounts.path);

      // Verificar que tags se haya parseado
      expect(result.tags).toEqual(['tag1', 'tag2']);

      // Verificar propiedades calculadas
      expect(result.itemCount).toBe(16); // Suma de todos los contadores

      // Verificar que las fechas sean instancias de Date
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle a folder without count information', () => {
      const result = extendFolder(mockFolderBase);

      expect(result.id).toBe(mockFolderBase.id);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.itemCount).toBe(0);
    });

    it('should return null for null or undefined folder', () => {
      expect(extendFolder(null)).toBeNull();
      expect(extendFolder(undefined)).toBeNull();
    });
  });

  describe('extendFolders', () => {
    it('should extend an array of folders', () => {
      const folders = [mockFolderBase, {...mockFolderBase, id: 'folder2', path: '/test-folder-2'}];
      const result = extendFolders(folders);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('folder1');
      expect(result[1].id).toBe('folder2');
      expect(result[0].path).toBe('/test-folder');
      expect(result[1].path).toBe('/test-folder-2');
      expect(result[0].tags).toEqual(['tag1', 'tag2']);
      expect(result[1].tags).toEqual(['tag1', 'tag2']);
    });

    it('should return empty array for null or undefined input', () => {
      expect(extendFolders(null as any)).toEqual([]);
      expect(extendFolders(undefined as any)).toEqual([]);
      expect(extendFolders([] as any)).toEqual([]);
    });
  });
});

describe('Folder Mappers', () => {
  describe('mapCreateFolderDataToPrisma', () => {
    it('should map create data to Prisma format', () => {
      const createData: CreateFolderData = {
        name: 'New Folder',
        emoji: '📂',
        color: '#f97316',
        description: 'Folder description',
        tags: ['folder', 'test'],
        isFavorite: true,
        parentId: 'parent1'
      };

      const result = mapCreateFolderDataToPrisma(createData);

      expect(result.name).toBe(createData.name);
      expect(result.emoji).toBe(createData.emoji);
      expect(result.color).toBe(createData.color);
      expect(result.description).toBe(createData.description);
      expect(result.tags).toBe(JSON.stringify(createData.tags));
      expect(result.isFavorite).toBe(createData.isFavorite);
      expect(result.parentId).toBe(createData.parentId);
    });

    it('should use default values for missing fields', () => {
      const minimalData: CreateFolderData = {
        name: 'Minimal Folder'
      };

      const result = mapCreateFolderDataToPrisma(minimalData);

      expect(result.name).toBe(minimalData.name);
      expect(result.emoji).toBe('📁');
      expect(result.color).toBe('#64748b');
      expect(result.description).toBe('');
      expect(result.tags).toBe('empty_array');
      expect(result.isFavorite).toBe(false);
      expect(result.parentId).toBeNull();
    });
  });

  describe('mapUpdateFolderDataToPrisma', () => {
    it('should map update data to Prisma format', () => {
      const updateData: UpdateFolderData = {
        name: 'Updated Folder',
        emoji: '📂',
        color: '#8b5cf6',
        tags: ['updated', 'folder']
      };

      const result = mapUpdateFolderDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.emoji).toBe(updateData.emoji);
      expect(result.color).toBe(updateData.color);
      expect(result.tags).toBe(JSON.stringify(updateData.tags));

      // Fields not in the update data should be undefined
      expect(result.description).toBeUndefined();
      expect(result.isFavorite).toBeUndefined();
      expect(result.parentId).toBeUndefined();
    });

    it('should only include defined fields in the update', () => {
      const updateData: UpdateFolderData = {
        name: 'Changed Name',
        // All other fields undefined
      };

      const result = mapUpdateFolderDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(Object.keys(result)).toHaveLength(1); // Only name should be included
    });
  });

  describe('mapFolderFiltersToPrisma', () => {
    it('should map filters to Prisma where conditions', () => {
      const filters: FolderFilters = {
        searchQuery: 'test',
        tags: ['tag1', 'tag2'],
        onlyFavorites: true,
        parentId: 'parent1'
      };

      const result = mapFolderFiltersToPrisma(filters);

      expect(result.where.OR).toEqual([
        { name: { contains: 'test', mode: 'insensitive' } },
        { description: { contains: 'test', mode: 'insensitive' } }
      ]);
      expect(result.where.isFavorite).toBe(true);
      expect(result.where.parentId).toBe('parent1');

      // Verificar la condición para tags
      expect(result.where.OR.length).toBe(2);
    });

    it('should handle partial filters', () => {
      const filters: FolderFilters = {
        searchQuery: 'test'
        // No other filters
      };

      const result = mapFolderFiltersToPrisma(filters);

      expect(result.where.OR).toBeDefined();
      expect(result.where.isFavorite).toBeUndefined();
      expect(result.where.parentId).toBeUndefined();
    });

    it('should handle empty filters', () => {
      const result = mapFolderFiltersToPrisma({});

      expect(result.where).toEqual({});
    });
  });
});