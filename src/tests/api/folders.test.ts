import { NextRequest } from 'next/server';
import { GET as getWatched } from '@/app/api/folders/watched/route';
import { POST } from '@/app/api/folders/[id]/watch/route';
import { prisma } from '@/lib/db';
import { watcherServer } from '@/services/watcher';

// Mock de prisma y watcherServer
jest.mock('@/lib/db', () => ({
  prisma: {
    folder: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

jest.mock('@/services/watcher', () => ({
  watcherServer: {
    addPath: jest.fn(),
    removePath: jest.fn()
  }
}));

describe('Folder API Endpoints', () => {
  const mockFolderId = 'test-folder-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/folders/watched', () => {
    it('should return watched folders', async () => {
      const mockFolders = [
        { id: 'folder-1', path: '/path/1', isWatched: true },
        { id: 'folder-2', path: '/path/2', isWatched: false }
      ];

      (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders);

      const req = new NextRequest('http://localhost:3000/api/folders/watched');
      const response = await getWatched(req);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        success: true,
        folders: mockFolders
      });
    });

    it('should handle database errors', async () => {
      (prisma.folder.findMany as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = new NextRequest('http://localhost:3000/api/folders/watched');
      const response = await getWatched(req);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Error al obtener carpetas observadas'
      });
    });
  });

  describe('POST /api/folders/[id]/watch', () => {
    it('should start watching a folder', async () => {
      const mockFolder = {
        id: mockFolderId,
        path: '/test/path',
        isWatched: false
      };

      (prisma.folder.findUnique as jest.Mock).mockResolvedValueOnce(mockFolder);
      (prisma.folder.update as jest.Mock).mockResolvedValueOnce({
        ...mockFolder,
        isWatched: true
      });
      (watcherServer.addPath as jest.Mock).mockResolvedValueOnce(undefined);

      const req = new NextRequest(
        `http://localhost:3000/api/folders/${mockFolderId}/watch`,
        {
          method: 'POST',
          body: JSON.stringify({ watch: true })
        }
      );

      const response = await POST(req, { params: { id: mockFolderId } });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        success: true,
        data: {
          folderId: mockFolderId,
          isWatched: true
        }
      });

      expect(watcherServer.addPath).toHaveBeenCalledWith(mockFolder.path);
      expect(prisma.folder.update).toHaveBeenCalledWith({
        where: { id: mockFolderId },
        data: { isWatched: true }
      });
    });

    it('should handle non-existent folder', async () => {
      (prisma.folder.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest(
        `http://localhost:3000/api/folders/${mockFolderId}/watch`,
        {
          method: 'POST',
          body: JSON.stringify({ watch: true })
        }
      );

      const response = await POST(req, { params: { id: mockFolderId } });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Carpeta no encontrada'
      });
    });

    it('should handle database errors', async () => {
      (prisma.folder.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = new NextRequest(
        `http://localhost:3000/api/folders/${mockFolderId}/watch`,
        {
          method: 'POST',
          body: JSON.stringify({ watch: true })
        }
      );

      const response = await POST(req, { params: { id: mockFolderId } });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Error al actualizar monitoreo'
      });
    });
  });
});