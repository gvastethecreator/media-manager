'use server';

/**
 * @file Statistics actions for folders
 * @module app/actions/folders/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { Image, Video } from '@prisma/client'; // Importar tipos de Prisma
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
	// statusDistribution: Record<string, number>; // Eliminado porque Folder no tiene 'status'
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
	// fileTypeDistribution?: Record<string, number>; // Comentado, requiere mimeType en Image
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

				const [totalFolders, totalImages, totalSizeAggregate, recentFolders] = await Promise.all([
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

					// Folders grouped by status - Eliminado porque Folder no tiene 'status'
					// prisma.folder.groupBy({
					// 	by: ['status'],
					// 	_count: true,
					// }),

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
					totalSize: totalSizeAggregate._sum.totalSize || 0,
					// statusDistribution: Object.fromEntries( // Eliminado
					// 	foldersByStatus.map((statusGroup) => [statusGroup.status || 'unknown', statusGroup._count])
					// ),
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

				const [totalSizeAggregate, sizeByFolder /*, rawFileTypeDistribution */] = await Promise.all([
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
					// Comentado porque Image no tiene mimeType y la consulta raw fallaría
					// prisma.$queryRaw`SELECT
          //   SUM(CASE WHEN i.mimeType LIKE 'image/%' THEN 1 ELSE 0 END) as images,
          //   SUM(CASE WHEN i.mimeType LIKE 'video/%' THEN 1 ELSE 0 END) as videos,
          //   SUM(CASE WHEN i.mimeType NOT LIKE 'image/%' AND i.mimeType NOT LIKE 'video/%' THEN 1 ELSE 0 END) as others
          //   FROM Image i`,
				]);

				// let fileTypeDistributionData: Record<string, number> | undefined = undefined;
				// if (rawFileTypeDistribution && Array.isArray(rawFileTypeDistribution) && rawFileTypeDistribution.length > 0) {
				//   const dist = rawFileTypeDistribution[0] as { images: bigint, videos: bigint, others: bigint };
				//   fileTypeDistributionData = {
				//     images: Number(dist.images) || 0,
				//     videos: Number(dist.videos) || 0,
				//     others: Number(dist.others) || 0,
				//   };
				// }


				const stats: FolderStorageStatsResponse = {
					totalSize: totalSizeAggregate._sum.totalSize || 0,
					topFolders: sizeByFolder.map((folder) => ({
						id: folder.id,
						name: folder.name,
						size: folder.totalSize || 0,
						imageCount: folder._count.images,
					})),
					// fileTypeDistribution: fileTypeDistributionData, // Comentado
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
						lastIndexed: folder.lastIndexed || new Date(), // Proporcionar un valor por defecto si es null
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

// Tipos para las imágenes y videos seleccionados en getFolderStatsById
type SelectedImage = Pick<Image, 'id' | 'size' | 'metadata'>;
type SelectedVideo = Pick<Video, 'id' | 'size' | 'metadata'>;

// Interfaz para las estadísticas detalladas de una carpeta
export interface DetailedFolderStats {
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
  fileDistribution: {
    images: number;
    videos: number;
    other: number;
  };
  sizeDistribution: {
    images: number;
    videos: number;
    other: number;
  };
  metadataStats: {
    processed: number;
    pending: number;
    failed: number;
  };
  processingStats: { // Estos campos pueden necesitar más lógica o datos que no están disponibles actualmente
    lastProcessingTime: number;
    averageProcessingTime: number;
    processingStatus: string;
  };
	// Añadir cualquier otro campo que devuelva la función
	id: string;
	name: string;
	path: string;
	// ... otros campos del modelo Folder que se quieran exponer
}


/**
 * Gets detailed statistics for a specific folder
 */
export async function getFolderStatsById(folderId: string): Promise<DetailedFolderStats> {
	try {
		folderLogger.info(`📊 Getting statistics for folder ${folderId}`);

		const folderData = await prisma.folder.findUnique({
			where: { id: folderId },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true, // Mantener si es útil, o quitar si no se usa
					},
				},
				images: {
					select: {
						id: true,
						size: true,
						metadata: true, // Cambiado de hasMetadata a metadata
					},
				},
				videos: {
					select: {
						id: true,
						size: true,
						metadata: true, // Cambiado de hasMetadata a metadata
					},
				},
			},
		});

		if (!folderData) {
			throw createFolderStatsError(`Folder with ID ${folderId} not found`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Calcular estadísticas basadas en los datos encontrados
		const totalImagesSize = folderData.images.reduce((sum: number, img: SelectedImage) => sum + (img.size || 0), 0);
		const totalVideosSize = folderData.videos.reduce((sum: number, vid: SelectedVideo) => sum + (vid.size || 0), 0);

		const numImages = folderData._count?.images || 0;
		const numVideos = folderData._count?.videos || 0;

		const otherFilesCount = (folderData.totalFiles || 0) - numImages - numVideos;
		const otherFilesSize = (folderData.totalSize || 0) - totalImagesSize - totalVideosSize;

		// Estadísticas de metadatos
		const imagesWithMetadata = folderData.images.filter((img: SelectedImage) => img.metadata !== null).length;
		const videosWithMetadata = folderData.videos.filter((vid: SelectedVideo) => vid.metadata !== null).length;
		const totalWithMetadata = imagesWithMetadata + videosWithMetadata;
		const totalFilesWithPossibleMetadata = numImages + numVideos;

		const stats: DetailedFolderStats = {
			id: folderData.id,
			name: folderData.name,
			path: folderData.path,
			totalFiles: folderData.totalFiles || 0,
			totalSize: folderData.totalSize || 0,
			lastIndexed: folderData.lastIndexed,

			fileDistribution: {
				images: numImages,
				videos: numVideos,
				other: otherFilesCount < 0 ? 0 : otherFilesCount, // Asegurar que no sea negativo
			},

			sizeDistribution: {
				images: totalImagesSize,
				videos: totalVideosSize,
				other: otherFilesSize < 0 ? 0 : otherFilesSize, // Asegurar que no sea negativo
			},

			metadataStats: {
				processed: totalWithMetadata,
				pending: totalFilesWithPossibleMetadata - totalWithMetadata,
				failed: 0, // No tenemos datos sobre fallos específicos
			},

			processingStats: {
				lastProcessingTime: 0, // No tenemos esta información aún
				averageProcessingTime: 0, // No tenemos esta información aún
				processingStatus: 'idle', // Asumir idle si no hay más info
			},
		};

		folderLogger.info(`✅ Statistics for folder ${folderId} retrieved successfully`);
		return stats;
	} catch (error) {
		folderLogger.error(`❌ Error getting statistics for folder ${folderId}:`, error);
		if (error instanceof Error && (error as FolderStatsErrorData).code === FOLDER_ERROR_CODES.NOT_FOUND) {
			throw error;
		}
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
