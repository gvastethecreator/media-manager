import {
    extendImage,
    fromPrismaImage,
    parseImageFilters,
    toPrismaImage,
    validateImage
} from '@/transformers/image/serializers';
import type { ImageComplete, ImageCreateInput } from '@/types/entities/image/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Image Serializers', () => {
  const mockImageCreateInput: ImageCreateInput = {
    title: 'Test Image',
    description: 'Test description',
    path: '/path/to/image.jpg',
    alt: 'Test alt text',
    width: 1920,
    height: 1080,
    size: 1024000,
    type: 'ORIGINAL',
    category: 'GENERAL',
    status: 'PENDING',
    folderId: 'folder-id',
    isCreating: true
  };

  const mockPrismaImage = {
    id: 'test-id',
    title: 'Test Image',
    description: 'Test description',
    path: '/path/to/image.jpg',
    alt: 'Test alt text',
    source: '',
    prompt: '',
    negativePrompt: '',
    params: '',
    width: 1920,
    height: 1080,
    size: 1024000,
    type: 'ORIGINAL',
    category: 'GENERAL',
    status: 'PENDING',
    sensitive: false,
    favorite: false,
    published: false,
    quality: 0,
    upscaled: false,
    folderId: 'folder-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    folder: {
      id: 'folder-id',
      name: 'Test Folder',
      path: '/test-folder'
    },
    stats: null,
    activities: [],
    uploadedImages: [],
    profiles: [],
    albums: [],
    collections: [],
    tags: [],
    characters: [],
    places: [],
    worldItems: [],
    concepts: [],
    prompts: [],
    notes: [],
    wildcards: [],
    properties: [],
    groups: [],
    _count: {
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

  describe('toPrismaImage', () => {
    it('debería transformar una ImageCreateInput válida', () => {
      const result = toPrismaImage(mockImageCreateInput);

      expect(result).toEqual({
        title: 'Test Image',
        description: 'Test description',
        path: '/path/to/image.jpg',
        alt: 'Test alt text',
        width: 1920,
        height: 1080,
        size: 1024000,
        type: 'ORIGINAL',
        category: 'GENERAL',
        status: 'PENDING',
        sensitive: false,
        favorite: false,
        published: false,
        folderId: 'folder-id'
      });
    });

    it('debería validar campos requeridos para creación', () => {
      const invalidInput = {
        title: 'Test Image',
        isCreating: true
      };

      expect(() => toPrismaImage(invalidInput)).toThrow();
    });

    it('debería filtrar propiedades undefined', () => {
      const input = {
        ...mockImageCreateInput,
        title: undefined,
        description: undefined
      };

      const result = toPrismaImage(input);

      expect(result).not.toHaveProperty('title');
      expect(result).not.toHaveProperty('description');
    });
  });

  describe('fromPrismaImage', () => {
    it('debería transformar datos de Prisma a ImageComplete', () => {
      const result = fromPrismaImage(mockPrismaImage);

      expect(result).toEqual({
        ...mockPrismaImage,
        counts: {
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
        },
        ui: {
          expanded: false,
          selected: false,
          visible: true,
          highlighted: false,
          focused: false
        }
      });
    });

    it('debería manejar valores nulos o indefinidos', () => {
      const prismaImageIncompleto = {
        ...mockPrismaImage,
        title: null,
        description: null,
        alt: null,
        source: null,
        _count: undefined
      };

      const result = fromPrismaImage(prismaImageIncompleto);

      expect(result.title).toBe('');
      expect(result.description).toBe('');
      expect(result.alt).toBe('');
      expect(result.source).toBe('');
      expect(result.counts).toEqual({
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
      });
    });
  });

  describe('validateImage', () => {
    it('debería validar una imagen completa válida', () => {
      const result = validateImage(mockPrismaImage);
      expect(result).toEqual(mockPrismaImage);
    });

    it('debería rechazar datos inválidos', () => {
      const invalidImage = {
        id: 'test-id'
        // Faltan campos requeridos
      };

      expect(() => validateImage(invalidImage)).toThrow();
    });
  });

  describe('extendImage', () => {
    const mockImage: ImageComplete = {
      ...mockPrismaImage,
      counts: {
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
      },
      ui: {
        expanded: false,
        selected: false,
        visible: true,
        highlighted: false,
        focused: false
      }
    };

    it('debería extender una imagen con opciones por defecto', () => {
      const result = extendImage(mockImage);
      expect(result).toEqual(mockImage);
    });

    it('debería extender una imagen con estadísticas', () => {
      const result = extendImage(mockImage, { includeStats: true });
      expect(result).toHaveProperty('stats');
    });

    it('debería extender una imagen con relaciones', () => {
      const result = extendImage(mockImage, { includeRelations: true });
      expect(result).toHaveProperty('folder');
      expect(result).toHaveProperty('albums');
      expect(result).toHaveProperty('tags');
    });
  });

  describe('parseImageFilters', () => {
    it('debería parsear filtros básicos', () => {
      const filters = {
        title: 'test',
        type: 'ORIGINAL',
        folderId: 'folder-id'
      };

      const result = parseImageFilters(filters);

      expect(result).toEqual({
        title: { contains: 'test', mode: 'insensitive' },
        type: 'ORIGINAL',
        folderId: 'folder-id'
      });
    });

    it('debería manejar filtros de fecha', () => {
      const filters = {
        createdAt: {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      };

      const result = parseImageFilters(filters);

      expect(result).toHaveProperty('createdAt.gte');
      expect(result).toHaveProperty('createdAt.lte');
    });

    it('debería manejar filtros booleanos', () => {
      const filters = {
        sensitive: true,
        favorite: false
      };

      const result = parseImageFilters(filters);

      expect(result).toEqual({
        sensitive: true,
        favorite: false
      });
    });

    it('debería ignorar filtros inválidos', () => {
      const filters = {
        invalidField: 'value',
        title: 'test'
      };

      const result = parseImageFilters(filters);

      expect(result).toEqual({
        title: { contains: 'test', mode: 'insensitive' }
      });
    });
  });
});