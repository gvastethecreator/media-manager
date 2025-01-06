import { WatcherClient } from '@/services/watcher/client'

// Mock fetch global
global.fetch = jest.fn()

describe('Watcher Client', () => {
  let watcherClient: WatcherClient

  beforeEach(() => {
    jest.clearAllMocks()
    watcherClient = new WatcherClient()
  })

  describe('watchFolder', () => {
    it('debería iniciar el monitoreo de una carpeta exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await watcherClient.watchFolder('folder1')

      expect(fetch).toHaveBeenCalledWith('/api/folders/folder1/watch', {
        method: 'POST'
      })
      expect(watcherClient.isWatched('folder1')).toBe(true)
    })

    it('debería manejar errores al iniciar el monitoreo', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error al iniciar el monitoreo' })
      })

      await expect(watcherClient.watchFolder('folder1'))
        .rejects.toThrow('Error al iniciar el monitoreo')
      expect(watcherClient.isWatched('folder1')).toBe(false)
    })
  })

  describe('unwatchFolder', () => {
    it('debería detener el monitoreo de una carpeta exitosamente', async () => {
      // Primero agregamos una carpeta al monitoreo
      ; (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      await watcherClient.watchFolder('folder1')
      await watcherClient.unwatchFolder('folder1')

      expect(fetch).toHaveBeenLastCalledWith('/api/folders/folder1/watch', {
        method: 'DELETE'
      })
      expect(watcherClient.isWatched('folder1')).toBe(false)
    })

    it('debería manejar errores al detener el monitoreo', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error al detener el monitoreo' })
      })

      await expect(watcherClient.unwatchFolder('folder1'))
        .rejects.toThrow('Error al detener el monitoreo')
    })
  })

  describe('syncWatchedFolders', () => {
    it('debería sincronizar las carpetas monitoreadas exitosamente', async () => {
      const mockFolders = [
        { id: 'folder1', isWatched: true },
        { id: 'folder2', isWatched: false },
        { id: 'folder3', isWatched: true }
      ]

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFolders)
        })

      await watcherClient.syncWatchedFolders()

      expect(fetch).toHaveBeenCalledWith('/api/folders/watched')
      expect(watcherClient.isWatched('folder1')).toBe(true)
      expect(watcherClient.isWatched('folder2')).toBe(false)
      expect(watcherClient.isWatched('folder3')).toBe(true)
    })

    it('debería manejar errores durante la sincronización', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      })

      await expect(watcherClient.syncWatchedFolders())
        .rejects.toThrow('Error al sincronizar carpetas monitoreadas')
    })
  })

  describe('stopAll', () => {
    it('debería detener el monitoreo de todas las carpetas', async () => {
      // Primero agregamos algunas carpetas al monitoreo
      ; (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      await watcherClient.watchFolder('folder1')
      await watcherClient.watchFolder('folder2')
      await watcherClient.stopAll()

      expect(watcherClient.getActiveWatchers()).toHaveLength(0)
    })

    it('debería limpiar el estado interno incluso si hay errores', async () => {
      // Primero agregamos algunas carpetas al monitoreo
      ; (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockRejectedValue(new Error('Test error'))

      await watcherClient.watchFolder('folder1')
      await watcherClient.watchFolder('folder2')
      await watcherClient.stopAll()

      expect(watcherClient.getActiveWatchers()).toHaveLength(0)
    })
  })

  describe('getActiveWatchers', () => {
    it('debería retornar la lista de carpetas monitoreadas activas', async () => {
      ; (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await watcherClient.watchFolder('folder1')
      await watcherClient.watchFolder('folder2')

      const activeWatchers = watcherClient.getActiveWatchers()
      expect(activeWatchers).toEqual(['folder1', 'folder2'])
    })
  })

  describe('isWatched', () => {
    it('debería verificar correctamente si una carpeta está siendo monitoreada', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await watcherClient.watchFolder('folder1')

      expect(watcherClient.isWatched('folder1')).toBe(true)
      expect(watcherClient.isWatched('folder2')).toBe(false)
    })
  })

  describe('Error Logging', () => {
    it('no debería loguear errores en ambiente de test', () => {
      const testClient = new WatcherClient({ isTestEnvironment: true })
      console.error = jest.fn()

        ; (fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      expect(testClient.watchFolder('folder1')).rejects.toThrow()
      expect(console.error).not.toHaveBeenCalled()
    })

    it('debería loguear errores en ambiente de producción', () => {
      console.error = jest.fn()

        ; (fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      expect(watcherClient.watchFolder('folder1')).rejects.toThrow()
      expect(console.error).toHaveBeenCalled()
    })
  })
})