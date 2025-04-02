import {
    generateFolderColor,
    generateFolderEmoji,
    normalizeFolderPath,
    normalizeFolderType,
    parseFolderFilters,
    withFolderStats
} from '@/transformers/folder/serializers';
import { FolderType } from '@/types/entities/folder/enums';
import type { Folder } from '@/types/entities/folder/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 Folder Serializers', () => {
  describe('generateFolderColor', () => {
    it('debería generar un color hexadecimal válido', () => {
      const color = generateFolderColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('debería generar colores diferentes', () => {
      const colors = new Set();
      for (let i = 0; i < 10; i++) {
        colors.add(generateFolderColor());
      }
      // Debería haber al menos algunos colores diferentes
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe('generateFolderEmoji', () => {
    it('debería generar un emoji válido', () => {
      const emoji = generateFolderEmoji();
      expect(emoji).toMatch(/[\p{Emoji}]/u);
    });

    it('debería generar emojis diferentes', () => {
      const emojis = new Set();
      for (let i = 0; i < 10; i++) {
        emojis.add(generateFolderEmoji());
      }
      // Debería haber al menos algunos emojis diferentes
      expect(emojis.size).toBeGreaterThan(1);
    });
  });

  describe('normalizeFolderPath', () => {
    it('debería normalizar paths básicos', () => {
      expect(normalizeFolderPath('/test')).toBe('/test');
      expect(normalizeFolderPath('test')).toBe('/test');
      expect(normalizeFolderPath('/test/')).toBe('/test');
    });

    it('debería manejar barras duplicadas', () => {
      expect(normalizeFolderPath('//test')).toBe('/test');
      expect(normalizeFolderPath('test//folder')).toBe('/test/folder');
      expect(normalizeFolderPath('/test//folder/')).toBe('/test/folder');
    });

    it('debería manejar espacios en blanco', () => {
      expect(normalizeFolderPath(' /test ')).toBe('/test');
      expect(normalizeFolderPath('  test  ')).toBe('/test');
    });

    it('debería preservar la raíz', () => {
      expect(normalizeFolderPath('/')).toBe('/');
    });
  });

  describe('withFolderStats', () => {
    const mockFolder: Folder = {
      id: 'test-id',
      name: 'Test Folder',
      path: '/test/folder',
      description: 'Test description',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      color: '#3b82f6',
      emoji: '📁',
      _count: {
        children: 2,
        images: 5,
        uploadedImages: 3,
        tags: 4
      }
    };

    it('debería calcular estadísticas correctamente', () => {
      const result = withFolderStats(mockFolder);

      expect(result.stats).toEqual({
        totalImages: 5,
        totalUploadedImages: 3,
        totalChildren: 2,
        totalTags: 4,
        lastUpdated: mockFolder.updatedAt,
        createdAt: mockFolder.createdAt,
        level: 2, // /test/folder = nivel 2
        isRoot: true,
        isEmpty: false,
        hasChildren: true,
        size: expect.any(Number)
      });
    });

    it('debería manejar carpetas sin conteos', () => {
      const folderSinConteos = { ...mockFolder, _count: undefined };
      const result = withFolderStats(folderSinConteos);

      expect(result.stats).toEqual({
        totalImages: 0,
        totalUploadedImages: 0,
        totalChildren: 0,
        totalTags: 0,
        lastUpdated: mockFolder.updatedAt,
        createdAt: mockFolder.createdAt,
        level: 2,
        isRoot: true,
        isEmpty: true,
        hasChildren: false,
        size: expect.any(Number)
      });
    });
  });

  describe('normalizeFolderType', () => {
    it('debería normalizar tipos válidos', () => {
      expect(normalizeFolderType('standard')).toBe(FolderType.STANDARD);
      expect(normalizeFolderType('SYSTEM')).toBe(FolderType.SYSTEM);
      expect(normalizeFolderType('virtual')).toBe(FolderType.VIRTUAL);
    });

    it('debería manejar tipos inválidos', () => {
      expect(normalizeFolderType('invalid')).toBe(FolderType.STANDARD);
      expect(normalizeFolderType('')).toBe(FolderType.STANDARD);
      expect(normalizeFolderType(undefined)).toBe(FolderType.STANDARD);
    });

    it('debería ser case-insensitive', () => {
      expect(normalizeFolderType('StAnDaRd')).toBe(FolderType.STANDARD);
      expect(normalizeFolderType('system')).toBe(FolderType.SYSTEM);
      expect(normalizeFolderType('VIRTUAL')).toBe(FolderType.VIRTUAL);
    });
  });

  describe('parseFolderFilters', () => {
    it('debería parsear filtros básicos', () => {
      const query = {
        name: 'test',
        path: '/test',
        parentId: 'parent-id'
      };

      const result = parseFolderFilters(query);

      expect(result).toEqual({
        name: { contains: 'test', mode: 'insensitive' },
        path: { contains: '/test' },
        parentId: 'parent-id'
      });
    });

    it('debería manejar parentId nulo', () => {
      const query = {
        parentId: 'null'
      };

      const result = parseFolderFilters(query);

      expect(result).toEqual({
        parentId: null
      });
    });

    it('debería ignorar campos no soportados', () => {
      const query = {
        name: 'test',
        unsupported: 'value'
      };

      const result = parseFolderFilters(query);

      expect(result).toEqual({
        name: { contains: 'test', mode: 'insensitive' }
      });
    });

    it('debería manejar un query vacío', () => {
      const result = parseFolderFilters({});
      expect(result).toEqual({});
    });
  });
});