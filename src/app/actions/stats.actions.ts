'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'

const STATS_CACHE_TAG = 'stats'
const STATS_REVALIDATE_SECONDS = 60 // 1 minuto

export interface GeneralStats {
  totalImages: number
  totalFolders: number
  totalTags: number
  totalCollections: number
  totalAlbums: number
  totalCharacters: number
  totalPlaces: number
  totalObjects: number
  totalFavorites: number
  totalViews: number
  totalDownloads: number
  totalSize: number
  totalActivities: number
  topTags: Array<{
    id: string
    name: string
    color: string
    count: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    createdAt: Date
    image: {
      id: string
      name: string
      thumbnail: Uint8Array | null
    } | null
  }>
}

export interface StatsResponse {
  collections: Array<{
    id: string
    name: string
    count: number
    color?: string
    emoji?: string
  }>
  folders: Array<{
    id: string
    name: string
    count: number
  }>
  tags: Array<{
    id: string
    name: string
    count: number
    color: string
  }>
  albums: Array<{
    id: string
    name: string
    count: number
    emoji: string
  }>
  characters: Array<{
    id: string
    name: string
    count: number
    emoji: string
  }>
  places: Array<{
    id: string
    name: string
    count: number
    emoji: string
  }>
  objects: Array<{
    id: string
    name: string
    count: number
    emoji: string
  }>
}

export const getSystemStats = unstable_cache(
  async () => {
    try {
      const [
        totalImages,
        totalFolders,
        totalCollections,
        totalTags,
        totalAlbums,
        totalCharacters,
        totalPlaces,
        totalObjects,
        totalFavorites,
        totalActivities,
        totalSize,
        totalViews,
        totalDownloads,
        topTags,
        recentActivity,
      ] = await Promise.all([
        prisma.image.count(),
        prisma.folder.count(),
        prisma.collection.count(),
        prisma.tag.count(),
        prisma.album.count(),
        prisma.character.count(),
        prisma.place.count(),
        prisma.object.count(),
        prisma.favorite.count(),
        prisma.activity.count(),
        prisma.folder.aggregate({
          _sum: {
            totalSize: true,
          },
        }),
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
        prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            color: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
          orderBy: {
            images: {
              _count: "desc",
            },
          },
          take: 5,
        }),
        prisma.activity.findMany({
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
            image: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        }),
      ]);

      return {
        totalImages,
        totalFolders,
        totalCollections,
        totalTags,
        totalAlbums,
        totalCharacters,
        totalPlaces,
        totalObjects,
        totalFavorites,
        totalActivities,
        totalSize: totalSize._sum.totalSize || 0,
        totalViews: totalViews._sum.views || 0,
        totalDownloads: totalDownloads._sum.downloads || 0,
        topTags: topTags.map((tag) => ({
          ...tag,
          count: tag._count.images,
        })),
        recentActivity,
      } satisfies GeneralStats;
    } catch (error) {
      console.error("Error getting system stats:", error);
      throw new Error("Failed to get system stats");
    }
  },
  ['system-stats'],
  {
    revalidate: STATS_REVALIDATE_SECONDS,
    tags: [STATS_CACHE_TAG],
  }
)

export const getStats = unstable_cache(
  async () => {
    try {
      const [
        collections,
        folders,
        tags,
        albums,
        characters,
        places,
        objects,
      ] = await Promise.all([
        prisma.collection.findMany({
          select: {
            id: true,
            name: true,
            color: true,
            emoji: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.folder.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            color: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.album.findMany({
          select: {
            id: true,
            name: true,
            emoji: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.character.findMany({
          select: {
            id: true,
            name: true,
            emoji: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.place.findMany({
          select: {
            id: true,
            name: true,
            emoji: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
        prisma.object.findMany({
          select: {
            id: true,
            name: true,
            emoji: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
        }),
      ]);

      return {
        collections: collections.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.images,
          color: c.color,
          emoji: c.emoji,
        })),
        folders: folders.map((f) => ({
          id: f.id,
          name: f.name,
          count: f._count.images,
        })),
        tags: tags.map((t) => ({
          id: t.id,
          name: t.name,
          count: t._count.images,
          color: t.color,
        })),
        albums: albums.map((a) => ({
          id: a.id,
          name: a.name,
          count: a._count.images,
          emoji: a.emoji,
        })),
        characters: characters.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.images,
          emoji: c.emoji,
        })),
        places: places.map((p) => ({
          id: p.id,
          name: p.name,
          count: p._count.images,
          emoji: p.emoji,
        })),
        objects: objects.map((o) => ({
          id: o.id,
          name: o.name,
          count: o._count.images,
          emoji: o.emoji,
        })),
      } satisfies StatsResponse;
    } catch (error) {
      console.error("Error getting stats:", error);
      throw new Error("Failed to get stats");
    }
  },
  ['entity-stats'],
  {
    revalidate: STATS_REVALIDATE_SECONDS,
    tags: [STATS_CACHE_TAG],
  }
)

export async function invalidateStats() {
  revalidatePath('/stats')
}

export async function getImageStats(imageId: string) {
  try {
    let stats = await prisma.imageStats.findUnique({
      where: { imageId },
    })

    if (!stats) {
      stats = await prisma.imageStats.create({
        data: {
          imageId,
          views: 0,
          downloads: 0,
          lastViewed: new Date(),
        },
      })
    }

    return stats
  } catch (error) {
    console.error('Error getting image stats:', error)
    throw new Error('Failed to get image stats')
  }
}

export async function incrementImageView(imageId: string) {
  try {
    const stats = await prisma.imageStats.update({
      where: { imageId },
      data: {
        views: { increment: 1 },
        lastViewed: new Date(),
      },
    })

    revalidatePath('/stats')
    return stats
  } catch (error) {
    console.error('Error incrementing image view:', error)
    throw new Error('Failed to increment image view')
  }
}

export async function incrementImageDownload(imageId: string) {
  try {
    const stats = await prisma.imageStats.update({
      where: { imageId },
      data: {
        downloads: { increment: 1 },
      },
    })

    revalidatePath('/stats')
    return stats
  } catch (error) {
    console.error('Error incrementing image download:', error)
    throw new Error('Failed to increment image download')
  }
}

