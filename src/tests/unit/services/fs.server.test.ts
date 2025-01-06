import { fsService, initializeFileSystem } from '@/services/fs.server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn()
  }
}))

// Mock path
jest.mock('path', () => ({
  join: jest.fn(),
  normalize: jest.fn(),
  extname: jest.fn()
}))

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    folder: {
      findMany: jest.fn()
    }
  }
}))

describe('File System Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('validatePath', () => {
    it('debería validar una ruta de directorio válida', async () => {
      const mockStats = {
        isDirectory: () => true
      }

        ; (fs.stat as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (fs.access as jest.Mock).mockResolvedValueOnce(undefined)
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/path')

      const result = await fsService.validatePath('/test/path')

      expect(result).toEqual({ valid: true })
      expect(fs.stat).toHaveBeenCalled()
      expect(fs.access).toHaveBeenCalled()
    })

    it('debería rechazar una ruta que no es un directorio', async () => {
      const mockStats = {
        isDirectory: () => false
      }

        ; (fs.stat as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/file.txt')

      const result = await fsService.validatePath('/test/file.txt')

      expect(result).toEqual({
        valid: false,
        error: 'La ruta no es un directorio'
      })
    })

    it('debería manejar errores de permisos', async () => {
      const mockStats = {
        isDirectory: () => true
      }

        ; (fs.stat as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (fs.access as jest.Mock).mockRejectedValueOnce(new Error())
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/path')

      const result = await fsService.validatePath('/test/path')

      expect(result).toEqual({
        valid: false,
        error: 'No tienes permisos de lectura en esta carpeta'
      })
    })

    it('debería manejar rutas inexistentes', async () => {
      const error = new Error()
        ; (error as NodeJS.ErrnoException).code = 'ENOENT'
        ; (fs.stat as jest.Mock).mockRejectedValueOnce(error)
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/nonexistent')

      const result = await fsService.validatePath('/test/nonexistent')

      expect(result).toEqual({
        valid: false,
        error: 'La carpeta no existe'
      })
    })
  })

  describe('listFiles', () => {
    it('debería listar archivos en un directorio', async () => {
      const mockFiles = ['file1.jpg', 'file2.png']
      const mockStats = {
        isFile: () => true,
        size: 1024
      }

        ; (fs.readdir as jest.Mock).mockResolvedValueOnce(mockFiles)
        ; (fs.stat as jest.Mock).mockResolvedValue(mockStats)
        ; (path.join as jest.Mock).mockImplementation((...args) => args.join('/'))
        ; (path.normalize as jest.Mock).mockImplementation(p => p)

      const result = await fsService.listFiles('/test/path')

      expect(result).toEqual([
        { name: 'file1.jpg', path: '/test/path/file1.jpg', size: 1024 },
        { name: 'file2.png', path: '/test/path/file2.png', size: 1024 }
      ])
      expect(fs.readdir).toHaveBeenCalledWith('/test/path')
    })

    it('debería manejar errores al listar archivos', async () => {
      ; (fs.readdir as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      await expect(fsService.listFiles('/test/path'))
        .rejects.toThrow('No se pudo listar los archivos del directorio')
    })

    it('debería filtrar elementos que no son archivos', async () => {
      const mockFiles = ['file1.jpg', 'dir1']
      const mockFileStats = { isFile: () => true, size: 1024 }
      const mockDirStats = { isFile: () => false }

        ; (fs.readdir as jest.Mock).mockResolvedValueOnce(mockFiles)
        ; (fs.stat as jest.Mock)
          .mockResolvedValueOnce(mockFileStats)
          .mockResolvedValueOnce(mockDirStats)
        ; (path.join as jest.Mock).mockImplementation((...args) => args.join('/'))
        ; (path.normalize as jest.Mock).mockImplementation(p => p)

      const result = await fsService.listFiles('/test/path')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('file1.jpg')
    })
  })

  describe('calculateFileHash', () => {
    it('debería calcular el hash de un archivo', async () => {
      const mockBuffer = Buffer.from('test content')
        ; (fs.readFile as jest.Mock).mockResolvedValueOnce(mockBuffer)
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/file.txt')

      const result = await fsService.calculateFileHash('/test/file.txt')

      expect(result).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash
      expect(fs.readFile).toHaveBeenCalled()
    })

    it('debería manejar errores al calcular el hash', async () => {
      ; (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      await expect(fsService.calculateFileHash('/test/file.txt'))
        .rejects.toThrow('No se pudo calcular el hash del archivo')
    })
  })

  describe('getFileMetadata', () => {
    it('debería obtener los metadatos de un archivo', async () => {
      const mockStats = {
        size: 1024,
        birthtime: new Date(),
        mtime: new Date(),
        atime: new Date()
      }

        ; (fs.stat as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (path.normalize as jest.Mock).mockReturnValueOnce('/test/file.txt')

      const result = await fsService.getFileMetadata('/test/file.txt')

      expect(result).toEqual({
        size: mockStats.size,
        created: mockStats.birthtime,
        modified: mockStats.mtime,
        accessed: mockStats.atime
      })
    })

    it('debería manejar errores al obtener metadatos', async () => {
      ; (fs.stat as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      await expect(fsService.getFileMetadata('/test/file.txt'))
        .rejects.toThrow('No se pudo obtener la metadata del archivo')
    })
  })

  describe('isImage', () => {
    it('debería identificar archivos de imagen válidos', async () => {
      ; (path.extname as jest.Mock)
        .mockReturnValueOnce('.jpg')
        .mockReturnValueOnce('.txt')

      const isJpgImage = await fsService.isImage('image.jpg')
      const isTxtImage = await fsService.isImage('document.txt')

      expect(isJpgImage).toBe(true)
      expect(isTxtImage).toBe(false)
    })
  })

  describe('normalizePath', () => {
    it('debería normalizar rutas correctamente', () => {
      const originalPath = '/test/path//extra/'
      const normalizedPath = '\\test\\path\\extra'

        ; (path.normalize as jest.Mock).mockReturnValueOnce(normalizedPath)

      const result = fsService.normalizePath(originalPath)

      expect(result).toBe(normalizedPath)
      expect(path.normalize).toHaveBeenCalledWith(originalPath)
    })

    it('debería manejar errores durante la normalización', () => {
      ; (path.normalize as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error')
      })

      const originalPath = '/test/path'
      const result = fsService.normalizePath(originalPath)

      expect(result).toBe(originalPath)
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('initializeFileSystem', () => {
    it('debería inicializar el sistema de archivos correctamente', async () => {
      const mockFolders = [
        { path: '/test/folder1' },
        { path: '/test/folder2' }
      ]

        ; (fs.access as jest.Mock).mockImplementation(() => Promise.resolve())
        ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders)

      const result = await initializeFileSystem()

      expect(result).toBe(true)
      expect(fs.mkdir).toHaveBeenCalledTimes(4) // Para los directorios requeridos
      expect(prisma.folder.findMany).toHaveBeenCalled()
    })

    it('debería manejar carpetas no encontradas', async () => {
      const mockFolders = [
        { path: '/test/folder1' }
      ]

        ; (fs.access as jest.Mock).mockRejectedValueOnce(new Error())
        ; (prisma.folder.findMany as jest.Mock).mockResolvedValueOnce(mockFolders)

      const result = await initializeFileSystem()

      expect(result).toBe(true)
      expect(console.warn).toHaveBeenCalled()
    })

    it('debería manejar errores durante la inicialización', async () => {
      ; (prisma.folder.findMany as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      await expect(initializeFileSystem()).rejects.toThrow()
      expect(console.error).toHaveBeenCalled()
    })
  })
})