import {
    deserializeDirectoryInfo,
    deserializeFileBase,
    deserializeFileInfo,
    serializeDirectoryInfo,
    serializeFileBase,
    serializeFileInfo
} from '@/transformers/file/serializers';
import type { DirectoryInfo, FileBase, FileInfo } from '@/types/entities/file/base';
import { describe, expect, it } from '@jest/globals';

describe('🧪 File Serializers', () => {
  describe('serializeFileBase', () => {
    it('debería serializar correctamente un FileBase', () => {
      const mockFileBase: FileBase = {
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: false
      };

      const serialized = serializeFileBase(mockFileBase);

      expect(serialized).toEqual({
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: mockFileBase.createdAt.toISOString(),
        modifiedAt: mockFileBase.modifiedAt.toISOString(),
        isDirectory: false
      });
    });

    it('debería manejar un objeto null', () => {
      const serialized = serializeFileBase(null);
      expect(serialized).toBeNull();
    });
  });

  describe('serializeFileInfo', () => {
    it('debería serializar correctamente un FileInfo', () => {
      const mockFileInfo: FileInfo = {
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: false,
        parentPath: '/documents',
        absolutePath: '/var/www/documents/test.txt',
        relativePath: 'documents/test.txt',
        owner: 'user',
        permissions: 'rw-r--r--',
        checksum: 'abc123'
      };

      const serialized = serializeFileInfo(mockFileInfo);

      expect(serialized).toEqual({
        ...serializeFileBase(mockFileInfo),
        parentPath: '/documents',
        absolutePath: '/var/www/documents/test.txt',
        relativePath: 'documents/test.txt',
        owner: 'user',
        permissions: 'rw-r--r--',
        checksum: 'abc123'
      });
    });

    it('debería manejar un objeto null', () => {
      const serialized = serializeFileInfo(null);
      expect(serialized).toBeNull();
    });
  });

  describe('serializeDirectoryInfo', () => {
    it('debería serializar correctamente un DirectoryInfo', () => {
      const mockChild: FileBase = {
        id: 'file-456',
        name: 'child.txt',
        path: '/documents/test/child.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 512,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: false
      };

      const mockDirectoryInfo: DirectoryInfo = {
        id: 'dir-123',
        name: 'test',
        path: '/documents/test',
        type: 'DIRECTORY',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: true,
        itemCount: 1,
        children: [mockChild],
        hasSubdirectories: false
      };

      const serialized = serializeDirectoryInfo(mockDirectoryInfo);

      expect(serialized).toEqual({
        ...serializeFileBase(mockDirectoryInfo),
        itemCount: 1,
        children: [serializeFileBase(mockChild)],
        hasSubdirectories: false
      });
    });

    it('debería manejar children vacío', () => {
      const mockDirectoryInfo: DirectoryInfo = {
        id: 'dir-123',
        name: 'test',
        path: '/documents/test',
        type: 'DIRECTORY',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: true,
        itemCount: 0,
        children: [],
        hasSubdirectories: false
      };

      const serialized = serializeDirectoryInfo(mockDirectoryInfo);

      expect(serialized).toEqual({
        ...serializeFileBase(mockDirectoryInfo),
        itemCount: 0,
        children: [],
        hasSubdirectories: false
      });
    });

    it('debería manejar un objeto null', () => {
      const serialized = serializeDirectoryInfo(null);
      expect(serialized).toBeNull();
    });
  });

  describe('deserializeFileBase', () => {
    it('debería deserializar correctamente un FileBase', () => {
      const serializedFile = {
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: '2024-01-01T10:00:00Z',
        modifiedAt: '2024-01-01T11:00:00Z',
        isDirectory: false
      };

      const deserialized = deserializeFileBase(serializedFile);

      expect(deserialized).toEqual({
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: false
      });
    });

    it('debería manejar un objeto null', () => {
      const deserialized = deserializeFileBase(null);
      expect(deserialized).toBeNull();
    });
  });

  describe('deserializeFileInfo', () => {
    it('debería deserializar correctamente un FileInfo', () => {
      const serializedFileInfo = {
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: '2024-01-01T10:00:00Z',
        modifiedAt: '2024-01-01T11:00:00Z',
        isDirectory: false,
        parentPath: '/documents',
        absolutePath: '/var/www/documents/test.txt',
        relativePath: 'documents/test.txt',
        owner: 'user',
        permissions: 'rw-r--r--',
        checksum: 'abc123'
      };

      const deserialized = deserializeFileInfo(serializedFileInfo);

      expect(deserialized).toEqual({
        id: 'file-123',
        name: 'test.txt',
        path: '/documents/test.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 1024,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: false,
        parentPath: '/documents',
        absolutePath: '/var/www/documents/test.txt',
        relativePath: 'documents/test.txt',
        owner: 'user',
        permissions: 'rw-r--r--',
        checksum: 'abc123'
      });
    });

    it('debería manejar un objeto null', () => {
      const deserialized = deserializeFileInfo(null);
      expect(deserialized).toBeNull();
    });
  });

  describe('deserializeDirectoryInfo', () => {
    it('debería deserializar correctamente un DirectoryInfo', () => {
      const serializedChild = {
        id: 'file-456',
        name: 'child.txt',
        path: '/documents/test/child.txt',
        type: 'TEXT',
        extension: 'txt',
        mimeType: 'text/plain',
        size: 512,
        createdAt: '2024-01-01T10:00:00Z',
        modifiedAt: '2024-01-01T11:00:00Z',
        isDirectory: false
      };

      const serializedDirectory = {
        id: 'dir-123',
        name: 'test',
        path: '/documents/test',
        type: 'DIRECTORY',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: '2024-01-01T10:00:00Z',
        modifiedAt: '2024-01-01T11:00:00Z',
        isDirectory: true,
        itemCount: 1,
        children: [serializedChild],
        hasSubdirectories: false
      };

      const deserialized = deserializeDirectoryInfo(serializedDirectory);

      expect(deserialized).toEqual({
        id: 'dir-123',
        name: 'test',
        path: '/documents/test',
        type: 'DIRECTORY',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-01T11:00:00Z'),
        isDirectory: true,
        itemCount: 1,
        children: [deserializeFileBase(serializedChild)],
        hasSubdirectories: false
      });
    });

    it('debería manejar un objeto null', () => {
      const deserialized = deserializeDirectoryInfo(null);
      expect(deserialized).toBeNull();
    });
  });
});