/**
 * @file Pruebas para los transformadores de Concept
 * @module tests/entities/concept
 */

import {
  mapConceptFiltersToPrisma,
  mapCreateConceptDataToPrisma,
  mapUpdateConceptDataToPrisma
} from '../../transformers/concept/mappers';
import {
  extendConcept,
  extendConcepts,
  parseConceptTags,
  serializeConceptTags
} from '../../transformers/concept/serializers';
import type { ConceptBase, ConceptFilters, CreateConceptData, UpdateConceptData } from '../../types/entities/concept';

describe('Concept Serializers', () => {
  const mockConceptBase: ConceptBase = {
    id: 'concept1',
    name: 'Test Concept',
    emoji: '💡',
    color: '#64748b',
    description: 'Test concept description',
    tags: '["tag1", "tag2"]',
    isFavorite: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  describe('parseConceptTags', () => {
    it('should parse tags JSON string to array', () => {
      const result = parseConceptTags(mockConceptBase.tags);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should return empty array for "empty_array" string', () => {
      const result = parseConceptTags('empty_array');
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseConceptTags('invalid json');
      expect(result).toEqual([]);
    });
  });

  describe('serializeConceptTags', () => {
    it('should serialize array to JSON string', () => {
      const tags = ['tag1', 'tag2'];
      const result = serializeConceptTags(tags);
      expect(result).toBe(JSON.stringify(tags));
    });

    it('should return "empty_array" for empty array', () => {
      const result = serializeConceptTags([]);
      expect(result).toBe('empty_array');
    });

    it('should return "empty_array" for null or undefined', () => {
      const result1 = serializeConceptTags(null as any);
      const result2 = serializeConceptTags(undefined as any);
      expect(result1).toBe('empty_array');
      expect(result2).toBe('empty_array');
    });
  });

  describe('extendConcept', () => {
    it('should extend a concept with calculated properties', () => {
      const mockConceptWithCounts = {
        ...mockConceptBase,
        _count: {
          images: 4,
          videos: 2,
          albums: 1,
          collections: 0,
          wildcards: 3,
          properties: 2,
          prompts: 1,
          notes: 2,
          tagEntities: 3
        }
      };

      const result = extendConcept(mockConceptWithCounts);

      // Verificar campos básicos
      expect(result.id).toBe(mockConceptWithCounts.id);
      expect(result.name).toBe(mockConceptWithCounts.name);

      // Verificar que tags se haya parseado
      expect(result.tags).toEqual(['tag1', 'tag2']);

      // Verificar propiedades calculadas
      expect(result.itemCount).toBe(18); // Suma de todos los contadores

      // Verificar que las fechas sean instancias de Date
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle a concept without count information', () => {
      const result = extendConcept(mockConceptBase);

      expect(result.id).toBe(mockConceptBase.id);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.itemCount).toBe(0);
    });

    it('should return null for null or undefined concept', () => {
      expect(extendConcept(null)).toBeNull();
      expect(extendConcept(undefined)).toBeNull();
    });
  });

  describe('extendConcepts', () => {
    it('should extend an array of concepts', () => {
      const concepts = [mockConceptBase, {...mockConceptBase, id: 'concept2'}];
      const result = extendConcepts(concepts);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('concept1');
      expect(result[1].id).toBe('concept2');
      expect(result[0].tags).toEqual(['tag1', 'tag2']);
      expect(result[1].tags).toEqual(['tag1', 'tag2']);
    });

    it('should return empty array for null or undefined input', () => {
      expect(extendConcepts(null as any)).toEqual([]);
      expect(extendConcepts(undefined as any)).toEqual([]);
      expect(extendConcepts([] as any)).toEqual([]);
    });
  });
});

describe('Concept Mappers', () => {
  describe('mapCreateConceptDataToPrisma', () => {
    it('should map create data to Prisma format', () => {
      const createData: CreateConceptData = {
        name: 'New Concept',
        emoji: '🧠',
        color: '#f97316',
        description: 'Concept description',
        tags: ['concept', 'idea'],
        isFavorite: true
      };

      const result = mapCreateConceptDataToPrisma(createData);

      expect(result.name).toBe(createData.name);
      expect(result.emoji).toBe(createData.emoji);
      expect(result.color).toBe(createData.color);
      expect(result.description).toBe(createData.description);
      expect(result.tags).toBe(JSON.stringify(createData.tags));
      expect(result.isFavorite).toBe(createData.isFavorite);
    });

    it('should use default values for missing fields', () => {
      const minimalData: CreateConceptData = {
        name: 'Minimal Concept'
      };

      const result = mapCreateConceptDataToPrisma(minimalData);

      expect(result.name).toBe(minimalData.name);
      expect(result.emoji).toBe('💡');
      expect(result.color).toBe('#64748b');
      expect(result.description).toBe('');
      expect(result.tags).toBe('empty_array');
      expect(result.isFavorite).toBe(false);
    });
  });

  describe('mapUpdateConceptDataToPrisma', () => {
    it('should map update data to Prisma format', () => {
      const updateData: UpdateConceptData = {
        name: 'Updated Concept',
        emoji: '🔮',
        color: '#8b5cf6',
        tags: ['updated', 'concept']
      };

      const result = mapUpdateConceptDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.emoji).toBe(updateData.emoji);
      expect(result.color).toBe(updateData.color);
      expect(result.tags).toBe(JSON.stringify(updateData.tags));

      // Fields not in the update data should be undefined
      expect(result.description).toBeUndefined();
      expect(result.isFavorite).toBeUndefined();
    });

    it('should only include defined fields in the update', () => {
      const updateData: UpdateConceptData = {
        name: 'Changed Name',
        // All other fields undefined
      };

      const result = mapUpdateConceptDataToPrisma(updateData);

      expect(result.name).toBe(updateData.name);
      expect(Object.keys(result)).toHaveLength(1); // Only name should be included
    });
  });

  describe('mapConceptFiltersToPrisma', () => {
    it('should map filters to Prisma where conditions', () => {
      const filters: ConceptFilters = {
        searchQuery: 'test',
        tags: ['tag1', 'tag2'],
        onlyFavorites: true
      };

      const result = mapConceptFiltersToPrisma(filters);

      expect(result.where.OR).toEqual([
        { name: { contains: 'test', mode: 'insensitive' } },
        { description: { contains: 'test', mode: 'insensitive' } }
      ]);
      expect(result.where.isFavorite).toBe(true);

      // Verificar la condición para tags
      expect(result.where.OR.length).toBe(2);
    });

    it('should handle partial filters', () => {
      const filters: ConceptFilters = {
        searchQuery: 'test'
        // No other filters
      };

      const result = mapConceptFiltersToPrisma(filters);

      expect(result.where.OR).toBeDefined();
      expect(result.where.isFavorite).toBeUndefined();
    });

    it('should handle empty filters', () => {
      const result = mapConceptFiltersToPrisma({});

      expect(result.where).toEqual({});
    });
  });
});