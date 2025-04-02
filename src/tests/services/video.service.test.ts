import { prisma } from '@/lib/prisma';
import {
    VideoServiceError,
    createVideo,
    deleteVideo,
    findVideos,
    getVideoById,
    getVideoStats,
    moveVideoToFolder,
    setVideoVisibility,
    toggleVideoFavorite,
    updateVideo
} from '@/services/video/video.service';
import type { CreateVideoInput, UpdateVideoInput, VideoFilters } from '@/types/entities/video/types';
import { describe, expect, it, jest } from '@jest/globals';

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    video: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

describe('🧪 Video Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVideoInput: CreateVideoInput = {
    name: 'test-video.mp4',
    path: '/path/to/test-video.mp4',
    hash: 'test-hash',
    size: 1024000,
    duration: 120,
    width: 1920,
    height: 1080,
    folderId: 'folder-id',
    metadata: {
      format: 'mp4',
      codec: 'h264',
      bitrate: 5000000
    }
  };

  const mockVideo = {
    id: 'test-id',
    ...mockVideoInput,
    description: null,
    thumbnail: null,
    thumbnailSize: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
    isPublic: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('createVideo', () => {
    it('debería crear un video con datos válidos', async () => {
      (prisma.video.create as jest.Mock).mockResolvedValue(mockVideo);

      const result = await createVideo(mockVideoInput);

      expect(prisma.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockVideoInput.name,
          path: mockVideoInput.path
        })
      });
      expect(result).toMatchObject(mockVideo);
    });

    it('debería manejar errores en la creación', async () => {
      (prisma.video.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(createVideo(mockVideoInput)).rejects.toThrow(VideoServiceError);
    });
  });

  describe('updateVideo', () => {
    const updateData: UpdateVideoInput = {
      name: 'updated-video.mp4',
      description: 'Updated description'
    };

    it('debería actualizar un video existente', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
      (prisma.video.update as jest.Mock).mockResolvedValue({
        ...mockVideo,
        ...updateData
      });

      const result = await updateVideo('test-id', updateData);

      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining(updateData)
      });
      expect(result.name).toBe(updateData.name);
    });

    it('debería lanzar error si el video no existe', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateVideo('invalid-id', updateData))
        .rejects.toThrow('Video no encontrado');
    });
  });

  describe('getVideoById', () => {
    it('debería obtener un video por ID', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);

      const result = await getVideoById('test-id');

      expect(result).toMatchObject(mockVideo);
    });

    it('debería incluir relaciones cuando se solicita', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue({
        ...mockVideo,
        folder: { id: 'folder-id' },
        tags: [],
        albums: [],
        collections: []
      });

      const result = await getVideoById('test-id', true);

      expect(prisma.video.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: {
          folder: true,
          tags: true,
          albums: true,
          collections: true
        }
      });
      expect(result).toHaveProperty('folder');
    });

    it('debería retornar null si el video no existe', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getVideoById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findVideos', () => {
    const mockFilters: VideoFilters = {
      search: 'test',
      folderId: 'folder-id'
    };

    it('debería buscar videos con filtros', async () => {
      (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideo]);
      (prisma.video.count as jest.Mock).mockResolvedValue(1);

      const result = await findVideos(mockFilters);

      expect(prisma.video.findMany).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('debería aplicar paginación', async () => {
      (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideo]);
      (prisma.video.count as jest.Mock).mockResolvedValue(1);

      await findVideos(mockFilters, { page: 1, limit: 10 });

      expect(prisma.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10
        })
      );
    });
  });

  describe('deleteVideo', () => {
    it('debería eliminar un video existente', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(mockVideo);
      (prisma.video.delete as jest.Mock).mockResolvedValue(mockVideo);

      const result = await deleteVideo('test-id');

      expect(result).toBe(true);
      expect(prisma.video.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });

    it('debería lanzar error si el video no existe', async () => {
      (prisma.video.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteVideo('invalid-id'))
        .rejects.toThrow('Video no encontrado');
    });
  });

  describe('Operaciones de Estado', () => {
    describe('toggleVideoFavorite', () => {
      it('debería cambiar el estado de favorito', async () => {
        (prisma.video.update as jest.Mock).mockResolvedValue({
          ...mockVideo,
          isFavorite: true
        });

        const result = await toggleVideoFavorite('test-id', true);

        expect(result.isFavorite).toBe(true);
      });
    });

    describe('setVideoVisibility', () => {
      it('debería cambiar la visibilidad', async () => {
        (prisma.video.update as jest.Mock).mockResolvedValue({
          ...mockVideo,
          isPublic: true
        });

        const result = await setVideoVisibility('test-id', true);

        expect(result.isPublic).toBe(true);
      });
    });

    describe('moveVideoToFolder', () => {
      it('debería mover el video a otra carpeta', async () => {
        const newFolderId = 'new-folder-id';
        (prisma.video.update as jest.Mock).mockResolvedValue({
          ...mockVideo,
          folderId: newFolderId
        });

        const result = await moveVideoToFolder('test-id', newFolderId);

        expect(prisma.video.update).toHaveBeenCalledWith({
          where: { id: 'test-id' },
          data: {
            folder: {
              connect: { id: newFolderId }
            }
          }
        });
        expect(result.folderId).toBe(newFolderId);
      });
    });
  });

  describe('getVideoStats', () => {
    it('debería obtener estadísticas de videos', async () => {
      (prisma.video.count as jest.Mock).mockResolvedValue(10);

      const result = await getVideoStats();

      expect(result).toHaveProperty('totalVideos');
      expect(result).toHaveProperty('totalPublicVideos');
      expect(result).toHaveProperty('totalPrivateVideos');
      expect(result).toHaveProperty('totalFavoriteVideos');
    });
  });
});