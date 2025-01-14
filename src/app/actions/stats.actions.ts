'use server'

import { prisma } from '@/lib/prisma'

export async function getSystemStats() {
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
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    throw new Error("Failed to get system stats");
  }
}
