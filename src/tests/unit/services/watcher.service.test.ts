import { watcherService } from '@/services/watcher.service'
import { prisma } from '@/lib/prisma'

// Mock fetch global
global.fetch = jest.fn()

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findMany: jest.fn()
    }
  }
}))

describe('Watcher Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.warn = jest.fn() // Mock console.warn para los mensajes de deprecated
  })

  describe('watchFolder', () => {
    it('debería iniciar el monitoreo de una carpeta exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await watcherService.watchFolder('folder1')

      expect(fetch).toHaveBeenCalledWith('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: 'folder1', watch: true })
      })
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherClient.watchFolder instead')
    })

    it('debería manejar errores al iniciar el monitoreo', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error al iniciar el monitoreo' })
      })

      await expect(watcherService.watchFolder('folder1')).rejects.toThrow('Error al iniciar el monitoreo')
    })
  })

  describe('stopWatching', () => {
    it('debería detener el monitoreo de una carpeta exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await watcherService.stopWatching('folder1')

      expect(fetch).toHaveBeenCalledWith('/api/folders/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: 'folder1', watch: false })
      })
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherClient.unwatchFolder instead')
    })

    it('debería manejar errores al detener el monitoreo', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error al detener el monitoreo' })
      })

      await expect(watcherService.stopWatching('folder1')).rejects.toThrow('Error al detener el monitoreo')
    })
  })

  describe('startWatchingAll', () => {
    it('debería iniciar el monitoreo de todas las carpetas marcadas', async () => {
      const mockFolders = [
        { id: 'folder1', isWatched: true },
        { id: 'folder2', isWatched: true }
      ]

        ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders)
        ; (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      await watcherService.startWatchingAll()

      expect(prisma.folder.findMany).toHaveBeenCalledWith({
        where: { isWatched: true }
      })
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherClient.syncWatchedFolders instead')
    })
  })

  describe('stopWatchingAll', () => {
    it('debería detener el monitoreo de todas las carpetas activas', () => {
      const mockWatcher1 = { close: jest.fn() }
      const mockWatcher2 = { close: jest.fn() }

      // Simular watchers activos
      watcherService.activeWatchers.set('folder1', mockWatcher1)
      watcherService.activeWatchers.set('folder2', mockWatcher2)

      watcherService.stopWatchingAll()

      expect(mockWatcher1.close).toHaveBeenCalled()
      expect(mockWatcher2.close).toHaveBeenCalled()
      expect(watcherService.activeWatchers.size).toBe(0)
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherClient.stopAll instead')
    })
  })
})