import { WatcherServer } from '@/services/watcher/server'
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
    add: jest.fn(),
    unwatch: jest.fn(),
    close: jest.fn()
  })
}))

describe('Watcher Server', () => {
  let watcherServer: WatcherServer
  const mockConfig = {
    stabilityThreshold: 1000,
    pollInterval: 50,
    ignoreInitial: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
    watcherServer = new WatcherServer(mockConfig)
  })

  describe('initialize', () => {
    it('debería inicializar el watcher con rutas proporcionadas', async () => {
      const paths = ['/path/1', '/path/2']

      await watcherServer.initialize(paths)

      expect(chokidar.watch).toHaveBeenCalledWith(paths, expect.objectContaining({
        persistent: true,
        ignoreInitial: mockConfig.ignoreInitial,
        awaitWriteFinish: {
          stabilityThreshold: mockConfig.stabilityThreshold,
          pollInterval: mockConfig.pollInterval
        }
      }))
    })

    it('debería cargar rutas desde la base de datos si no se proporcionan', async () => {
      const mockFolders = [
        { id: '1', path: '/path/1', isWatched: true },
        { id: '2', path: '/path/2', isWatched: true }
      ]

        ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders)

      await watcherServer.initialize()

      expect(prisma.folder.findMany).toHaveBeenCalledWith({
        where: { isWatched: true }
      })
      expect(chokidar.watch).toHaveBeenCalledWith(
        ['/path/1', '/path/2'],
        expect.any(Object)
      )
    })

    it('debería manejar el caso sin carpetas monitoreadas', async () => {
      ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce([])

      await watcherServer.initialize()

      expect(chokidar.watch).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] No hay carpetas monitoreadas')
    })

    it('debería configurar los manejadores de eventos correctamente', async () => {
      const mockWatcher = {
        on: jest.fn().mockReturnThis()
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)

      await watcherServer.initialize(['/path/1'])

      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function))
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function))
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function))
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('debería manejar errores durante la inicialización', async () => {
      const error = new Error('Test error')
        ; (prisma.folder.findMany as jest.Mock).mockRejectedValueOnce(error)

      await expect(watcherServer.initialize()).rejects.toThrow(error)
      expect(console.error).toHaveBeenCalledWith('❌ [Watcher] Error al inicializar:', error)
    })
  })

  describe('addPath', () => {
    it('debería agregar una nueva ruta al watcher', async () => {
      const mockWatcher = {
        add: jest.fn().mockResolvedValueOnce(undefined)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/initial/path'])
      await watcherServer.addPath('/new/path')

      expect(mockWatcher.add).toHaveBeenCalledWith('/new/path')
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] Nueva carpeta monitoreada: /new/path')
    })

    it('no debería agregar una ruta que ya está siendo monitoreada', async () => {
      const mockWatcher = {
        add: jest.fn().mockResolvedValueOnce(undefined)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/path'])
      await watcherServer.addPath('/path')

      expect(mockWatcher.add).not.toHaveBeenCalled()
    })

    it('debería manejar errores al agregar una ruta', async () => {
      const error = new Error('Test error')
      const mockWatcher = {
        add: jest.fn().mockRejectedValueOnce(error)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/initial/path'])

      await expect(watcherServer.addPath('/new/path')).rejects.toThrow(error)
      expect(console.error).toHaveBeenCalledWith('❌ [Watcher] Error al agregar ruta /new/path:', error)
    })
  })

  describe('removePath', () => {
    it('debería remover una ruta del watcher', async () => {
      const mockWatcher = {
        unwatch: jest.fn().mockResolvedValueOnce(undefined)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/path'])
      await watcherServer.removePath('/path')

      expect(mockWatcher.unwatch).toHaveBeenCalledWith('/path')
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] Carpeta removida: /path')
    })

    it('no debería intentar remover una ruta que no está siendo monitoreada', async () => {
      const mockWatcher = {
        unwatch: jest.fn().mockResolvedValueOnce(undefined)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/path'])
      await watcherServer.removePath('/nonexistent/path')

      expect(mockWatcher.unwatch).not.toHaveBeenCalled()
    })

    it('debería manejar errores al remover una ruta', async () => {
      const error = new Error('Test error')
      const mockWatcher = {
        unwatch: jest.fn().mockRejectedValueOnce(error)
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      await watcherServer.initialize(['/path'])

      await expect(watcherServer.removePath('/path')).rejects.toThrow(error)
      expect(console.error).toHaveBeenCalledWith('❌ [Watcher] Error al remover ruta /path:', error)
    })
  })

  describe('stop', () => {
    it('debería detener el watcher y limpiar los recursos', () => {
      const mockWatcher = {
        close: jest.fn()
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      watcherServer.initialize(['/path'])
      watcherServer.stop()

      expect(mockWatcher.close).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('👀 [Watcher] Monitoreo detenido')
    })

    it('no debería hacer nada si el watcher no está activo', () => {
      watcherServer.stop()
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('debería registrar y ejecutar manejadores de eventos', async () => {
      const mockHandler = jest.fn()
      const mockWatcher = {
        on: jest.fn().mockReturnThis()
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      watcherServer.on('onFileAdd', mockHandler)
      await watcherServer.initialize(['/path'])

      // Simular un evento de archivo agregado
      const onAddHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1]
      onAddHandler('/test/file.txt')

      expect(mockHandler).toHaveBeenCalledWith('/test/file.txt')
    })

    it('debería remover manejadores de eventos', async () => {
      const mockHandler = jest.fn()
      const mockWatcher = {
        on: jest.fn().mockReturnThis()
      }

        ; (chokidar.watch as jest.Mock).mockReturnValueOnce(mockWatcher)
      watcherServer.on('onFileAdd', mockHandler)
      watcherServer.off('onFileAdd')
      await watcherServer.initialize(['/path'])

      // Simular un evento de archivo agregado
      const onAddHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1]
      onAddHandler('/test/file.txt')

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})