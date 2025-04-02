import {
    type UploadedImageDBRecord,
    fromDBToBase,
    toDBRecord,
    toExtended,
    transformUploadedImage,
    transformUploadedImages
} from '@/transformers/uploaded-image/transformer';
import type { UploadedImageBase } from '@/types/entities/uploaded-image/types';
import { describe, expect, it } from '@jest/globals';

describe('🧪 UploadedImage Transformer', () => {
  // Mock data para pruebas
  const mockDBRecord: UploadedImageDBRecord = {
    id: 'img-123',
    name: 'test-image.jpg',
    path: 'uploads/test-image.jpg',
    originalName: 'original-image.jpg',
    type: 'image/jpeg',
    category: 'photo',
    size: 102400,
    width: 800,
    height: 600,
    metadata: '{"camera": "Canon EOS 5D", "iso": "100", "exposure": "1/125"}',
    uploadedAt: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:01:00Z')
  };

  describe('fromDBToBase', () => {
    it('debería transformar correctamente un registro de DB a entidad base', () => {
      const result = fromDBToBase(mockDBRecord);

      expect(result).toEqual({
        id: 'img-123',
        name: 'test-image.jpg',
        path: 'uploads/test-image.jpg',
        originalName: 'original-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: '{"camera": "Canon EOS 5D", "iso": "100", "exposure": "1/125"}',
        uploadedAt: mockDBRecord.uploadedAt,
        createdAt: mockDBRecord.createdAt,
        updatedAt: mockDBRecord.updatedAt
      });
    });
  });

  describe('toExtended', () => {
    it('debería transformar una entidad base a extendida con dimensiones y URLs', () => {
      const baseEntity: UploadedImageBase = {
        id: 'img-123',
        name: 'test-image.jpg',
        path: 'uploads/test-image.jpg',
        originalName: 'original-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: '{"camera": "Canon EOS 5D", "iso": "100", "exposure": "1/125"}',
        uploadedAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:01:00Z')
      };

      const result = toExtended(baseEntity);

      expect(result).toEqual({
        ...baseEntity,
        dimensions: {
          width: 800,
          height: 600,
          aspectRatio: 800 / 600
        },
        url: `/api/images/${encodeURIComponent(baseEntity.path)}`,
        thumbnailUrl: `/api/images/thumbnails/${encodeURIComponent(baseEntity.path)}`,
        metadata: baseEntity.metadata
      });
    });

    it('debería manejar metadata nula', () => {
      const baseEntityWithoutMetadata: UploadedImageBase = {
        id: 'img-123',
        name: 'test-image.jpg',
        path: 'uploads/test-image.jpg',
        originalName: 'original-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: null,
        uploadedAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:01:00Z')
      };

      const result = toExtended(baseEntityWithoutMetadata);

      expect(result.metadata).toBeNull();
    });
  });

  describe('toDBRecord', () => {
    it('debería convertir una entrada parcial a formato DB', () => {
      const input: Partial<UploadedImageBase> = {
        name: 'new-image.jpg',
        path: 'uploads/new-image.jpg',
        type: 'image/png',
        size: 51200,
        width: 400,
        height: 300,
        metadata: { exif: { make: 'Nikon', model: 'D850' } }
      };

      const result = toDBRecord(input);

      expect(result).toEqual({
        name: 'new-image.jpg',
        path: 'uploads/new-image.jpg',
        type: 'image/png',
        size: 51200,
        width: 400,
        height: 300,
        metadata: JSON.stringify(input.metadata)
      });
    });

    it('debería manejar metadata que ya es una cadena', () => {
      const metadataString = '{"exif": {"make": "Nikon", "model": "D850"}}';
      const input: Partial<UploadedImageBase> = {
        name: 'new-image.jpg',
        metadata: metadataString
      };

      const result = toDBRecord(input);

      expect(result).toEqual({
        name: 'new-image.jpg',
        metadata: metadataString
      });
    });

    it('debería manejar metadata nula', () => {
      const input: Partial<UploadedImageBase> = {
        name: 'new-image.jpg',
        metadata: null
      };

      const result = toDBRecord(input);

      expect(result).toEqual({
        name: 'new-image.jpg',
        metadata: null
      });
    });
  });

  describe('transformUploadedImage', () => {
    it('debería transformar un registro DB en una entidad extendida completa', () => {
      const result = transformUploadedImage(mockDBRecord);

      expect(result).toEqual({
        ...fromDBToBase(mockDBRecord),
        dimensions: {
          width: mockDBRecord.width,
          height: mockDBRecord.height,
          aspectRatio: mockDBRecord.width / mockDBRecord.height
        },
        url: `/api/images/${encodeURIComponent(mockDBRecord.path)}`,
        thumbnailUrl: `/api/images/thumbnails/${encodeURIComponent(mockDBRecord.path)}`,
        metadata: mockDBRecord.metadata
      });
    });
  });

  describe('transformUploadedImages', () => {
    it('debería transformar un array de registros DB en array de entidades extendidas', () => {
      const anotherMockRecord: UploadedImageDBRecord = {
        ...mockDBRecord,
        id: 'img-456',
        name: 'another-image.png',
        path: 'uploads/another-image.png',
        type: 'image/png'
      };

      const records = [mockDBRecord, anotherMockRecord];
      const result = transformUploadedImages(records);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(transformUploadedImage(mockDBRecord));
      expect(result[1]).toEqual(transformUploadedImage(anotherMockRecord));
    });

    it('debería devolver un array vacío si se pasa un array vacío', () => {
      const result = transformUploadedImages([]);
      expect(result).toEqual([]);
    });
  });
});