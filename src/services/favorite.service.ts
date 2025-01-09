import { prisma } from '@/lib/prisma'
import type { Favorite } from '.prisma/client'

export const favoriteService = {
  // Add image to favorites
  async addToFavorites(imageId: string): Promise<Favorite> {
    return prisma.favorite.create({
      data: {
        imageId,
        createdAt: new Date(),
      },
      include: {
        image: {
          include: {
            tags: true,
          },
        },
      },
    })
  },

  // Remove image from favorites
  async removeFromFavorites(imageId: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        id: imageId,
      },
    })
  },

  // Get all favorite images
  async getFavorites() {
    return prisma.favorite.findMany({
      include: {
        image: {
          include: {
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
  async isFavorited(imageId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findFirst({
      where: {
        imageId,
      },
    })
    return !!favorite
  },

  // Toggle favorite status
  async toggleFavorite(imageId: string): Promise<boolean> {
    const isFavorited = await this.isFavorited(imageId)

    if (isFavorited) {
      await this.removeFromFavorites(imageId)
      return false
    } else {
      await this.addToFavorites(imageId)
      return true
    }
  },

  // Get recent favorites
  async getRecentFavorites(limit: number = 10) {
    return prisma.favorite.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        image: {
          include: {
            tags: true,
          },
        },
      },
    })
  },
}
