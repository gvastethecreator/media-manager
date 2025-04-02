import {
    copyFileOrDirectory,
    createDirectory,
    deleteFileOrDirectory,
    getFileInfo,
    moveFileOrDirectory,
    readDirectory,
    renameFileOrDirectory
} from '@/services/file/file.service';
import { describe, expect, it, jest } from '@jest/globals';

// Mock para serverLogger
jest.mock('@/lib/logger/server-logger', () => ({
  serverLogger: {
    withContext: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

describe('🧪 File Service', () => {
  describe('readDirectory', () => {
    it('debería leer un directorio correctamente', async () => {
      const result = await readDirectory('/test-directory');

      expect(result).toEqual(expect.objectContaining({
        path: '/test-directory',
        items: expect.arrayContaining([
          expect.objectContaining({
            isDirectory: true,
            name: 'Documentos'
          }),
          expect.objectContaining({
            isDirectory: false,
            type: 'IMAGE',
            extension: '.jpg'
          }),
          expect.objectContaining({
            isDirectory: false,
            type: 'DOCUMENT',
            extension: '.pdf'
          })
        ]),
        totalItems: 3,
        hasMore: false,
        directories: 1,
        files: 2
      }));
    });
  });

  describe('getFileInfo', () => {
    it('debería obtener información de un archivo de imagen', async () => {
      const result = await getFileInfo('/test-path/image.jpg');

      expect(result).toEqual(expect.objectContaining({
        id: '/test-path/image.jpg',
        name: 'image.jpg',
        path: '/test-path/image.jpg',
        type: 'IMAGE',
        extension: '.jpg',
        mimeType: 'image/jpeg',
        isDirectory: false,
        icon: expect.any(String),
        iconColor: expect.any(String),
        friendlySize: expect.any(String),
        friendlyDate: expect.any(String)
      }));
    });

    it('debería obtener información de un archivo genérico', async () => {
      const result = await getFileInfo('/test-path/document.txt');

      expect(result).toEqual(expect.objectContaining({
        id: '/test-path/document.txt',
        name: 'document.txt',
        path: '/test-path/document.txt',
        type: 'FILE',
        extension: '.txt',
        isDirectory: false
      }));
    });
  });

  describe('createDirectory', () => {
    it('debería crear un directorio correctamente', async () => {
      const result = await createDirectory('/test-path/new-directory');

      expect(result).toEqual({
        success: true,
        path: '/test-path/new-directory',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('deleteFileOrDirectory', () => {
    it('debería eliminar un archivo correctamente', async () => {
      const result = await deleteFileOrDirectory('/test-path/file-to-delete.txt');

      expect(result).toEqual({
        success: true,
        path: '/test-path/file-to-delete.txt',
        timestamp: expect.any(Date)
      });
    });

    it('debería eliminar un directorio correctamente', async () => {
      // Modificamos la implementación interna simulando que conocemos que es un directorio
      // En un caso real se haría un mock más elaborado
      const result = await deleteFileOrDirectory('/test-path/directory-to-delete');

      expect(result).toEqual({
        success: true,
        path: '/test-path/directory-to-delete',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('copyFileOrDirectory', () => {
    it('debería copiar un archivo correctamente', async () => {
      const result = await copyFileOrDirectory(
        '/test-path/source-file.txt',
        '/test-path/destination-file.txt'
      );

      expect(result).toEqual({
        success: true,
        sourcePath: '/test-path/source-file.txt',
        destinationPath: '/test-path/destination-file.txt',
        timestamp: expect.any(Date)
      });
    });

    it('debería copiar un directorio correctamente', async () => {
      const result = await copyFileOrDirectory(
        '/test-path/source-directory',
        '/test-path/destination-directory',
        { recursive: true }
      );

      expect(result).toEqual({
        success: true,
        sourcePath: '/test-path/source-directory',
        destinationPath: '/test-path/destination-directory',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('moveFileOrDirectory', () => {
    it('debería mover un archivo correctamente', async () => {
      const result = await moveFileOrDirectory(
        '/test-path/source-file.txt',
        '/test-path/new-location/file.txt'
      );

      expect(result).toEqual({
        success: true,
        sourcePath: '/test-path/source-file.txt',
        destinationPath: '/test-path/new-location/file.txt',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('renameFileOrDirectory', () => {
    it('debería renombrar un archivo correctamente', async () => {
      const result = await renameFileOrDirectory(
        '/test-path/old-name.txt',
        'new-name.txt'
      );

      expect(result).toEqual({
        success: true,
        sourcePath: '/test-path/old-name.txt',
        destinationPath: expect.stringContaining('new-name.txt'),
        timestamp: expect.any(Date)
      });
    });
  });
});