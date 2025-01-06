import { userService } from '@/services/user.service'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}))

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    it('debería crear un usuario exitosamente', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      }

        ; (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await userService.createUser({
        email: 'test@example.com',
        name: 'Test User'
      })

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('getUser', () => {
    it('debería obtener un usuario por ID exitosamente', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        images: [],
        albums: []
      }

        ; (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await userService.getUser('user1')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: {
          images: true,
          albums: true
        }
      })
      expect(result).toEqual(mockUser)
    })

    it('debería retornar null cuando el usuario no existe', async () => {
      ; (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await userService.getUser('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('debería obtener un usuario por email exitosamente', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        images: [],
        albums: []
      }

        ; (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const result = await userService.getUserByEmail('test@example.com')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          images: true,
          albums: true
        }
      })
      expect(result).toEqual(mockUser)
    })

    it('debería retornar null cuando el email no existe', async () => {
      ; (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await userService.getUserByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('debería actualizar un usuario exitosamente', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        email: 'updated@example.com',
        name: 'Updated User',
        updatedAt: new Date()
      }

        ; (prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser)

      const result = await userService.updateUser('user1', {
        email: 'updated@example.com',
        name: 'Updated User'
      })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          email: 'updated@example.com',
          name: 'Updated User',
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedUser)
    })
  })

  describe('deleteUser', () => {
    it('debería eliminar un usuario exitosamente', async () => {
      await userService.deleteUser('user1')

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user1' }
      })
    })
  })
})