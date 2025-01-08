import { prisma } from '@/lib/prisma'
import type { ImageStats } from '@prisma/client'

export interface ThumbnailStats {
  processed: number
  optimized: number
  cleaned: number
  totalSaved: number
  totalFreed: number
  errors: number
}

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
        views: 0,
        downloads: 0,
        lastViewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  },

  // Increment view count
  async incrementViewCount(imageId: string): Promise<ImageStats> {
    const stats = await this.getOrCreateImageStats(imageId)

    return prisma.imageStats.update({
      where: { id: stats.id },
      data: {
        views: { increment: 1 },
        lastViewed: new Date(),
        updatedAt: new Date()
      }
    })
  },

  // Increment download count
  async incrementDownloadCount(imageId: string): Promise<ImageStats> {
    const stats = await this.getOrCreateImageStats(imageId)

    return prisma.imageStats.update({
      where: { id: stats.id },
      data: {
        downloads: { increment: 1 },
        updatedAt: new Date()
      }
    })
  },

  // Get popular images
  async getPopularImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      orderBy: {
        views: 'desc'
      },
      include: {
        image: {
          include: {
            tags: true
          }
        }
      }
    })
  },

  // Get most downloaded images
  async getMostDownloadedImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      orderBy: {
        downloads: 'desc'
      },
      include: {
        image: {
          include: {
            tags: true
          }
        }
      }
    })
  },

  // Get recently viewed images
  async getRecentlyViewedImages(limit: number = 10) {
    return prisma.imageStats.findMany({
      take: limit,
      orderBy: {
        lastViewed: 'desc'
      },
      include: {
        image: {
          include: {
            tags: true
          }
        }
      }
    })
  }
}
