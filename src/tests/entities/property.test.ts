/**
 * @file Pruebas para los transformadores de Property
 * @module tests/entities/property
 */

import {
    mapPropertyFiltersToPrisma,
    toCreatePropertyData,
    toUpdatePropertyData
} from '@/transformers/property/mappers';
import {
    extendProperties,
    extendProperty
} from '@/transformers/property/serializers';
import type { CreatePropertyData, PropertyBase, PropertyFilters, UpdatePropertyData } from '@/types/entities/property';

describe('Property Serializers', () => {
  const mockPropertyBase: PropertyBase = {
    id: 'property1',
    name: 'Test Property',
    emoji: '🔍',
    color: '#4ade80',
    description: 'Test property description',
    category: 'metadata',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  describe('extendProperty', () => {
    it('should extend a property with calculated properties', () => {
      const mockPropertyWithCounts = {
        ...mockPropertyBase,
        _count: {
          images: 5,
          videos: 2,
          albums: 3,
          tags: 4,
          characters: 1,
          places: 2,
          worldItems: 0,
          concepts: 3,
          prompts: 1,
          notes: 2,
          wildcards: 3
        }
      };

      const result = extendProperty(mockPropertyWithCounts);

      // Verificar campos básicos
      expect(result.id).toBe(mockPropertyWithCounts.id);
      expect(result.name).toBe(mockPropertyWithCounts.name);

      // Verificar propiedades calculadas
      expect(result.itemCount).toBe(26); // Suma de todos los contadores

      // Verificar que las fechas sean instancias de Date
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle a property without count information', () => {
      const result = extendProperty(mockPropertyBase);

      expect(result.id).toBe(mockPropertyBase.id);
      expect(result.itemCount).toBe(0);
    });

    it('should return null for null or undefined property', () => {
      expect(extendProperty(null)).toBeNull();
      expect(extendProperty(undefined)).toBeNull();
    });
  });

  describe('extendProperties', () => {
    it('should extend an array of properties', () => {
      const properties = [mockPropertyBase, {...mockPropertyBase, id: 'property2'}];
      const result = extendProperties(properties);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('property1');
      expect(result[1].id).toBe('property2');
    });

    it('should return empty array for null or undefined input', () => {
      expect(extendProperties(null as any)).toEqual([]);
      expect(extendProperties(undefined as any)).toEqual([]);
      expect(extendProperties([] as any)).toEqual([]);
    });
  });
});

describe('Property Mappers', () => {
  describe('mapCreatePropertyDataToPrisma', () => {
    it('should map create data to Prisma format', () => {
      const createData: CreatePropertyData = {
        name: 'New Property',
        emoji: '💎',
        color: '#d946ef',
        description: 'Property description',
        category: 'technical'
      };

      const result = toCreatePropertyData(createData);

      expect(result.name).toBe(createData.name);
      expect(result.emoji).toBe(createData.emoji);
      expect(result.color).toBe(createData.color);
      expect(result.description).toBe(createData.description);
      expect(result.category).toBe(createData.category);
    });

    it('should use default values for missing fields', () => {
      const minimalData: CreatePropertyData = {
        name: 'Minimal Property'
      };

      const result = toCreatePropertyData(minimalData);

      expect(result.name).toBe(minimalData.name);
      expect(result.emoji).toBe('🔍');
      expect(result.color).toBe('#4ade80');
      expect(result.description).toBe('');
      expect(result.category).toBe('metadata');
    });
  });

  describe('mapUpdatePropertyDataToPrisma', () => {
    it('should map update data to Prisma format', () => {
      const updateData: UpdatePropertyData = {
        name: 'Updated Property',
        emoji: '⚡',
        color: '#ea580c'
      };

      const result = toUpdatePropertyData(updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.emoji).toBe(updateData.emoji);
      expect(result.color).toBe(updateData.color);

      // Fields not in the update data should be undefined
      expect(result.description).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('should only include defined fields in the update', () => {
      const updateData: UpdatePropertyData = {
        name: 'Changed Name',
        // All other fields undefined
      };

      const result = toUpdatePropertyData(updateData);

      expect(result.name).toBe(updateData.name);
      expect(Object.keys(result)).toHaveLength(1); // Only name should be included
    });
  });

  describe('mapPropertyFiltersToPrisma', () => {
    it('should map filters to Prisma where conditions', () => {
      const filters: PropertyFilters = {
        searchQuery: 'test',
        categories: ['metadata', 'technical']
      };

      const result = mapPropertyFiltersToPrisma(filters);

      expect(result.where.OR).toEqual([
        { name: { contains: 'test', mode: 'insensitive' } },
        { description: { contains: 'test', mode: 'insensitive' } }
      ]);
      expect(result.where.category).toEqual({ in: ['metadata', 'technical'] });
    });

    it('should handle partial filters', () => {
      const filters: PropertyFilters = {
        searchQuery: 'test'
        // No other filters
      };

      const result = mapPropertyFiltersToPrisma(filters);

      expect(result.where.OR).toBeDefined();
      expect(result.where.category).toBeUndefined();
    });

    it('should handle empty filters', () => {
      const result = mapPropertyFiltersToPrisma({});

      expect(result.where).toEqual({});
    });
  });
});