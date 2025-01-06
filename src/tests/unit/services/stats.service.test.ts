import { statsService } from '@/services/stats.service'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    imageStats: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

describe('Stats Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateImageStats', () => {
    it('debería obtener estadísticas existentes', async () => {
      const mockStats = {
        id: 'stats1',
        imageId: 'img1',
        viewCount: 5,
        downloadCount: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(mockStats)

      const result = await statsService.getOrCreateImageStats('img1')

      expect(prisma.imageStats.findUnique).toHaveBeenCalledWith({
        where: { imageId: 'img1' }
      })
      expect(result).toEqual(mockStats)
    })

    it('debería crear nuevas estadísticas si no existen', async () => {
      const mockNewStats = {
        id: 'stats1',
        imageId: 'img1',
        viewCount: 0,
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(null)
        ; (prisma.imageStats.create as jest.Mock).mockResolvedValueOnce(mockNewStats)

      const result = await statsService.getOrCreateImageStats('img1')

      expect(prisma.imageStats.create).toHaveBeenCalledWith({
        data: {
          imageId: 'img1',
          viewCount: 0,
          downloadCount: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockNewStats)
    })
  })

  describe('incrementViewCount', () => {
    it('debería incrementar el contador de vistas', async () => {
      const mockStats = {
        id: 'stats1',
        imageId: 'img1',
        viewCount: 5
      }

      const mockUpdatedStats = {
        ...mockStats,
        viewCount: 6,
        lastViewed: new Date(),
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (prisma.imageStats.update as jest.Mock).mockResolvedValueOnce(mockUpdatedStats)

      const result = await statsService.incrementViewCount('img1')

      expect(prisma.imageStats.update).toHaveBeenCalledWith({
        where: { id: 'stats1' },
        data: {
          viewCount: { increment: 1 },
          lastViewed: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedStats)
    })
  })

  describe('incrementDownloadCount', () => {
    it('debería incrementar el contador de descargas', async () => {
      const mockStats = {
        id: 'stats1',
        imageId: 'img1',
        downloadCount: 2
      }

      const mockUpdatedStats = {
        ...mockStats,
        downloadCount: 3,
        lastDownloaded: new Date(),
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (prisma.imageStats.update as jest.Mock).mockResolvedValueOnce(mockUpdatedStats)

      const result = await statsService.incrementDownloadCount('img1')

      expect(prisma.imageStats.update).toHaveBeenCalledWith({
        where: { id: 'stats1' },
        data: {
          downloadCount: { increment: 1 },
          lastDownloaded: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedStats)
    })
  })

  describe('updateRating', () => {
    it('debería actualizar el rating promedio cuando no hay rating previo', async () => {
      const mockStats = {
        id: 'stats1',
        imageId: 'img1',
        averageRating: 0
      }

      const mockUpdatedStats = {
        ...mockStats,
        averageRating: 4,
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (prisma.imageStats.update as jest.Mock).mockResolvedValueOnce(mockUpdatedStats)

      const result = await statsService.updateRating('img1', 4)

      expect(prisma.imageStats.update).toHaveBeenCalledWith({
        where: { id: 'stats1' },
        data: {
          averageRating: 4,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedStats)
    })

    it('debería actualizar el rating promedio cuando ya existe un rating', async () => {
      const mockStats = {
        id: 'stats1',
        imageId: 'img1',
        averageRating: 3
      }

      const mockUpdatedStats = {
        ...mockStats,
        averageRating: 3.5,
        updatedAt: new Date()
      }

        ; (prisma.imageStats.findUnique as jest.Mock).mockResolvedValueOnce(mockStats)
        ; (prisma.imageStats.update as jest.Mock).mockResolvedValueOnce(mockUpdatedStats)

      const result = await statsService.updateRating('img1', 4)

      expect(prisma.imageStats.update).toHaveBeenCalledWith({
        where: { id: 'stats1' },
        data: {
          averageRating: 3.5,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedStats)
    })
  })

  describe('getPopularImages', () => {
    it('debería obtener las imágenes más populares', async () => {
      const mockPopularImages = [
        {
          id: 'stats1',
          imageId: 'img1',
          viewCount: 100,
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.imageStats.findMany as jest.Mock).mockResolvedValueOnce(mockPopularImages)

      const result = await statsService.getPopularImages(5)

      expect(prisma.imageStats.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: {
          viewCount: 'desc'
        },
        include: {
          image: {
            include: {
              thumbnails: true,
              tags: true
            }
          }
        }
      })
      expect(result).toEqual(mockPopularImages)
    })
  })

  describe('getMostDownloadedImages', () => {
    it('debería obtener las imágenes más descargadas', async () => {
      const mockDownloadedImages = [
        {
          id: 'stats1',
          imageId: 'img1',
          downloadCount: 50,
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.imageStats.findMany as jest.Mock).mockResolvedValueOnce(mockDownloadedImages)

      const result = await statsService.getMostDownloadedImages(5)

      expect(prisma.imageStats.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: {
          downloadCount: 'desc'
        },
        include: {
          image: {
            include: {
              thumbnails: true,
              tags: true
            }
          }
        }
      })
      expect(result).toEqual(mockDownloadedImages)
    })
  })

  describe('getHighestRatedImages', () => {
    it('debería obtener las imágenes mejor valoradas', async () => {
      const mockRatedImages = [
        {
          id: 'stats1',
          imageId: 'img1',
          averageRating: 4.8,
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.imageStats.findMany as jest.Mock).mockResolvedValueOnce(mockRatedImages)

      const result = await statsService.getHighestRatedImages(5)

      expect(prisma.imageStats.findMany).toHaveBeenCalledWith({
        take: 5,
        where: {
          averageRating: {
            not: null
          }
        },
        orderBy: {
          averageRating: 'desc'
        },
        include: {
          image: {
            include: {
              thumbnails: true,
              tags: true
            }
          }
        }
      })
      expect(result).toEqual(mockRatedImages)
    })
  })

  describe('getRecentlyViewedImages', () => {
    it('debería obtener las imágenes vistas recientemente', async () => {
      const mockRecentImages = [
        {
          id: 'stats1',
          imageId: 'img1',
          lastViewed: new Date(),
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.imageStats.findMany as jest.Mock).mockResolvedValueOnce(mockRecentImages)

      const result = await statsService.getRecentlyViewedImages(5)

      expect(prisma.imageStats.findMany).toHaveBeenCalledWith({
        take: 5,
        where: {
          lastViewed: {
            not: null
          }
        },
        orderBy: {
          lastViewed: 'desc'
        },
        include: {
          image: {
            include: {
              thumbnails: true,
              tags: true
            }
          }
        }
      })
      expect(result).toEqual(mockRecentImages)
    })
  })
})