import { prisma } from '@/lib/prisma'
import type { Favorite } from '@prisma/client'

export const favoriteService = {
  // Add image to favorites
  async addToFavorites(userId: string, imageId: string): Promise<Favorite> {
    return prisma.favorite.create({
      data: {
        userId,
        imageId,
        createdAt: new Date(),
      },
      include: {
        image: {
          include: {
            thumbnails: true,
            tags: true,
          },
        },
      },
    })
  },

  // Remove image from favorites
  async removeFromFavorites(userId: string, imageId: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        userId_imageId: {
          userId,
          imageId,
        },
      },
    })
  },

  // Get user's favorite images
  async getUserFavorites(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        image: {
          include: {
            thumbnails: true,
            tags: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  // Check if image is favorited
  async isFavorited(userId: string, imageId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_imageId: {
          userId,
          imageId,
        },
      },
    })
    return !!favorite
  },

  // Toggle favorite status
  async toggleFavorite(userId: string, imageId: string): Promise<boolean> {
    const isFavorited = await this.isFavorited(userId, imageId)

    if (isFavorited) {
      await this.removeFromFavorites(userId, imageId)
      return false
    } else {
      await this.addToFavorites(userId, imageId)
      return true
    }
  },

  // Get recently favorited images
  async getRecentFavorites(userId: string, limit: number = 10) {
    return prisma.favorite.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        image: {
          include: {
            thumbnails: true,
            tags: true,
          },
        },
      },
    })
  },
}
