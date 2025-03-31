'use server';

/**
 * @file Statistics actions for folders
 * @module app/actions/folders/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Logger for stats actions
const folderLogger = serverLogger.withContext('FolderStatsActions');

// Cache revalidation time in seconds
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Custom error for folder statistics operations
 */
class FolderStatsError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'FolderStatsError';
  }
}

/**
 * Gets overall folder statistics
 */
export async function getFolderStats() {
  const getCachedStats = unstable_cache(
    async () => {
      try {
        folderLogger.info('📊 Getting folder statistics');

        const [
          totalFolders,
          totalImages,
          totalSize,
          foldersByStatus,
          recentFolders,
        ] = await Promise.all([
          // Total folders count
          prisma.folder.count(),

          // Total images count
          prisma.image.count(),

          // Total size of all folders
          prisma.folder.aggregate({
            _sum: {
              totalSize: true,
            },
          }),

          // Folders grouped by status
          prisma.folder.groupBy({
            by: ['status'],
            _count: true,
          }),

          // Recent folders
          prisma.folder.findMany({
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              _count: {
                select: {
                  images: true,
                },
              },
            },
          }),
        ]);

        const stats = {
          totalFolders,
          totalImages,
          totalSize: totalSize._sum.totalSize || 0,
          statusDistribution: Object.fromEntries(
            foldersByStatus.map(status => [
              status.status,
              status._count,
            ])
          ),
          recentFolders: recentFolders.map(folder => ({
            id: folder.id,
            name: folder.name,
            path: folder.path,
            imageCount: folder._count.images,
            createdAt: folder.createdAt,
          })),
        };

        folderLogger.info('✅ Folder statistics retrieved successfully');
        return stats;
      } catch (error) {
        folderLogger.error('❌ Error getting folder statistics:', error);
        throw new FolderStatsError('Failed to get folder statistics', 'STATS_FAILED', error);
      }
    },
    ['folder-stats'],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ['folders'],
    }
  );

  return getCachedStats();
}

/**
 * Gets storage usage statistics for folders
 */
export async function getFolderStorageStats() {
  const getCachedStorageStats = unstable_cache(
    async () => {
      try {
        folderLogger.info('💾 Getting folder storage statistics');

        const [
          totalSize,
          sizeByFolder,
        ] = await Promise.all([
          // Total size across all folders
          prisma.folder.aggregate({
            _sum: {
              totalSize: true,
            },
          }),

          // Size distribution by folder
          prisma.folder.findMany({
            select: {
              id: true,
              name: true,
              totalSize: true,
              _count: {
                select: {
                  images: true,
                },
              },
            },
            orderBy: {
              totalSize: 'desc',
            },
            take: 10,
          }),
        ]);

        const stats = {
          totalSize: totalSize._sum.totalSize || 0,
          topFolders: sizeByFolder.map(folder => ({
            id: folder.id,
            name: folder.name,
            size: folder.totalSize,
            imageCount: folder._count.images,
          })),
        };

        folderLogger.info('✅ Folder storage statistics retrieved successfully');
        return stats;
      } catch (error) {
        folderLogger.error('❌ Error getting folder storage statistics:', error);
        throw new FolderStatsError('Failed to get folder storage statistics', 'STORAGE_STATS_FAILED', error);
      }
    },
    ['folder-storage-stats'],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ['folders'],
    }
  );

  return getCachedStorageStats();
}

/**
 * Gets indexing statistics for folders
 */
export async function getFolderIndexingStats() {
  const getCachedIndexingStats = unstable_cache(
    async () => {
      try {
        folderLogger.info('🔍 Getting folder indexing statistics');

        const [
          totalIndexed,
          recentlyIndexed,
          pendingReindex,
        ] = await Promise.all([
          // Total indexed folders
          prisma.folder.count({
            where: {
              lastIndexed: {
                not: null,
              },
            },
          }),

          // Recently indexed folders
          prisma.folder.findMany({
            where: {
              lastIndexed: {
                not: null,
              },
            },
            orderBy: {
              lastIndexed: 'desc',
            },
            take: 5,
            select: {
              id: true,
              name: true,
              lastIndexed: true,
              totalFiles: true,
              _count: {
                select: {
                  images: true,
                },
              },
            },
          }),

          // Folders pending reindex
          prisma.folder.count({
            where: {
              OR: [
                { lastIndexed: null },
                { autoReindex: true },
              ],
            },
          }),
        ]);

        const stats = {
          totalIndexed,
          pendingReindex,
          recentlyIndexed: recentlyIndexed.map(folder => ({
            id: folder.id,
            name: folder.name,
            lastIndexed: folder.lastIndexed,
            totalFiles: folder.totalFiles,
            imageCount: folder._count.images,
          })),
        };

        folderLogger.info('✅ Folder indexing statistics retrieved successfully');
        return stats;
      } catch (error) {
        folderLogger.error('❌ Error getting folder indexing statistics:', error);
        throw new FolderStatsError('Failed to get folder indexing statistics', 'INDEXING_STATS_FAILED', error);
      }
    },
    ['folder-indexing-stats'],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ['folders'],
    }
  );

  return getCachedIndexingStats();
}