import { initializeWatcher, stopWatcher } from '@/services/watcher.server'
import { prisma } from '@/lib/db'
import chokidar from 'chokidar'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    folder: {
      findMany: jest.fn()
    }
  }
}))

// Mock chokidar
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    close: jest.fn()
  })
}))

describe('Watcher Server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.warn = jest.fn() // Mock console.warn para los mensajes de deprecated
    console.log = jest.fn() // Mock console.log
    console.error = jest.fn() // Mock console.error
  })

  describe('initializeWatcher', () => {
    it('debería inicializar el watcher exitosamente con carpetas monitoreadas', async () => {
      const mockFolders = [
        { id: 'folder1', path: '/path/1', isWatched: true },
        { id: 'folder2', path: '/path/2', isWatched: true }
      ]

        ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders)

      const result = await initializeWatcher()

      expect(prisma.folder.findMany).toHaveBeenCalledWith({
        where: { isWatched: true }
      })
      expect(chokidar.watch).toHaveBeenCalledWith(
        ['/path/1', '/path/2'],
        expect.any(Object)
      )
      expect(result).toBe(true)
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherServer.initialize instead')
    })

    it('debería manejar el caso sin carpetas monitoreadas', async () => {
      ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce([])

      const result = await initializeWatcher()

      expect(prisma.folder.findMany).toHaveBeenCalled()
      expect(chokidar.watch).not.toHaveBeenCalled()
      expect(result).toBe(true)
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] No hay carpetas monitoreadas')
    })

    it('debería manejar errores durante la inicialización', async () => {
      const error = new Error('Test error')
        ; (prisma.folder.findMany as jest.Mock).mockRejectedValueOnce(error)

      await expect(initializeWatcher()).rejects.toThrow(error)
      expect(console.error).toHaveBeenCalledWith('❌ [Watcher] Error al inicializar:', error)
    })
  })

  describe('stopWatcher', () => {
    it('debería detener el watcher exitosamente', () => {
      const mockWatcher = {
        close: jest.fn()
      }

        // Simular un watcher activo
        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      initializeWatcher() // Inicializar el watcher
      stopWatcher() // Detener el watcher

      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherServer.stop instead')
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] Monitoreo detenido')
    })

    it('debería manejar el caso cuando no hay watcher activo', () => {
      stopWatcher()
      expect(console.warn).toHaveBeenCalledWith('⚠️ [Deprecated] Use watcherServer.stop instead')
    })
  })
})