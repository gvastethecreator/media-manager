import { prisma } from '@/lib/prisma'
import type { ImageStats } from '.prisma/client'
import { EventEmitter } from 'events'

export interface ThumbnailStats {
  processed: number
  optimized: number
  cleaned: number
  totalSaved: number
  totalFreed: number
  errors: number
}

// Eventos que pueden causar actualización de estadísticas
export const STATS_EVENTS = {
  IMAGE_VIEW: 'image_view',
  IMAGE_DOWNLOAD: 'image_download',
  IMAGE_ADD: 'image_add',
  IMAGE_DELETE: 'image_delete',
  TAG_CHANGE: 'tag_change',
  COLLECTION_CHANGE: 'collection_change',
  FOLDER_CHANGE: 'folder_change',
  FAVORITE_CHANGE: 'favorite_change',
} as const

class StatsEventEmitter extends EventEmitter {
  private static instance: StatsEventEmitter
  private lastUpdate: number = 0
  private updateInterval: number = 5000 // 5 segundos mínimo entre actualizaciones
  private shouldUpdate: boolean = false

  private constructor() {
    super()
    this.setupEventHandlers()
  }

  public static getInstance(): StatsEventEmitter {
    if (!StatsEventEmitter.instance) {
      StatsEventEmitter.instance = new StatsEventEmitter()
    }
    return StatsEventEmitter.instance
  }

  private setupEventHandlers() {
    Object.values(STATS_EVENTS).forEach(event => {
      this.on(event, () => {
        this.shouldUpdate = true
        this.checkUpdate()
      })
    })
  }

  private checkUpdate() {
    const now = Date.now()
    if (this.shouldUpdate && now - this.lastUpdate >= this.updateInterval) {
      this.shouldUpdate = false
      this.lastUpdate = now
      this.emit('stats_update_needed')
    }
  }
}

export const statsEventEmitter = StatsEventEmitter.getInstance()

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
    statsEventEmitter.emit(STATS_EVENTS.IMAGE_VIEW)

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
    statsEventEmitter.emit(STATS_EVENTS.IMAGE_DOWNLOAD)

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
