/**
 * @file Pruebas para los transformadores de Wildcard
 * @module tests/entities/wildcard
 */

import {
  mapCreateWildcardDataToPrisma,
  mapUpdateWildcardDataToPrisma,
  mapWildcardFiltersToPrisma
} from '../../transformers/wildcard/mappers';
import {
  extendWildcard,
  extendWildcards,
  parseWildcardChildren,
  serializeWildcardChildren
} from '../../transformers/wildcard/serializers';
import type { CreateWildcardData, UpdateWildcardData, WildcardBase, WildcardFilters } from '../../types/entities/wildcard';

describe('Wildcard Serializers', () => {
  const mockWildcardBase: WildcardBase = {
    id: 'wildcard1',
    name: 'Test Wildcard',
    emoji: '🎭',
    color: '#3b82f6',
    description: 'Test description',
    shortcut: 'tw',
    category: 'test',
    children: '["child1", "child2"]',
    featuredImage: null,
    isFavorite: false,
    parentId: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  describe('parseWildcardChildren', () => {
    it('should parse children JSON string to array', () => {
      const result = parseWildcardChildren(mockWildcardBase.children);
      expect(result).toEqual(['child1', 'child2']);
    });

    it('should return empty array for "empty_array" string', () => {
      const result = parseWildcardChildren('empty_array');
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseWildcardChildren('invalid json');
      expect(result).toEqual([]);
    });
  });

  describe('serializeWildcardChildren', () => {
    it('should serialize array to JSON string', () => {
      const children = ['child1', 'child2'];
      const result = serializeWildcardChildren(children);
      expect(result).toBe(JSON.stringify(children));
    });

    it('should return "empty_array" for empty array', () => {
      const result = serializeWildcardChildren([]);
      expect(result).toBe('empty_array');
    });

    it('should return "empty_array" for null or undefined', () => {
      const result1 = serializeWildcardChildren(null as any);
      const result2 = serializeWildcardChildren(undefined as any);
      expect(result1).toBe('empty_array');
      expect(result2).toBe('empty_array');
    });
  });

  describe('extendWildcard', () => {
    it('should extend a wildcard with calculated properties', () => {
      const mockWildcardWithCounts = {
        ...mockWildcardBase,
        _count: {
          images: 2,
          videos: 1,
          childWildcards: 3,
          albums: 2,
          collections: 1,
          tags: 4,
          characters: 2,
          places: 1,
          worldItems: 3,
          concepts: 2,
          prompts: 1,
          notes: 3,
          properties: 2,
          groups: 1
        }
      };

      const result = extendWildcard(mockWildcardWithCounts);

      // Verificar campos básicos
      expect(result.id).toBe(mockWildcardWithCounts.id);
      expect(result.name).toBe(mockWildcardWithCounts.name);

      // Verificar que children se haya parseado
      expect(result.children).toEqual(['child1', 'child2']);

      // Verificar propiedades calculadas
      expect(result.hasParent).toBe(false);
      expect(result.hasChildren).toBe(true);
      expect(result.itemCount).toBe(28); // Suma de todos los contadores

      // Verificar que las fechas sean instancias de Date
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle a wildcard without count information', () => {
      const result = extendWildcard(mockWildcardBase);

      expect(result.id).toBe(mockWildcardBase.id);
      expect(result.children).toEqual(['child1', 'child2']);
      expect(result.itemCount).toBe(0);
      expect(result.hasParent).toBe(false);
      expect(result.hasChildren).toBe(false);
    });

    it('should return null for null or undefined wildcard', () => {
      expect(extendWildcard(null)).toBeNull();
      expect(extendWildcard(undefined)).toBeNull();
    });
  });

  describe('extendWildcards', () => {
    it('should extend an array of wildcards', () => {
      const wildcards = [mockWildcardBase, {...mockWildcardBase, id: 'wildcard2'}];
      const result = extendWildcards(wildcards);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('wildcard1');
      expect(result[1].id).toBe('wildcard2');
      expect(result[0].children).toEqual(['child1', 'child2']);
      expect(result[1].children).toEqual(['child1', 'child2']);
    });

    it('should return empty array for null or undefined input', () => {
      expect(extendWildcards(null as any)).toEqual([]);
      expect(extendWildcards(undefined as any)).toEqual([]);
      expect(extendWildcards([] as any)).toEqual([]);
    });
  });
});

describe('Wildcard Mappers', () => {
  describe('mapCreateWildcardDataToPrisma', () => {
    it('should map create data to Prisma format', () => {
      const createData: CreateWildcardData = {
        name: 'New Wildcard',
        emoji: '🌟',
        color: '#ff0000',
        description: 'Test description',
        category: 'character',
        isFavorite: true
      };

      const result = mapCreateWildcardDataToPrisma(createData);

      expect(result.name).toBe(createData.name);
      expect(result.emoji).toBe(createData.emoji);
      expect(result.color).toBe(createData.color);
      expect(result.description).toBe(createData.description);
      expect(result.category).toBe(createData.category);
      expect(result.isFavorite).toBe(createData.isFavorite);
      expect(result.children).toBe('empty_array');
      expect(result.parentId).toBeNull();
    });

    it('should use default values for missing fields', () => {
      const minimalData: CreateWildcardData = {
        name: 'Minimal Wildcard'
      };

      const result = mapCreateWildcardDataToPrisma(minimalData);

      expect(result.name).toBe(minimalData.name);
      expect(result.emoji).toBe('🎭');
      expect(result.color).toBe('#3b82f6');
      expect(result.category).toBe('general');
      expect(result.children).toBe('empty_array');
      expect(result.isFavorite).toBe(false);
      expect(result.parentId).toBeNull();
    });
  });

  describe('mapUpdateWildcardDataToPrisma', () => {
    it('should map update data to Prisma format', () => {
      const updateData: UpdateWildcardData = {
        name: 'Updated Wildcard',
        emoji: '⭐',
        color: '#00ff00',
        children: '["child3"]'
      };

      const result = mapUpdateWildcardDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.emoji).toBe(updateData.emoji);
      expect(result.color).toBe(updateData.color);
      expect(result.children).toBe(updateData.children);

      // Fields not in the update data should be undefined
      expect(result.description).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('should only include defined fields in the update', () => {
      const updateData: UpdateWildcardData = {
        name: 'Changed Name',
        // All other fields undefined
      };

      const result = mapUpdateWildcardDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(Object.keys(result)).toHaveLength(1); // Only name should be included
    });
  });

  describe('mapWildcardFiltersToPrisma', () => {
    it('should map filters to Prisma where conditions', () => {
      const filters: WildcardFilters = {
        searchQuery: 'test',
        categories: ['character', 'place'],
        onlyFavorites: true,
        parentId: 'parent1'
      };

      const result = mapWildcardFiltersToPrisma(filters);

      expect(result.where.OR).toEqual([
        { name: { contains: 'test', mode: 'insensitive' } },
        { description: { contains: 'test', mode: 'insensitive' } }
      ]);
      expect(result.where.category).toEqual({ in: ['character', 'place'] });
      expect(result.where.isFavorite).toBe(true);
      expect(result.where.parentId).toBe('parent1');
    });

    it('should handle partial filters', () => {
      const filters: WildcardFilters = {
        searchQuery: 'test'
        // No other filters
      };

      const result = mapWildcardFiltersToPrisma(filters);

      expect(result.where.OR).toBeDefined();
      expect(result.where.category).toBeUndefined();
      expect(result.where.isFavorite).toBeUndefined();
      expect(result.where.parentId).toBeUndefined();
    });

    it('should handle empty filters', () => {
      const result = mapWildcardFiltersToPrisma({});

      expect(result.where).toEqual({});
    });
  });
});