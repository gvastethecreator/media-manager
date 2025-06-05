'use server';

/**
 * @file Statistics actions for folders
 * @module app/actions/folders/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { FolderStats } from '@/types/entities/folder';
import { revalidateTag, unstable_cache } from 'next/cache';
import { FOLDER_ERROR_CODES } from './folder-types';

// Logger for stats actions
const folderLogger = serverLogger.withContext('FolderStatsActions');

// Cache revalidation time in seconds
const CACHE_REVALIDATE_SECONDS = 30;

// Tags para revalidación
const FOLDER_STATS_TAGS = ['folders', 'folder-stats', 'statistics'];

/**
 * Interfaz para errores de estadísticas de carpetas
 */
export interface FolderStatsErrorData {
	name: string;
	message: string;
	code: string;
	cause?: unknown;
}

/**
 * Función para crear errores de estadísticas de carpetas (enfoque funcional)
 */
function createFolderStatsError(
	message: string,
	code: string = FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
	cause?: unknown
): FolderStatsErrorData {
	return {
		name: 'FolderStatsError',
		message,
		code,
		cause,
	};
}

/**
 * Interface for overall folder statistics response
 */
export interface FolderStatsResponse {
	totalFolders: number;
	totalImages: number;
	totalSize: number;
	statusDistribution: Record<string, number>;
	recentFolders: Array<{
		id: string;
		name: string;
		path: string;
		imageCount: number;
		createdAt: Date;
	}>;
}

/**
 * Interface for folder storage statistics response
 */
export interface FolderStorageStatsResponse {
	totalSize: number;
	topFolders: Array<{
		id: string;
		name: string;
		size: number;
		imageCount: number;
	}>;
}

/**
 * Interface for folder indexing statistics response
 */
export interface FolderIndexingStatsResponse {
	totalIndexed: number;
	pendingReindex: number;
	recentlyIndexed: Array<{
		id: string;
		name: string;
		lastIndexed: Date;
		imageCount: number;
	}>;
	averageIndexTime?: number;
}

/**
 * Gets overall folder statistics
 */
