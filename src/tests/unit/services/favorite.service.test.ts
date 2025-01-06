import { favoriteService } from '@/services/favorite.service'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    favorite: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
  }
}))

describe('Favorite Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addToFavorites', () => {
    it('debería agregar una imagen a favoritos exitosamente', async () => {
      const mockFavorite = {
        userId: 'user1',
        imageId: 'img1',
        createdAt: new Date(),
        image: {
          thumbnails: [],
          tags: []
        }
      }

        ; (prisma.favorite.create as jest.Mock).mockResolvedValueOnce(mockFavorite)

      const result = await favoriteService.addToFavorites('user1', 'img1')

      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          imageId: 'img1',
          createdAt: expect.any(Date)
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
      expect(result).toEqual(mockFavorite)
    })
  })

  describe('removeFromFavorites', () => {
    it('debería eliminar una imagen de favoritos exitosamente', async () => {
      await favoriteService.removeFromFavorites('user1', 'img1')

      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: {
          userId_imageId: {
            userId: 'user1',
            imageId: 'img1'
          }
        }
      })
    })
  })

  describe('getUserFavorites', () => {
    it('debería obtener todos los favoritos del usuario', async () => {
      const mockFavorites = [
        {
          userId: 'user1',
          imageId: 'img1',
          createdAt: new Date(),
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.favorite.findMany as jest.Mock).mockResolvedValueOnce(mockFavorites)

      const result = await favoriteService.getUserFavorites('user1')

      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          image: {
            include: {
              thumbnails: true,
              tags: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      expect(result).toEqual(mockFavorites)
    })
  })

  describe('isFavorited', () => {
    it('debería retornar true si la imagen está en favoritos', async () => {
      ; (prisma.favorite.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 })

      const result = await favoriteService.isFavorited('user1', 'img1')

      expect(prisma.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          userId_imageId: {
            userId: 'user1',
            imageId: 'img1'
          }
        }
      })
      expect(result).toBe(true)
    })

    it('debería retornar false si la imagen no está en favoritos', async () => {
      ; (prisma.favorite.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await favoriteService.isFavorited('user1', 'img1')
      expect(result).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('debería agregar a favoritos si no estaba', async () => {
      ; (prisma.favorite.findUnique as jest.Mock).mockResolvedValueOnce(null)
        ; (prisma.favorite.create as jest.Mock).mockResolvedValueOnce({ id: 1 })

      const result = await favoriteService.toggleFavorite('user1', 'img1')

      expect(result).toBe(true)
      expect(prisma.favorite.create).toHaveBeenCalled()
    })

    it('debería remover de favoritos si ya estaba', async () => {
      ; (prisma.favorite.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 })
        ; (prisma.favorite.delete as jest.Mock).mockResolvedValueOnce({ id: 1 })

      const result = await favoriteService.toggleFavorite('user1', 'img1')

      expect(result).toBe(false)
      expect(prisma.favorite.delete).toHaveBeenCalled()
    })
  })

  describe('getRecentFavorites', () => {
    it('debería obtener los favoritos recientes con límite', async () => {
      const mockFavorites = [
        {
          userId: 'user1',
          imageId: 'img1',
          createdAt: new Date(),
          image: {
            thumbnails: [],
            tags: []
          }
        }
      ]

        ; (prisma.favorite.findMany as jest.Mock).mockResolvedValueOnce(mockFavorites)

      const result = await favoriteService.getRecentFavorites('user1', 5)

      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        take: 5,
        orderBy: {
          createdAt: 'desc'
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
      expect(result).toEqual(mockFavorites)
    })
  })
})