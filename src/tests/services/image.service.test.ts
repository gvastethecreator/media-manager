import { type CreateImageInput, type ImageProcessingOptions, ImageService } from '@/services/image/image.service';
import { ThumbnailQuality } from '@/types/thumbnails';
import { describe, expect, it, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import sharp from 'sharp';

// Mock de sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
  }));
});

// Mock de fs
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
}));

describe('🧪 Image Service', () => {
  let imageService: typeof ImageService;

  beforeEach(() => {
    imageService = ImageService.getInstance();
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    it('debería crear el directorio de caché al inicializar', async () => {
      expect(fs.mkdir).toHaveBeenCalledWith('.image-cache', { recursive: true });
    });

    it('debería ser un singleton', () => {
      const instance1 = ImageService.getInstance();
      const instance2 = ImageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Creación de Imágenes', () => {
    const mockImageInput: CreateImageInput = {
      name: 'test.jpg',
      path: '/path/to/test.jpg',
      size: 1024000,
      width: 1920,
      height: 1080,
      hash: 'test-hash',
      folderId: 'folder-id',
      metadata: {
        format: 'jpeg',
        quality: 100
      }
    };

    it('debería crear una imagen con datos válidos', async () => {
      const result = await imageService.createImage(mockImageInput);

      expect(result).toMatchObject({
        name: mockImageInput.name,
        path: mockImageInput.path,
        size: mockImageInput.size,
        width: mockImageInput.width,
        height: mockImageInput.height
      });
    });

    it('debería emitir evento IMAGE_CREATED al crear una imagen', async () => {
      const emitSpy = jest.spyOn(imageService as any, 'emitEvent');
      await imageService.createImage(mockImageInput);

      expect(emitSpy).toHaveBeenCalledWith('image:created', expect.any(Object));
    });

    it('debería manejar errores en la creación de imágenes', async () => {
      const invalidInput = {
        name: 'test.jpg'
      } as CreateImageInput;

      await expect(imageService.createImage(invalidInput)).rejects.toThrow();
    });
  });

  describe('Procesamiento de Imágenes', () => {
    const mockOptions: ImageProcessingOptions = {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp',
      fit: 'cover'
    };

    it('debería procesar una imagen con opciones válidas', async () => {
      const result = await imageService.processImage('/path/to/image.jpg', mockOptions);

      expect(sharp).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('metadata');
    });

    it('debería mantener la relación de aspecto al redimensionar', async () => {
      await imageService.processImage('/path/to/image.jpg', {
        width: 800,
        height: undefined
      });

      expect(sharp().resize).toHaveBeenCalledWith(800, expect.any(Number), expect.any(Object));
    });

    it('debería aplicar la configuración de calidad correctamente', async () => {
      await imageService.processImage('/path/to/image.jpg', {
        format: 'webp',
        quality: 90
      });

      expect(sharp().webp).toHaveBeenCalledWith(expect.objectContaining({
        quality: 90
      }));
    });
  });

  describe('Generación de Miniaturas', () => {
    it('debería generar una miniatura con calidad específica', async () => {
      await imageService.generateThumbnail('test-id', ThumbnailQuality.HIGH);

      expect(sharp).toHaveBeenCalled();
      expect(sharp().resize).toHaveBeenCalled();
    });

    it('debería usar el caché para miniaturas existentes', async () => {
      const getThumbnailSpy = jest.spyOn(imageService, 'getThumbnail');

      // Primera llamada - genera la miniatura
      await imageService.getThumbnail('test-id', ThumbnailQuality.HIGH);

      // Segunda llamada - debería usar caché
      await imageService.getThumbnail('test-id', ThumbnailQuality.HIGH);

      expect(getThumbnailSpy).toHaveBeenCalledTimes(2);
    });

    it('debería manejar errores en la generación de miniaturas', async () => {
      (sharp as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Error procesando imagen');
      });

      await expect(
        imageService.generateThumbnail('test-id', ThumbnailQuality.HIGH)
      ).rejects.toThrow();
    });
  });

  describe('Metadatos de Imágenes', () => {
    it('debería obtener metadatos de una imagen', async () => {
      const result = await imageService.getImageMetadata('test-id');
      expect(result).toBeDefined();
    });

    it('debería emitir evento al actualizar metadatos', async () => {
      const emitSpy = jest.spyOn(imageService as any, 'emitEvent');
      await imageService.updateImageMetadata('test-id', { key: 'value' });

      expect(emitSpy).toHaveBeenCalledWith('image:metadata:updated', expect.any(Object));
    });
  });
});