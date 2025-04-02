import { processImage } from '@/lib/image-processing';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { UploadedImagesService } from '@/services/uploaded-images.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock de dependencias
jest.mock('@/lib/prisma', () => ({
  prisma: {
    uploadedImage: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

jest.mock('@/lib/server/events.server', () => ({
  emit: jest.fn()
}));

jest.mock('@/lib/image-processing', () => ({
  processImage: jest.fn()
}));

jest.mock('@/lib/logger/server-logger', () => ({
  serverLogger: {
    withContext: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  }
}));

describe('🧪 UploadedImage Service', () => {
  let service: UploadedImagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = UploadedImagesService.getInstance();
  });

  describe('createImage', () => {
    it('debería crear una imagen correctamente', async () => {
      // Mock del resultado de prisma
      const mockDbResult = {
        id: 'img-123',
        name: 'test-image.jpg',
        path: '/uploads/test-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: '{"camera":"Canon"}',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configure el mock para que devuelva el resultado esperado
      (prisma.uploadedImage.create as jest.Mock).mockResolvedValue(mockDbResult);

      // Parámetros para crear imagen
      const createParams = {
        name: 'test-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        file: {
          path: '/uploads/test-image.jpg',
          size: 102400
        },
        dimensions: {
          width: 800,
          height: 600
        },
        metadata: {
          camera: 'Canon'
        }
      };

      // Ejecutar el método
      const result = await service.createImage(createParams);

      // Verificar que se llamó a prisma.uploadedImage.create con los parámetros correctos
      expect(prisma.uploadedImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'test-image.jpg',
          path: '/uploads/test-image.jpg',
          type: 'image/jpeg',
          category: 'photo',
          size: 102400,
          width: 800,
          height: 600,
          metadata: expect.any(String) // JSON.stringify({ camera: 'Canon' })
        })
      });

      // Verificar el resultado
      expect(result).toEqual(expect.objectContaining({
        id: 'img-123',
        name: 'test-image.jpg',
        path: '/uploads/test-image.jpg',
        type: 'image/jpeg',
        url: expect.stringContaining('/uploads/test-image.jpg'),
        thumbnailUrl: expect.stringContaining('/uploads/test-image.jpg'),
        dimensions: expect.objectContaining({
          width: 800,
          height: 600,
          aspectRatio: 800 / 600
        })
      }));

      // Verificar que se emitieron los eventos
      expect(emit).toHaveBeenCalledTimes(2);
    });

    it('debería procesar la imagen si se proporcionan opciones', async () => {
      // Mock de processImage
      (processImage as jest.Mock).mockResolvedValue({
        path: '/uploads/processed-image.jpg',
        metadata: {
          processed: true,
          dimensions: { width: 400, height: 300 }
        }
      });

      // Mock del resultado de prisma
      const mockDbResult = {
        id: 'img-456',
        name: 'processed-image.jpg',
        path: '/uploads/processed-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 51200,
        width: 400,
        height: 300,
        metadata: '{"processed":true,"dimensions":{"width":400,"height":300}}',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.uploadedImage.create as jest.Mock).mockResolvedValue(mockDbResult);

      // Parámetros con opciones de procesamiento
      const createParams = {
        name: 'processed-image.jpg',
        type: 'image/jpeg',
        category: 'photo',
        file: {
          path: '/uploads/original-image.jpg',
          size: 102400
        },
        dimensions: {
          width: 800,
          height: 600
        },
        processingOptions: {
          resize: { width: 400, height: 300 },
          quality: 80
        }
      };

      // Ejecutar el método
      await service.createImage(createParams);

      // Verificar que se llamó a processImage
      expect(processImage).toHaveBeenCalledWith(
        '/uploads/original-image.jpg',
        expect.objectContaining({
          resize: { width: 400, height: 300 },
          quality: 80
        })
      );
    });
  });

  describe('updateImage', () => {
    it('debería actualizar una imagen correctamente', async () => {
      // Mock de la imagen existente
      const existingImage = {
        id: 'img-123',
        name: 'old-name.jpg',
        path: '/uploads/old-name.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: '{"camera":"Canon"}',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock de la imagen actualizada
      const updatedImage = {
        ...existingImage,
        name: 'new-name.jpg',
        category: 'portfolio'
      };

      // Configure los mocks
      (prisma.uploadedImage.findUnique as jest.Mock).mockResolvedValue(existingImage);
      (prisma.uploadedImage.update as jest.Mock).mockResolvedValue(updatedImage);

      // Parámetros para actualizar
      const updateParams = {
        name: 'new-name.jpg',
        category: 'portfolio'
      };

      // Ejecutar el método
      const result = await service.updateImage('img-123', updateParams);

      // Verificar que se consultó la imagen
      expect(prisma.uploadedImage.findUnique).toHaveBeenCalledWith({
        where: { id: 'img-123' }
      });

      // Verificar que se actualizó la imagen
      expect(prisma.uploadedImage.update).toHaveBeenCalledWith({
        where: { id: 'img-123' },
        data: expect.objectContaining({
          name: 'new-name.jpg',
          category: 'portfolio'
        })
      });

      // Verificar el resultado
      expect(result).toEqual(expect.objectContaining({
        id: 'img-123',
        name: 'new-name.jpg',
        category: 'portfolio'
      }));
    });

    it('debería lanzar un error si la imagen no existe', async () => {
      // Mock de findUnique devolviendo null (imagen no encontrada)
      (prisma.uploadedImage.findUnique as jest.Mock).mockResolvedValue(null);

      // Parámetros para actualizar
      const updateParams = {
        name: 'new-name.jpg'
      };

      // Verificar que se lanza un error
      await expect(service.updateImage('non-existent', updateParams)).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('debería eliminar una imagen correctamente', async () => {
      // Mock de la imagen existente
      const existingImage = {
        id: 'img-123',
        name: 'image-to-delete.jpg',
        path: '/uploads/image-to-delete.jpg',
        type: 'image/jpeg',
        category: 'photo',
        size: 102400,
        width: 800,
        height: 600,
        metadata: null,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configure los mocks
      (prisma.uploadedImage.findUnique as jest.Mock).mockResolvedValue(existingImage);
      (prisma.uploadedImage.delete as jest.Mock).mockResolvedValue(existingImage);

      // Ejecutar el método
      await service.deleteImage('img-123');

      // Verificar que se consultó la imagen
      expect(prisma.uploadedImage.findUnique).toHaveBeenCalledWith({
        where: { id: 'img-123' }
      });

      // Verificar que se eliminó la imagen
      expect(prisma.uploadedImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-123' }
      });

      // Verificar que se emitió el evento
      expect(emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('getImages', () => {
    it('debería obtener imágenes con filtros correctamente', async () => {
      // Mock de los resultados
      const mockImages = [
        {
          id: 'img-1',
          name: 'image1.jpg',
          path: '/uploads/image1.jpg',
          type: 'image/jpeg',
          category: 'photo',
          size: 102400,
          width: 800,
          height: 600,
          metadata: null,
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'img-2',
          name: 'image2.jpg',
          path: '/uploads/image2.jpg',
          type: 'image/jpeg',
          category: 'portfolio',
          size: 204800,
          width: 1200,
          height: 800,
          metadata: null,
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Configure los mocks
      (prisma.uploadedImage.findMany as jest.Mock).mockResolvedValue(mockImages);
      (prisma.uploadedImage.count as jest.Mock).mockResolvedValue(2);

      // Parámetros de filtrado
      const params = {
        type: 'image/jpeg',
        category: 'photo',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Ejecutar el método
      const result = await service.getImages(params);

      // Verificar que se consultó con los filtros correctos
      expect(prisma.uploadedImage.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          type: 'image/jpeg',
          category: 'photo'
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }));

      // Verificar el resultado
      expect(result).toEqual(expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'img-1' }),
          expect.objectContaining({ id: 'img-2' })
        ]),
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      }));
    });
  });
});