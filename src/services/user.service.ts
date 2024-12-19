import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export type CreateUserInput = {
  email: string
  name?: string
}

export const userService = {
  // Create a new user
  async createUser(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Get user by ID
  async getUser(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        images: true,
        albums: true,
      },
    })
  },

  // Update user
  async updateUser(
    id: string,
    data: { email?: string; name?: string },
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  },
}
