import { thumbnailService } from '@/services/thumbnail.service'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    thumbnail: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}))

// Mock sharp
jest.mock('sharp', () => jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  toFormat: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(),
  metadata: jest.fn()
})))

describe('Thumbnail Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('getStats', () => {
    it('debería obtener estadísticas de thumbnails', async () => {
      const mockStats = {
        count: 100,
        totalSize: 1024 * 1024,
        averageSize: 1024
      }

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce([
          { size: 1024 },
          { size: 1024 }
        ])

      const result = await thumbnailService.getStats()

      expect(result).toEqual(expect.objectContaining({
        count: expect.any(Number),
        totalSize: expect.any(Number),
        averageSize: expect.any(Number)
      }))
    })

    it('debería manejar errores al obtener estadísticas', async () => {
      ; (prisma.thumbnail.findMany as jest.Mock).mockRejectedValueOnce(new Error('Test error'))

      await expect(thumbnailService.getStats()).rejects.toThrow()
    })
  })

  describe('optimize', () => {
    it('debería optimizar thumbnails exitosamente', async () => {
      const mockThumbnails = [
        { id: '1', path: '/path/1.jpg', size: 1024 },
        { id: '2', path: '/path/2.jpg', size: 2048 }
      ]

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (sharp as jest.Mock).mockImplementation(() => ({
          resize: jest.fn().mockReturnThis(),
          toFormat: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized'))
        }))

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.optimize({
        onProgress,
        onComplete,
        onError
      })

      expect(onProgress).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('debería manejar errores durante la optimización', async () => {
      const mockThumbnails = [{ id: '1', path: '/path/1.jpg', size: 1024 }]
      const error = new Error('Test error')

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (sharp as jest.Mock).mockImplementation(() => {
          throw error
        })

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.optimize({
        onProgress,
        onComplete,
        onError
      })

      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  describe('clean', () => {
    it('debería limpiar thumbnails huérfanos exitosamente', async () => {
      const mockThumbnails = [
        { id: '1', path: '/path/1.jpg', imageId: 'img1' },
        { id: '2', path: '/path/2.jpg', imageId: 'img2' }
      ]

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (fs.unlink as jest.Mock).mockResolvedValue(undefined)
        ; (prisma.thumbnail.delete as jest.Mock).mockResolvedValue(undefined)

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.clean({
        onProgress,
        onComplete,
        onError
      })

      expect(onProgress).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('debería manejar errores durante la limpieza', async () => {
      const mockThumbnails = [{ id: '1', path: '/path/1.jpg', imageId: 'img1' }]
      const error = new Error('Test error')

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (fs.unlink as jest.Mock).mockRejectedValueOnce(error)

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.clean({
        onProgress,
        onComplete,
        onError
      })

      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  describe('reprocess', () => {
    it('debería reprocesar todos los thumbnails exitosamente', async () => {
      const mockThumbnails = [
        { id: '1', path: '/path/1.jpg', imageId: 'img1' },
        { id: '2', path: '/path/2.jpg', imageId: 'img2' }
      ]

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (sharp as jest.Mock).mockImplementation(() => ({
          resize: jest.fn().mockReturnThis(),
          toFormat: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('reprocessed')),
          metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 })
        }))

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.reprocess({
        onProgress,
        onComplete,
        onError
      })

      expect(onProgress).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('debería manejar errores durante el reprocesamiento', async () => {
      const mockThumbnails = [{ id: '1', path: '/path/1.jpg', imageId: 'img1' }]
      const error = new Error('Test error')

        ; (prisma.thumbnail.findMany as jest.Mock).mockResolvedValueOnce(mockThumbnails)
        ; (sharp as jest.Mock).mockImplementation(() => {
          throw error
        })

      const onProgress = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await thumbnailService.reprocess({
        onProgress,
        onComplete,
        onError
      })

      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  describe('generateThumbnail', () => {
    it('debería generar un thumbnail exitosamente', async () => {
      const mockBuffer = Buffer.from('test image')
      const mockMetadata = { width: 800, height: 600 }

        ; (sharp as jest.Mock).mockImplementation(() => ({
          resize: jest.fn().mockReturnThis(),
          toFormat: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(mockBuffer),
          metadata: jest.fn().mockResolvedValue(mockMetadata)
        }))

      const result = await thumbnailService.generateThumbnail('test.jpg', mockBuffer)

      expect(result).toEqual({
        buffer: mockBuffer,
        metadata: mockMetadata
      })
    })

    it('debería manejar errores en la generación', async () => {
      const error = new Error('Test error')
        ; (sharp as jest.Mock).mockImplementation(() => {
          throw error
        })

      await expect(thumbnailService.generateThumbnail('test.jpg', Buffer.from('test')))
        .rejects.toThrow()
    })
  })

  describe('getThumbnailPath', () => {
    it('debería generar una ruta de thumbnail válida', () => {
      const result = thumbnailService.getThumbnailPath('test.jpg')
      expect(result).toMatch(/thumbnails[/\\].*\.jpg$/)
    })
  })

  describe('ensureThumbnailsDir', () => {
    it('debería crear el directorio si no existe', async () => {
      ; (fs.access as jest.Mock).mockRejectedValueOnce(new Error())
      await thumbnailService.ensureThumbnailsDir()
      expect(fs.mkdir).toHaveBeenCalled()
    })

    it('no debería crear el directorio si ya existe', async () => {
      ; (fs.access as jest.Mock).mockResolvedValueOnce(undefined)
      await thumbnailService.ensureThumbnailsDir()
      expect(fs.mkdir).not.toHaveBeenCalled()
    })
  })
})