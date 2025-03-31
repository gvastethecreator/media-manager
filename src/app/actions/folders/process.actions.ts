'use server';

/**
 * @file Process actions for folders
 * @module app/actions/folders/process.actions
 */

import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type ProcessStatus } from '@/types/process';
import { revalidatePath } from 'next/cache';

// Logger for process actions
const folderLogger = serverLogger.withContext('FolderProcessActions');

// Paths to revalidate when folder content changes
const REVALIDATE_PATHS = [
  '/folders',
  '/images',
  '/dashboard',
  '/api/folders',
  '/api/images',
];

/**
 * Revalidates all folder-related paths
 */
async function revalidateFolderPaths() {
  folderLogger.info('🔄 Revalidating folder paths');
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

/**
 * Custom error for folder processing operations
 */
class FolderProcessError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'FolderProcessError';
  }
}

/**
 * Indexes a folder and updates its content in the database
 */
export async function indexFolder(id: string): Promise<ProcessStatus> {
  try {
    folderLogger.info('📂 Starting folder indexing:', id);

    // Get folder
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new FolderProcessError('Folder not found', 'FOLDER_NOT_FOUND');
    }

    // Scan folder contents
    const scanResult = await scanFolder(folder.path);

    // Update folder with scan results
    await prisma.folder.update({
      where: { id },
      data: {
        lastIndexed: new Date(),
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        status: 'INDEXED',
      },
    });

    // Process found images
    for (const imagePath of scanResult.images) {
      await prisma.image.upsert({
        where: { path: imagePath },
        create: {
          path: imagePath,
          name: imagePath.split('/').pop() || '',
          folderId: folder.id,
          status: 'PENDING',
        },
        update: {
          folderId: folder.id,
          status: 'PENDING',
        },
      });
    }

    await revalidateFolderPaths();

    folderLogger.info('✅ Folder indexed successfully:', {
      id,
      totalFiles: scanResult.totalFiles,
      totalImages: scanResult.images.length,
    });

    return {
      success: true,
      message: `Folder indexed successfully. Found ${scanResult.totalFiles} files and ${scanResult.images.length} images.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error indexing folder:', error);
    throw new FolderProcessError('Failed to index folder', 'INDEX_FAILED', error);
  }
}

/**
 * Reindexes all folders marked for auto-reindexing
 */
export async function reindexAutoFolders(): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔄 Starting auto-reindex of folders');

    const folders = await prisma.folder.findMany({
      where: {
        autoReindex: true,
      },
    });

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const folder of folders) {
      try {
        await indexFolder(folder.id);
        totalSuccess++;
      } catch (error) {
        totalErrors++;
        folderLogger.error('❌ Error reindexing folder:', {
          folderId: folder.id,
          error,
        });
      }
      totalProcessed++;
    }

    await revalidateFolderPaths();

    folderLogger.info('✅ Auto-reindex completed:', {
      totalProcessed,
      totalSuccess,
      totalErrors,
    });

    return {
      success: true,
      message: `Auto-reindex completed. Processed ${totalProcessed} folders: ${totalSuccess} successful, ${totalErrors} failed.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error during auto-reindex:', error);
    throw new FolderProcessError('Failed to auto-reindex folders', 'AUTO_REINDEX_FAILED', error);
  }
}

/**
 * Validates a folder path exists and is accessible
 */
export async function validateFolderPath(path: string): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔍 Validating folder path:', path);

    const scanResult = await scanFolder(path);

    folderLogger.info('✅ Folder path validated:', {
      path,
      accessible: true,
      totalFiles: scanResult.totalFiles,
    });

    return {
      success: true,
      message: `Folder is accessible and contains ${scanResult.totalFiles} files.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error validating folder path:', error);
    throw new FolderProcessError('Failed to validate folder path', 'VALIDATION_FAILED', error);
  }
}

/**
 * Repairs folder statistics and relationships
 */
export async function repairFolder(id: string): Promise<ProcessStatus> {
  try {
    folderLogger.info('🔧 Starting folder repair:', id);

    // Get folder
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!folder) {
      throw new FolderProcessError('Folder not found', 'FOLDER_NOT_FOUND');
    }

    // Scan folder contents
    const scanResult = await scanFolder(folder.path);

    // Update folder statistics
    await prisma.folder.update({
      where: { id },
      data: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
        status: 'ACTIVE',
      },
    });

    // Remove images that no longer exist
    const existingPaths = new Set(scanResult.images);
    const removedImages = folder.images.filter(img => !existingPaths.has(img.path));

    if (removedImages.length > 0) {
      await prisma.image.deleteMany({
        where: {
          id: {
            in: removedImages.map(img => img.id),
          },
        },
      });
    }

    await revalidateFolderPaths();

    folderLogger.info('✅ Folder repaired successfully:', {
      id,
      removedImages: removedImages.length,
      updatedStats: {
        totalFiles: scanResult.totalFiles,
        totalSize: scanResult.totalSize,
      },
    });

    return {
      success: true,
      message: `Folder repaired successfully. Removed ${removedImages.length} invalid images and updated statistics.`,
    };
  } catch (error) {
    folderLogger.error('❌ Error repairing folder:', error);
    throw new FolderProcessError('Failed to repair folder', 'REPAIR_FAILED', error);
  }
}