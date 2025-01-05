import { WatcherClient } from '@/services/watcher/client';
import { WatcherApiResponse, WatchedFolder } from '@/services/watcher/types';

describe('Watcher Service Integration Tests', () => {
  let client: WatcherClient;
  const mockFolderId = 'test-folder-id';

  beforeEach(() => {
    client = new WatcherClient({ isTestEnvironment: true });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('watchFolder', () => {
    it('should successfully watch a folder', async () => {
      const mockResponse: WatcherApiResponse = {
        success: true,
        data: {
          folderId: mockFolderId,
          isWatched: true
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await client.watchFolder(mockFolderId);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/folders/${mockFolderId}/watch`,
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(client.isWatched(mockFolderId)).toBe(true);
      expect(client.getActiveWatchers()).toHaveLength(1);
    });

    it('should handle watch folder error with invalid response', async () => {
      const mockResponse = { success: false, error: 'Error al iniciar el monitoreo' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(client.watchFolder(mockFolderId))
        .rejects
        .toThrow('Error al iniciar el monitoreo');

      expect(client.isWatched(mockFolderId)).toBe(false);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.watchFolder(mockFolderId))
        .rejects
        .toThrow('Network error');

      expect(client.isWatched(mockFolderId)).toBe(false);
    });
  });

  describe('unwatchFolder', () => {
    it('should successfully unwatch a folder', async () => {
      // Primero agregar un watcher
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      // Agregar watcher
      await client.watchFolder(mockFolderId);
      expect(client.isWatched(mockFolderId)).toBe(true);

      // Remover watcher
      await client.unwatchFolder(mockFolderId);

      expect(global.fetch).toHaveBeenLastCalledWith(
        `/api/folders/${mockFolderId}/watch`,
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(client.isWatched(mockFolderId)).toBe(false);
      expect(client.getActiveWatchers()).toHaveLength(0);
    });

    it('should handle unwatch folder error gracefully', async () => {
      const mockError = 'Error al detener el monitoreo';
      const mockResponse: WatcherApiResponse = {
        success: false,
        error: mockError
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(client.unwatchFolder(mockFolderId))
        .rejects
        .toThrow(mockError);
    });
  });

  describe('syncWatchedFolders', () => {
    it('should successfully sync multiple watched folders', async () => {
      const mockFolders: WatchedFolder[] = [
        {
          id: 'folder-1',
          path: 'D:/path/1',
          isWatched: true
        },
        {
          id: 'folder-2',
          path: 'D:/path/2',
          isWatched: true
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFolders)
      });

      await client.syncWatchedFolders();

      expect(global.fetch).toHaveBeenCalledWith('/api/folders/watched');
      expect(client.getActiveWatchers()).toHaveLength(2);
      expect(client.isWatched('folder-1')).toBe(true);
      expect(client.isWatched('folder-2')).toBe(true);
    });

    it('should handle sync error with invalid response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error al sincronizar carpetas' })
      });

      await expect(client.syncWatchedFolders())
        .rejects
        .toThrow('Error al sincronizar carpetas monitoreadas');

      expect(client.getActiveWatchers()).toHaveLength(0);
    });

    it('should clear existing watchers on sync', async () => {
      // Primero agregar un watcher
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        });

      await client.watchFolder(mockFolderId);
      expect(client.getActiveWatchers()).toHaveLength(1);

      await client.syncWatchedFolders();
      expect(client.getActiveWatchers()).toHaveLength(0);
    });
  });
});