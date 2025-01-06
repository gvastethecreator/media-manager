import { imageService } from '@/services/image.service'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { thumbnailService } from '@/services/thumbnail.service'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    image: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    },
    thumbnail: {
      create: jest.fn(),
      findFirst: jest.fn()
    }
  }
}))

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
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

// Mock thumbnail service
jest.mock('@/services/thumbnail.service', () => ({
  thumbnailService: {
    generateThumbnail: jest.fn(),
    getThumbnailPath: jest.fn(),
    ensureThumbnailsDir: jest.fn()
  }
}))

describe('Image Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('createImage', () => {
    it('debería crear una imagen exitosamente', async () => {
      const mockImage = {
        id: '1',
        path: '/test/image.jpg',
        name: 'image.jpg',
        size: 1024,
        type: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockThumbnail = {
        id: '1',
        path: '/thumbnails/image.jpg',
        size: 512,
        width: 200,
        height: 150
      }

        ; (prisma.image.create as jest.Mock).mockResolvedValueOnce(mockImage)
        ; (thumbnailService.generateThumbnail as jest.Mock).mockResolvedValueOnce({
          buffer: Buffer.from('thumbnail'),
          metadata: { width: 200, height: 150 }
        })
        ; (thumbnailService.getThumbnailPath as jest.Mock).mockReturnValueOnce('/thumbnails/image.jpg')
        ; (prisma.thumbnail.create as jest.Mock).mockResolvedValueOnce(mockThumbnail)

      const result = await imageService.createImage({
        path: '/test/image.jpg',
        buffer: Buffer.from('test image')
      })

      expect(result).toEqual(mockImage)
      expect(prisma.image.create).toHaveBeenCalled()
      expect(thumbnailService.generateThumbnail).toHaveBeenCalled()
      expect(prisma.thumbnail.create).toHaveBeenCalled()
    })

    it('debería manejar errores durante la creación', async () => {
      const error = new Error('Test error')
        ; (prisma.image.create as jest.Mock).mockRejectedValueOnce(error)

      await expect(imageService.createImage({
        path: '/test/image.jpg',
        buffer: Buffer.from('test image')
      })).rejects.toThrow()
    })
  })

  describe('getThumbnail', () => {
    it('debería obtener un thumbnail existente', async () => {
      const mockThumbnail = {
        id: '1',
        path: '/thumbnails/image.jpg'
      }

        ; (prisma.thumbnail.findFirst as jest.Mock).mockResolvedValueOnce(mockThumbnail)
        ; (fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('thumbnail'))

      const result = await imageService.getThumbnail('1')

      expect(result).toBeInstanceOf(Buffer)
      expect(prisma.thumbnail.findFirst).toHaveBeenCalledWith({
        where: { imageId: '1' }
      })
    })

    it('debería generar un nuevo thumbnail si no existe', async () => {
      ; (prisma.thumbnail.findFirst as jest.Mock).mockResolvedValueOnce(null)
        ; (prisma.image.findUnique as jest.Mock).mockResolvedValueOnce({
          id: '1',
          path: '/test/image.jpg'
        })
        ; (fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('image'))
        ; (thumbnailService.generateThumbnail as jest.Mock).mockResolvedValueOnce({
          buffer: Buffer.from('thumbnail'),
          metadata: { width: 200, height: 150 }
        })
        ; (thumbnailService.getThumbnailPath as jest.Mock).mockReturnValueOnce('/thumbnails/image.jpg')
        ; (prisma.thumbnail.create as jest.Mock).mockResolvedValueOnce({
          id: '1',
          path: '/thumbnails/image.jpg'
        })

      const result = await imageService.getThumbnail('1')

      expect(result).toBeInstanceOf(Buffer)
      expect(thumbnailService.generateThumbnail).toHaveBeenCalled()
    })

    it('debería manejar errores al obtener thumbnail', async () => {
      const error = new Error('Test error')
        ; (prisma.thumbnail.findFirst as jest.Mock).mockRejectedValueOnce(error)

      await expect(imageService.getThumbnail('1')).rejects.toThrow()
    })
  })

  describe('processImage', () => {
    it('debería procesar una imagen exitosamente', async () => {
      const mockMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        size: 1024
      }

        ; (sharp as jest.Mock).mockImplementation(() => ({
          metadata: jest.fn().mockResolvedValue(mockMetadata),
          resize: jest.fn().mockReturnThis(),
          toFormat: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed'))
        }))

      const result = await imageService.processImage(Buffer.from('test'), {
        width: 400,
        height: 300,
        format: 'webp'
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(sharp).toHaveBeenCalled()
    })

    it('debería manejar errores durante el procesamiento', async () => {
      const error = new Error('Test error')
        ; (sharp as jest.Mock).mockImplementation(() => {
          throw error
        })

      await expect(imageService.processImage(Buffer.from('test'), {
        width: 400,
        height: 300
      })).rejects.toThrow()
    })
  })

  describe('deleteImage', () => {
    it('debería eliminar una imagen y sus thumbnails exitosamente', async () => {
      const mockImage = {
        id: '1',
        path: '/test/image.jpg',
        thumbnails: [
          { id: '1', path: '/thumbnails/image.jpg' }
        ]
      }

        ; (prisma.image.findUnique as jest.Mock).mockResolvedValueOnce(mockImage)
        ; (fs.unlink as jest.Mock).mockResolvedValue(undefined)
        ; (prisma.image.delete as jest.Mock).mockResolvedValueOnce(mockImage)

      await imageService.deleteImage('1')

      expect(fs.unlink).toHaveBeenCalledTimes(2) // Imagen original y thumbnail
      expect(prisma.image.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      })
    })

    it('debería manejar errores durante la eliminación', async () => {
      const error = new Error('Test error')
        ; (prisma.image.findUnique as jest.Mock).mockRejectedValueOnce(error)

      await expect(imageService.deleteImage('1')).rejects.toThrow()
    })
  })

  describe('updateImage', () => {
    it('debería actualizar una imagen exitosamente', async () => {
      const mockImage = {
        id: '1',
        name: 'updated.jpg'
      }

        ; (prisma.image.update as jest.Mock).mockResolvedValueOnce(mockImage)

      const result = await imageService.updateImage('1', {
        name: 'updated.jpg'
      })

      expect(result).toEqual(mockImage)
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'updated.jpg', updatedAt: expect.any(Date) }
      })
    })

    it('debería manejar errores durante la actualización', async () => {
      const error = new Error('Test error')
        ; (prisma.image.update as jest.Mock).mockRejectedValueOnce(error)

      await expect(imageService.updateImage('1', {
        name: 'updated.jpg'
      })).rejects.toThrow()
    })
  })

  describe('getImageMetadata', () => {
    it('debería obtener metadatos de una imagen exitosamente', async () => {
      const mockMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        size: 1024
      }

        ; (sharp as jest.Mock).mockImplementation(() => ({
          metadata: jest.fn().mockResolvedValue(mockMetadata)
        }))

      const result = await imageService.getImageMetadata(Buffer.from('test'))

      expect(result).toEqual(mockMetadata)
      expect(sharp).toHaveBeenCalled()
    })

    it('debería manejar errores al obtener metadatos', async () => {
      const error = new Error('Test error')
        ; (sharp as jest.Mock).mockImplementation(() => {
          throw error
        })

      await expect(imageService.getImageMetadata(Buffer.from('test')))
        .rejects.toThrow()
    })
  })
})