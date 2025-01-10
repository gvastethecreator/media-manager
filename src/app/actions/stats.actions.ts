'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { handlePrismaError } from '@/lib/errors'

const statsLogger = logger.withContext('StatsActions')

export type GeneralStats = {
  totalImages: number
  totalViews: number
  totalDownloads: number
  totalFolders: number
  totalTags: number
  totalCollections: number
  totalFavorites: number
  totalSize: number
  popularImages: Array<{
    id: string
    image: {
      id: string
      name: string
    }
    views: number
  }>
  topTags: Array<{
    name: string
    color: string
    count: number
  }>
  recentActivity: Array<{
    description: string
    timestamp: string
    iconName: string
  }>
}

export async function getGeneralStats(): Promise<GeneralStats> {
  try {
    const [
      totalImages,
      totalViews,
      totalDownloads,
      totalFolders,
      totalTags,
      totalCollections,
      totalFavorites,
      totalSize,
      popularImages,
      topTags,
      recentActivity,
    ] = await Promise.all([
      prisma.image.count(),
      prisma.imageStats.aggregate({
        _sum: {
          views: true,
        },
      }),
      prisma.imageStats.aggregate({
        _sum: {
          downloads: true,
        },
      }),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.image.count({
        where: {
          isFavorite: true,
        },
      }),
      prisma.image.aggregate({
        _sum: {
          size: true,
        },
      }),
      prisma.imageStats.findMany({
        take: 5,
        orderBy: {
          views: 'desc',
        },
        include: {
          image: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.tag.findMany({
        take: 5,
        orderBy: {
          images: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: {
              images: true,
            },
          },
        },
      }),
      prisma.activity.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      totalImages,
      totalViews: totalViews._sum.views || 0,
      totalDownloads: totalDownloads._sum.downloads || 0,
      totalFolders,
      totalTags,
      totalCollections,
      totalFavorites,
      totalSize: totalSize._sum.size || 0,
      popularImages,
      topTags: topTags.map((tag) => ({
        name: tag.name,
        color: tag.color,
        count: tag._count.images,
      })),
      recentActivity: recentActivity.map((activity) => ({
        description: activity.description,
        timestamp: activity.createdAt.toLocaleString(),
        iconName: activity.type,
      })),
    }
  } catch (error) {
    statsLogger.error('Error al obtener estadísticas generales', { error })
    handlePrismaError(error)
  }
}

export async function getImageStats(imageId: string) {
  try {
    const stats = await prisma.imageStats.findUnique({
      where: { imageId },
    })

    if (!stats) {
      return await prisma.imageStats.create({
        data: {
          imageId,
          views: 0,
          downloads: 0,
        },
      })
    }

    return stats
  } catch (error) {
    statsLogger.error('Error al obtener estadísticas de imagen', {
      error,
      imageId,
    })
    handlePrismaError(error)
  }
}

export async function incrementImageView(imageId: string) {
  try {
    const stats = await prisma.imageStats.upsert({
      where: { imageId },
      create: {
        imageId,
        views: 1,
        downloads: 0,
      },
      update: {
        views: {
          increment: 1,
        },
      },
    })

    // Crear registro de actividad
    await prisma.activity.create({
      data: {
        type: 'Eye',
        description: 'Imagen visualizada',
        imageId,
      },
    })

    revalidatePath('/stats')
    return stats
  } catch (error) {
    statsLogger.error('Error al incrementar vistas', { error, imageId })
    handlePrismaError(error)
  }
}

export async function incrementImageDownload(imageId: string) {
  try {
    const stats = await prisma.imageStats.upsert({
      where: { imageId },
      create: {
        imageId,
        views: 0,
        downloads: 1,
      },
      update: {
        downloads: {
          increment: 1,
        },
      },
    })

    // Crear registro de actividad
    await prisma.activity.create({
      data: {
        type: 'Download',
        description: 'Imagen descargada',
        imageId,
      },
    })

    revalidatePath('/stats')
    return stats
  } catch (error) {
    statsLogger.error('Error al incrementar descargas', { error, imageId })
    handlePrismaError(error)
  }
}
