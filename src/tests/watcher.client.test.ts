import { WatcherClient } from '@/services/watcher/client';
import { WatcherApiResponse, WatchedFolder } from '@/services/watcher/types';

describe('WatcherClient', () => {
  let client: WatcherClient;
  const mockFolderId = 'test-folder-1';

  beforeEach(() => {
    client = new WatcherClient({ isTestEnvironment: true });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('watchFolder', () => {
    it('should watch a folder successfully', async () => {
      const mockResponse: WatcherApiResponse = {
        success: true,
        data: {
          folderId: mockFolderId,
          isWatched: true
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await client.watchFolder(mockFolderId);
      expect(client.isWatched(mockFolderId)).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/folders/${mockFolderId}/watch`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      const mockResponse = { success: false, error: errorMessage };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await expect(client.watchFolder(mockFolderId))
        .rejects
        .toThrow(errorMessage);
      expect(client.isWatched(mockFolderId)).toBe(false);
    });
  });

  describe('unwatchFolder', () => {
    it('should unwatch a folder successfully', async () => {
      // Primero agregamos la carpeta
      const mockResponse: WatcherApiResponse = {
        success: true,
        data: {
          folderId: mockFolderId,
          isWatched: true
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ...mockResponse, data: { ...mockResponse.data, isWatched: false } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );

      await client.watchFolder(mockFolderId);
      expect(client.isWatched(mockFolderId)).toBe(true);

      await client.unwatchFolder(mockFolderId);
      expect(client.isWatched(mockFolderId)).toBe(false);
      expect(global.fetch).toHaveBeenLastCalledWith(
        `/api/folders/${mockFolderId}/watch`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle API errors when unwatching', async () => {
      const errorMessage = 'API Error';
      const mockResponse = { success: false, error: errorMessage };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await expect(client.unwatchFolder(mockFolderId))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('syncWatchedFolders', () => {
    it('should sync watched folders successfully', async () => {
      const mockFolders: WatchedFolder[] = [
        { id: 'folder-1', path: '/path/1', isWatched: true },
        { id: 'folder-2', path: '/path/2', isWatched: false }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockFolders), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await client.syncWatchedFolders();

      expect(client.isWatched('folder-1')).toBe(true);
      expect(client.isWatched('folder-2')).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith('/api/folders/watched');
    });

    it('should handle API errors when syncing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Sync error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await expect(client.syncWatchedFolders())
        .rejects
        .toThrow('Error al sincronizar carpetas monitoreadas');
    });
  });

  describe('stopAll', () => {
    it('should stop all watchers successfully', async () => {
      // Agregar algunas carpetas primero
      const mockResponse: WatcherApiResponse = {
        success: true,
        data: {
          folderId: 'folder-1',
          isWatched: true
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ...mockResponse, data: { folderId: 'folder-2', isWatched: true } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );

      await client.watchFolder('folder-1');
      await client.watchFolder('folder-2');

      await client.stopAll();
      expect(client.getActiveWatchers()).toHaveLength(0);
    });

    it('should clean up state even if API calls fail', async () => {
      // Agregar una carpeta primero
      const mockResponse: WatcherApiResponse = {
        success: true,
        data: {
          folderId: mockFolderId,
          isWatched: true
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        .mockRejectedValueOnce(new Error('API Error'));

      await client.watchFolder(mockFolderId);
      expect(client.getActiveWatchers()).toHaveLength(1);

      await client.stopAll();
      expect(client.getActiveWatchers()).toHaveLength(0);
    });
  });
});