export async function getFolderStats(): Promise<FolderStatsResponse> {
	const getCachedStats = unstable_cache(
		async () => {
			try {
				folderLogger.info('📊 Getting folder statistics');

				const [totalFolders, totalImages, totalSize, foldersByStatus, recentFolders] = await Promise.all([
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

				const stats: FolderStatsResponse = {
					totalFolders,
					totalImages,
					totalSize: totalSize._sum.totalSize || 0,
					statusDistribution: Object.fromEntries(
						foldersByStatus.map((status) => [status.status || 'unknown', status._count])
					),
					recentFolders: recentFolders.map((folder) => ({
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
				throw createFolderStatsError('Failed to get folder statistics', 'STATS_FAILED', error);
			}
		},
		['folder-stats'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: FOLDER_STATS_TAGS,
		}
	);

	return getCachedStats();
}

/**
 * Gets storage usage statistics for folders
 */
export async function getFolderStorageStats(): Promise<FolderStorageStatsResponse> {
	const getCachedStorageStats = unstable_cache(
		async () => {
			try {
				folderLogger.info('💾 Getting folder storage statistics');

				const [totalSize, sizeByFolder, fileTypeDistribution] = await Promise.all([
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

					// Distribución por tipo de archivo (esta consulta es simulada, ajusta según tu esquema)
					prisma.$queryRaw`SELECT
            SUM(CASE WHEN i.mimeType LIKE 'image/%' THEN 1 ELSE 0 END) as images,
            SUM(CASE WHEN i.mimeType LIKE 'video/%' THEN 1 ELSE 0 END) as videos,
            SUM(CASE WHEN i.mimeType NOT LIKE 'image/%' AND i.mimeType NOT LIKE 'video/%' THEN 1 ELSE 0 END) as others
            FROM Image i`,
				]);

				const stats: FolderStorageStatsResponse = {
					totalSize: totalSize._sum.totalSize || 0,
					topFolders: sizeByFolder.map((folder) => ({
						id: folder.id,
						name: folder.name,
						size: folder.totalSize || 0,
						imageCount: folder._count.images,
					})),
				};

				folderLogger.info('✅ Folder storage statistics retrieved successfully');
				return stats;
			} catch (error) {
				folderLogger.error('❌ Error getting folder storage statistics:', error);
				throw createFolderStatsError('Failed to get folder storage statistics', 'STORAGE_STATS_FAILED', error);
			}
		},
		['folder-storage-stats'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: FOLDER_STATS_TAGS,
		}
	);

	return getCachedStorageStats();
}

/**
 * Gets indexing statistics for folders
 */
export async function getFolderIndexingStats(): Promise<FolderIndexingStatsResponse> {
	const getCachedIndexingStats = unstable_cache(
		async () => {
			try {
				folderLogger.info('🔍 Getting folder indexing statistics');

				const [totalIndexed, recentlyIndexed, pendingReindex] = await Promise.all([
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
						include: {
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
								{
									autoReindex: true,
									lastIndexed: {
										lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
									},
								},
							],
						},
					}),
				]);

				const stats: FolderIndexingStatsResponse = {
					totalIndexed,
					pendingReindex,
					recentlyIndexed: recentlyIndexed.map((folder) => ({
						id: folder.id,
						name: folder.name,
						lastIndexed: folder.lastIndexed || new Date(),
						imageCount: folder._count.images,
					})),
				};

				folderLogger.info('✅ Folder indexing statistics retrieved successfully');
				return stats;
			} catch (error) {
				folderLogger.error('❌ Error getting folder indexing statistics:', error);
				throw createFolderStatsError('Failed to get folder indexing statistics', 'INDEXING_STATS_FAILED', error);
			}
		},
		['folder-indexing-stats'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: FOLDER_STATS_TAGS,
		}
	);

	return getCachedIndexingStats();
}

/**
 * Gets detailed statistics for a specific folder
 */
export async function getFolderStatsById(folderId: string): Promise<FolderStats> {
	try {
		folderLogger.info(`📊 Getting statistics for folder ${folderId}`);

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
				images: {
					select: {
						id: true,
						size: true,
						mimeType: true,
						hasMetadata: true,
					},
				},
				videos: {
					select: {
						id: true,
						size: true,
						mimeType: true,
						hasMetadata: true,
					},
				},
			},
		});

		if (!folder) {
			throw createFolderStatsError(`Folder with ID ${folderId} not found`, 'FOLDER_NOT_FOUND');
		}

		// Calcular estadísticas basadas en los datos encontrados
		const totalImagesSize = folder.images.reduce((sum, img) => sum + (img.size || 0), 0);
		const totalVideosSize = folder.videos.reduce((sum, vid) => sum + (vid.size || 0), 0);
		const otherFilesCount = folder.totalFiles
			? folder.totalFiles - (folder._count.images || 0) - (folder._count.videos || 0)
			: 0;
		const otherFilesSize = folder.totalSize ? folder.totalSize - totalImagesSize - totalVideosSize : 0;

		// Estadísticas de metadatos
		const imagesWithMetadata = folder.images.filter((img) => img.hasMetadata).length;
		const videosWithMetadata = folder.videos.filter((vid) => vid.hasMetadata).length;
		const totalWithMetadata = imagesWithMetadata + videosWithMetadata;
		const totalFilesWithPossibleMetadata = folder._count.images + folder._count.videos;

		const folderStats: FolderStats = {
			totalFiles: folder.totalFiles || 0,
			totalSize: folder.totalSize || 0,
			lastIndexed: folder.lastIndexed,

			fileDistribution: {
				images: folder._count.images || 0,
				videos: folder._count.videos || 0,
				other: otherFilesCount,
			},

			sizeDistribution: {
				images: totalImagesSize,
				videos: totalVideosSize,
				other: otherFilesSize,
			},

			metadataStats: {
				processed: totalWithMetadata,
				pending: totalFilesWithPossibleMetadata - totalWithMetadata,
				failed: 0, // No tenemos datos sobre fallos específicos
			},

			processingStats: {
				lastProcessingTime: 0, // No tenemos esta información aún
				averageProcessingTime: 0, // No tenemos esta información aún
				processingStatus: 'idle',
			},
		};

		folderLogger.info(`✅ Statistics for folder ${folderId} retrieved successfully`);
		return folderStats;
	} catch (error) {
		folderLogger.error(`❌ Error getting statistics for folder ${folderId}:`, error);
		throw createFolderStatsError(`Failed to get statistics for folder ${folderId}`, 'FOLDER_STATS_FAILED', error);
	}
}

/**
 * Revalidates all folder statistics caches
 */
export async function revalidateFolderStats(): Promise<void> {
	try {
		folderLogger.info('🔄 Revalidating folder statistics caches');

		// Revalidate all relevant tags
		for (const tag of FOLDER_STATS_TAGS) {
			revalidateTag(tag);
		}

		folderLogger.info('✅ Folder statistics caches revalidated successfully');
	} catch (error) {
		folderLogger.error('❌ Error revalidating folder statistics caches:', error);
		throw createFolderStatsError('Failed to revalidate folder statistics caches', 'REVALIDATION_FAILED', error);
	}
}
