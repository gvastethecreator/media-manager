import {
    formatDate,
    formatFileSize,
    getColorForFileType,
    getIconForFileType,
    transformFile,
    transformFiles
} from '@/transformers/file';
import type { DirectoryInfo, FileBase, ImageFileInfo } from '@/types/entities/file/base';
import { describe, expect, it } from '@jest/globals';

describe('🧪 File Transformer', () => {
  describe('transformFile', () => {
    it('debería transformar un archivo básico correctamente', () => {
      const mockFile: FileBase = {
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: new Date('2024-01-01'),
        modifiedAt: new Date('2024-01-01'),
        isDirectory: false
      };

      const result = transformFile(mockFile);

      expect(result).toEqual({
        ...mockFile,
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String)
      });
    });

    it('debería transformar un directorio correctamente', () => {
      const mockDirectory: DirectoryInfo = {
        id: 'dir-123',
        name: 'Test Folder',
        path: '/documents/test',
        type: 'DIRECTORY',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: new Date('2024-01-01'),
        modifiedAt: new Date('2024-01-01'),
        isDirectory: true,
        itemCount: 3,
        children: [
          {
            id: 'file-1',
            name: 'child1.txt',
            path: '/documents/test/child1.txt',
            type: 'TEXT',
            extension: 'txt',
            mimeType: 'text/plain',
            size: 512,
            createdAt: new Date('2024-01-01'),
            modifiedAt: new Date('2024-01-01'),
            isDirectory: false
          }
        ]
      };

      const result = transformFile(mockDirectory);

      expect(result).toEqual(expect.objectContaining({
        ...mockDirectory,
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String),
        hasItems: true
      }));
    });

    it('debería transformar un archivo de imagen correctamente', () => {
      const mockImageFile: ImageFileInfo = {
        id: 'img-123',
        name: 'test.jpg',
        path: '/images/test.jpg',
        type: 'IMAGE',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        createdAt: new Date('2024-01-01'),
        modifiedAt: new Date('2024-01-01'),
        isDirectory: false,
        width: 800,
        height: 600
      };

      const result = transformFile(mockImageFile);

      expect(result).toEqual(expect.objectContaining({
        ...mockImageFile,
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String),
        dimensions: '800x600'
      }));
    });

    it('debería manejar un objeto null', () => {
      const result = transformFile(null);
      expect(result).toBeNull();
    });
  });

  describe('transformFiles', () => {
    it('debería transformar un array de archivos correctamente', () => {
      const mockFiles: FileBase[] = [
        {
          id: 'file-1',
          name: 'test1.txt',
          path: '/documents/test1.txt',
          type: 'TEXT',
          extension: 'txt',
          mimeType: 'text/plain',
          size: 1024,
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-01'),
          isDirectory: false
        },
        {
          id: 'file-2',
          name: 'test2.jpg',
          path: '/documents/test2.jpg',
          type: 'IMAGE',
          extension: 'jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-01'),
          isDirectory: false
        }
      ];

      const result = transformFiles(mockFiles);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'file-1',
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String)
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'file-2',
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String)
      }));
    });

    it('debería devolver un array vacío cuando se le pasa null', () => {
      const result = transformFiles(null);
      expect(result).toEqual([]);
    });

    it('debería devolver un array vacío cuando se le pasa un array vacío', () => {
      const result = transformFiles([]);
      expect(result).toEqual([]);
    });
  });

  describe('formatFileSize', () => {
    it('debería formatear correctamente tamaños', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('debería respetar el número de decimales indicado', () => {
      expect(formatFileSize(1500, 0)).toBe('1 KB');
      expect(formatFileSize(1500, 1)).toBe('1.5 KB');
      expect(formatFileSize(1500, 3)).toBe('1.465 KB');
    });
  });

  describe('formatDate', () => {
    it('debería formatear correctamente una fecha', () => {
      // Como la función usa toLocaleDateString con formato específico,
      // verificamos que retorne un string no vacío
      const result = formatDate(new Date('2024-01-01'));
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // Estas pruebas son para verificar las funciones utilitarias
  describe('getIconForFileType', () => {
    it('debería retornar iconos adecuados para distintos tipos de archivo', () => {
      expect(getIconForFileType('TEXT', 'txt')).toEqual(expect.any(String));
      expect(getIconForFileType('IMAGE', 'jpg')).toEqual(expect.any(String));
      expect(getIconForFileType('DIRECTORY', '')).toEqual(expect.any(String));
    });
  });

  describe('getColorForFileType', () => {
    it('debería retornar colores adecuados para distintos tipos de archivo', () => {
      expect(getColorForFileType('TEXT')).toEqual(expect.any(String));
      expect(getColorForFileType('IMAGE')).toEqual(expect.any(String));
      expect(getColorForFileType('DIRECTORY')).toEqual(expect.any(String));
    });
  });
});