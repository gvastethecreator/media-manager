'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { handlePrismaError } from '@/lib/errors'
import { FileItem } from "@/types/file-item"
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const statsLogger = logger.withContext('StatsActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/stats',
  '/images/[id]'
] as const

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path))
  statsLogger.info('🔄 Rutas revalidadas')
}

class StatsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'StatsError'
  }
}

export interface GeneralStats {
  totalImages: number
  totalViews: number
  totalDownloads: number
  totalFolders: number
  totalTags: number
  totalCollections: number
  totalFavorites: number
  totalAlbums: number
  totalCharacters: number
  totalPlaces: number
  totalObjects: number
  totalActivities: number
  totalSize: number
  popularImages: FileItem[]
  topTags: { id: string; name: string; color: string; count: number }[]
  recentActivity: { id: string; type: string; description: string; timestamp: Date }[]
}

export interface ImageStats {
  id: string
  imageId: string
  views: number
  downloads: number
  lastViewed: Date
  createdAt: Date
  updatedAt: Date
}

export async function getGeneralStats(): Promise<GeneralStats> {
  try {
    statsLogger.info('📊 Obteniendo estadísticas generales')

    // Obtener conteos
    const [
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,
      totalFavorites,
      totalAlbums,
      totalCharacters,
      totalPlaces,
      totalObjects,
      totalActivities
    ] = await Promise.all([
      prisma.image.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.favorite.count(),
      prisma.album.count(),
      prisma.character.count(),
      prisma.place.count(),
      prisma.object.count(),
      prisma.activity.count()
    ])

    // Obtener estadísticas de vistas y descargas
    const viewsAndDownloads = await prisma.imageStats.aggregate({
      _sum: {
        views: true,
        downloads: true
      }
    })

    // Obtener tamaño total
    const sizeStats = await prisma.image.aggregate({
      _sum: {
        size: true
      }
    })

    // Obtener imágenes populares
    const popularImages = await prisma.image.findMany({
      take: 5,
      orderBy: {
        stats: {
          views: 'desc'
        }
      },
      include: {
        tags: true,
        collections: true,
        albums: true,
        characters: true,
        places: true,
        objects: true
      }
    }) as unknown as ServerImage[]

    // Obtener tags más usados
    const topTags = await prisma.tag.findMany({
      take: 10,
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        images: {
          _count: 'desc'
        }
      }
    })

    // Obtener actividad reciente
    const recentActivity = await prisma.activity.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const generalStats: GeneralStats = {
      totalImages,
      totalViews: viewsAndDownloads._sum.views || 0,
      totalDownloads: viewsAndDownloads._sum.downloads || 0,
      totalFolders,
      totalTags,
      totalCollections,
      totalFavorites,
      totalAlbums,
      totalCharacters,
      totalPlaces,
      totalObjects,
      totalActivities,
      totalSize: sizeStats._sum.size || 0,
      popularImages: popularImages.map(img => convertServerImageToFileItem(img)),
      topTags: topTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: tag._count.images
      })),
      recentActivity: recentActivity.map(act => ({
        id: act.id,
        type: act.type,
        description: act.description,
        timestamp: act.createdAt
      }))
    }

    statsLogger.info('✅ Estadísticas generales obtenidas')
    return generalStats
  } catch (error) {
    statsLogger.error('❌ Error al obtener estadísticas generales:', error)
    throw new StatsError('No se pudieron obtener las estadísticas generales', error)
  }
}

export async function getImageStats(imageId: string): Promise<ImageStats> {
  try {
    statsLogger.info('📊 Obteniendo estadísticas de imagen:', imageId)
    let imageStats = await prisma.imageStats.findUnique({
      where: { imageId }
    })

    if (!imageStats) {
      imageStats = await prisma.imageStats.create({
        data: {
          imageId,
          views: 0,
          downloads: 0,
          lastViewed: new Date()
        }
      })
    }

    statsLogger.info('✅ Estadísticas de imagen obtenidas:', imageId)
    return imageStats
  } catch (error) {
    statsLogger.error('❌ Error al obtener estadísticas de imagen:', { imageId, error })
    throw new StatsError('No se pudieron obtener las estadísticas de la imagen', error)
  }
}

export async function incrementImageView(imageId: string): Promise<ImageStats> {
  try {
    statsLogger.info('👁️ Incrementando vistas de imagen:', imageId)
    const imageStats = await prisma.imageStats.upsert({
      where: { imageId },
      update: {
        views: { increment: 1 },
        lastViewed: new Date()
      },
      create: {
        imageId,
        views: 1,
        downloads: 0,
        lastViewed: new Date()
      }
    })

    // Emitir evento
    statsEventEmitter.emit(STATS_EVENTS.VIEW_INCREMENTED, { imageId, imageStats })
    revalidateAllPaths()

    statsLogger.info('✅ Vistas de imagen incrementadas:', imageId)
    return imageStats
  } catch (error) {
    statsLogger.error('❌ Error al incrementar vistas de imagen:', { imageId, error })
    throw new StatsError('No se pudieron incrementar las vistas de la imagen', error)
  }
}

export async function incrementImageDownload(imageId: string): Promise<ImageStats> {
  try {
    statsLogger.info('⬇️ Incrementando descargas de imagen:', imageId)
    const imageStats = await prisma.imageStats.upsert({
      where: { imageId },
      update: {
        downloads: { increment: 1 }
      },
      create: {
        imageId,
        views: 0,
        downloads: 1,
        lastViewed: new Date()
      }
    })

    // Emitir evento
    statsEventEmitter.emit(STATS_EVENTS.DOWNLOAD_INCREMENTED, { imageId, imageStats })
    revalidateAllPaths()

    statsLogger.info('✅ Descargas de imagen incrementadas:', imageId)
    return imageStats
  } catch (error) {
    statsLogger.error('❌ Error al incrementar descargas de imagen:', { imageId, error })
    throw new StatsError('No se pudieron incrementar las descargas de la imagen', error)
  }
}
