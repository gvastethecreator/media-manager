import { prisma } from '@/lib/prisma'
import type { ImageStats } from '@prisma/client'

export const statsService = {
  // Initialize or get stats for an image
  async getOrCreateImageStats(imageId: string): Promise<ImageStats> {
    const existingStats = await prisma.imageStats.findUnique({
      where: { imageId },
    })

    if (existingStats) {
      return existingStats
    }

    return prisma.imageStats.create({
      data: {
        imageId,
        viewCount: 0,
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Increment view count
  async incrementViewCount(imageId: string): Promise<ImageStats> {
    const stats = await this.getOrCreateImageStats(imageId)
    
    return prisma.imageStats.update({
      where: { id: stats.id },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Increment download count
  async incrementDownloadCount(imageId: string): Promise<ImageStats> {
    const stats = await this.getOrCreateImageStats(imageId)
    
    return prisma.imageStats.update({
      where: { id: stats.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloaded: new Date(),
        updatedAt: new Date(),
      },
    })
  },

  // Update rating
  async updateRating(imageId: string, rating: number): Promise<ImageStats> {
    const stats = await this.getOrCreateImageStats(imageId)
    const currentRating = stats.averageRating || 0
    const newRating = currentRating === 0 ? rating : (currentRating + rating) / 2

    return prisma.imageStats.update({
      where: { id: stats.id },
      data: {
        averageRating: newRating,
        updatedAt: new Date(),
      },
    })
  },

  // Get popular images
  async getPopularImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      orderBy: {
        viewCount: 'desc',
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

  // Get most downloaded images
  async getMostDownloadedImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      orderBy: {
        downloadCount: 'desc',
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

  // Get highest rated images
  async getHighestRatedImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      where: {
        averageRating: {
          not: null,
        },
      },
      orderBy: {
        averageRating: 'desc',
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

  // Get recently viewed images
  async getRecentlyViewedImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      where: {
        lastViewed: {
          not: null,
        },
      },
      orderBy: {
        lastViewed: 'desc',
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
