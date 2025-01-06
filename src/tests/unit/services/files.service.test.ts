import { getFiles, getFilesByFolder, getCollectionFiles, getTaggedFiles, getFavorites } from '@/services/files.service'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    image: {
      findMany: jest.fn()
    }
  }
}))

describe('Files Service', () => {
  const mockImage = {
    id: 'img1',
    name: 'test.jpg',
    path: '/test/path',
    size: 1024,
    width: 800,
    height: 600,
    metadata: JSON.stringify({
      mimeType: 'image/jpeg'
    }),
    thumbnail: true,
    tags: [
      { id: 'tag1', name: 'test', color: '#000000' }
    ],
    collections: [
      { id: 'col1', name: 'Test Collection', emoji: '📸', color: '#FF0000' }
    ],
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      views: 0,
      downloads: 0,
      lastViewed: null
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFiles', () => {
    it('debería obtener archivos sin path específico', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getFiles()

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          collections: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true
            }
          },
          stats: {
            select: {
              views: true,
              downloads: true,
              lastViewed: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      expect(result[0]).toMatchObject({
        id: 'img1',
        name: 'test.jpg',
        path: '/test/path',
        type: 'image',
        size: 1024,
        width: 800,
        height: 600,
        mimeType: 'image/jpeg',
        thumbnail: '/api/images/img1/thumbnail',
        src: '/api/images/img1'
      })
    })

    it('debería obtener archivos con path específico', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getFiles('/test/path')

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: {
          path: {
            startsWith: '/test/path'
          }
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('getFilesByFolder', () => {
    it('debería obtener archivos por folder ID', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getFilesByFolder('folder1')

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: {
          folderId: 'folder1'
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('getCollectionFiles', () => {
    it('debería obtener archivos por collection ID', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getCollectionFiles('col1')

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: {
          collections: {
            some: {
              id: 'col1'
            }
          }
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('getTaggedFiles', () => {
    it('debería obtener archivos por nombre de tag', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getTaggedFiles('test')

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            some: {
              name: 'test'
            }
          }
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('getFavorites', () => {
    it('debería obtener archivos favoritos', async () => {
      ; (prisma.image.findMany as jest.Mock).mockResolvedValueOnce([mockImage])

      const result = await getFavorites()

      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: {
          isFavorite: true
        },
        include: {
          tags: true,
          collections: true
        }
      })
    })
  })
})