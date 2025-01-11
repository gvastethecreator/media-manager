'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { handlePrismaError } from '@/lib/errors'
import { FileItem } from "@/types/file-item";

const statsLogger = logger.withContext('StatsActions')

export interface GeneralStats {
  totalImages: number;
  totalViews: number;
  totalDownloads: number;
  totalFolders: number;
  totalTags: number;
  totalCollections: number;
  totalFavorites: number;
  totalAlbums: number;
  totalCharacters: number;
  totalPlaces: number;
  totalObjects: number;
  totalActivities: number;
  totalSize: number;
  popularImages: FileItem[];
  topTags: { id: string; name: string; color: string; count: number }[];
  recentActivity: { id: string; type: string; description: string; timestamp: Date }[];
}

export async function getGeneralStats(): Promise<GeneralStats> {
  try {
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
      totalActivities,
      totalSize,
      viewsAndDownloads,
      rawPopularImages,
      topTags,
      rawRecentActivity,
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
      prisma.activity.count(),
      prisma.image.aggregate({ _sum: { size: true } }).then((r) => r._sum.size || 0),
      prisma.imageStats.aggregate({
        _sum: {
          views: true,
          downloads: true,
        },
      }),
      prisma.image.findMany({
        take: 5,
        orderBy: [{ stats: { views: 'desc' } }],
        include: {
          tags: true,
          collections: true,
          albums: true,
          characters: true,
          places: true,
          objects: true,
          stats: true,
        },
      }),
      prisma.tag.findMany({
        take: 10,
        orderBy: [{ images: { _count: 'desc' } }],
        include: {
          _count: {
            select: {
              images: true
            }
          }
        },
      }).then((tags) =>
        tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          count: tag._count.images,
        }))
      ),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Transformar imágenes populares al formato FileItem
    const popularImages: FileItem[] = rawPopularImages.map(img => ({
      id: img.id,
      name: img.name,
      path: img.path,
      size: img.size,
      type: 'image',
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      metadata: img.metadata ? JSON.parse(img.metadata) : {},
      tags: img.tags.map(t => t.id),
      collections: img.collections.map(c => c.id),
      albums: img.albums.map(a => a.id),
      characters: img.characters.map(c => c.id),
      places: img.places.map(p => p.id),
      objects: img.objects.map(o => o.id),
      favorite: false,
      views: img.stats?.views || 0,
      downloads: img.stats?.downloads || 0,
      count: 0,
    }));

    // Transformar actividades recientes
    const recentActivity = rawRecentActivity.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt,
    }));

    return {
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
      totalSize,
      popularImages,
      topTags,
      recentActivity,
    };
  } catch (error) {
    statsLogger.error('Error al obtener estadísticas generales:', { error });
    throw error;
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
