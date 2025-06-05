/**
 * @file Servicio para gestión de videos
 * @module services/video
 * @description Implementación del servicio de gestión de videos
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformVideo, transformVideos } from '@/transformers/video';
import type {
	CreateVideoInput,
	PaginatedVideos,
	UpdateVideoInput,
	VideoExtended,
	VideoFilters,
	VideoPaginationOptions,
	VideoStats,
} from '@/types/entities/video/types';
import { getPaginationInfo } from '@/utils/pagination';
import type { Prisma } from '@prisma/client';

// Logger específico para el servicio
const logger = serverLogger.withContext('VideoService');

/**
 * Clase de error personalizada para operaciones de Video
 */
export class VideoServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'VideoServiceError';
	}
}

/**
 * Crea un nuevo video
 * @param data - Datos para la creación del video
 * @returns El video creado y transformado
 */
export async function createVideo(data: CreateVideoInput): Promise<VideoExtended> {
	try {
		logger.info('🎬 Creando nuevo video:', { name: data.name });

		const video = await prisma.video.create({
			data: {
				name: data.name,
				description: data.description || null,
				path: data.path,
				hash: data.hash,
				size: data.size,
				duration: data.duration,
				width: data.width || null,
				height: data.height || null,
				metadata: data.metadata || null,
				thumbnail: data.thumbnail || null,
				thumbnailSize: data.thumbnailSize || null,
				thumbnailWidth: data.thumbnailWidth || null,
				thumbnailHeight: data.thumbnailHeight || null,
				isPublic: data.isPublic || false,
				isFavorite: data.isFavorite || false,
				folder: {
					connect: {
						id: data.folderId,
					},
				},
			},
		});

		logger.info('✅ Video creado:', { id: video.id, name: video.name });
		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al crear video:', error);
		throw new VideoServiceError('No se pudo crear el video', 'CREATE_FAILED', error);
	}
}

/**
 * Actualiza un video existente
 * @param id - ID del video a actualizar
 * @param data - Datos para actualizar
 * @returns El video actualizado y transformado
 */
export async function updateVideo(id: string, data: UpdateVideoInput): Promise<VideoExtended> {
	try {
		logger.info('📝 Actualizando video:', { id, name: data.name });

		// Verificar que el video existe
		const existingVideo = await prisma.video.findUnique({
			where: { id },
		});

		if (!existingVideo) {
			throw new VideoServiceError('Video no encontrado', 'NOT_FOUND');
		}

		// Preparar datos de actualización
		const updateData = {};

		// Solo actualizar los campos proporcionados
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.path !== undefined) updateData.path = data.path;
		if (data.hash !== undefined) updateData.hash = data.hash;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.duration !== undefined) updateData.duration = data.duration;
		if (data.width !== undefined) updateData.width = data.width;
		if (data.height !== undefined) updateData.height = data.height;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;
		if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
		if (data.thumbnailSize !== undefined) updateData.thumbnailSize = data.thumbnailSize;
		if (data.thumbnailWidth !== undefined) updateData.thumbnailWidth = data.thumbnailWidth;
		if (data.thumbnailHeight !== undefined) updateData.thumbnailHeight = data.thumbnailHeight;
		if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Actualizar relación con folder si se proporciona
		if (data.folderId !== undefined) {
			updateData.folder = {
				connect: {
					id: data.folderId,
				},
			};
		}

		// Actualizar el video
		const video = await prisma.video.update({
			where: { id },
			data: updateData,
		});

		logger.info('✅ Video actualizado:', { id, name: video.name });
		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al actualizar video:', { id, error });
		throw new VideoServiceError('No se pudo actualizar el video', 'UPDATE_FAILED', error);
	}
}

/**
 * Obtiene un video por ID
 * @param id - ID del video a obtener
 * @param includeRelations - Si se deben incluir relaciones
 * @returns El video transformado o null si no existe
 */
export async function getVideoById(id: string, includeRelations = false): Promise<VideoExtended | null> {
	try {
		logger.info('🔍 Buscando video por ID:', { id });

		const video = await prisma.video.findUnique({
			where: { id },
			include: includeRelations
				? {
						folder: true,
						tags: true,
						albums: true,
						collections: true,
					}
				: undefined,
		});

		if (!video) {
			logger.info('⚠️ Video no encontrado:', { id });
			return null;
		}

		logger.info('✅ Video encontrado:', { id, name: video.name });
		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al buscar video:', { id, error });
		throw new VideoServiceError('Error al buscar video', 'FETCH_FAILED', error);
	}
}

/**
 * Elimina un video
 * @param id - ID del video a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteVideo(id: string): Promise<boolean> {
	try {
		logger.info('🗑️ Eliminando video:', { id });

		// Verificar que el video existe
		const existingVideo = await prisma.video.findUnique({
			where: { id },
		});

		if (!existingVideo) {
			throw new VideoServiceError('Video no encontrado', 'NOT_FOUND');
		}

		// Eliminar el video
		await prisma.video.delete({
			where: { id },
		});

		logger.info('✅ Video eliminado:', { id });
		return true;
	} catch (error) {
		logger.error('❌ Error al eliminar video:', { id, error });
		throw new VideoServiceError('No se pudo eliminar el video', 'DELETE_FAILED', error);
	}
}

/**
 * Busca videos con filtros y paginación
 * @param filters - Filtros de búsqueda
 * @param pagination - Opciones de paginación
 * @returns Resultado paginado de videos
 */
export async function findVideos(
	filters: VideoFilters = {},
	pagination: VideoPaginationOptions = {}
): Promise<PaginatedVideos> {
	try {
		logger.info('🔍 Buscando videos:', { filters, pagination });

		// Configurar opciones de paginación
		const page = pagination.page || 1;
		const limit = pagination.limit || 10;
		const skip = (page - 1) * limit;
		const sortBy = pagination.sortBy || 'createdAt';
		const sortDirection = pagination.sortDirection || 'desc';

		// Construir condiciones de filtro
		const where: Prisma.VideoWhereInput = {};

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		if (filters.folderId) {
			where.folderId = filters.folderId;
		}

		if (filters.isPublic !== undefined) {
			where.isPublic = filters.isPublic;
		}

		if (filters.isFavorite !== undefined) {
			where.isFavorite = filters.isFavorite;
		}

		if (filters.minDuration !== undefined) {
			where.duration = {
				...where.duration,
				gte: filters.minDuration,
			};
		}

		if (filters.maxDuration !== undefined) {
			where.duration = {
				...where.duration,
				lte: filters.maxDuration,
			};
		}

		if (filters.minSize !== undefined) {
			where.size = {
				...where.size,
				gte: filters.minSize,
			};
		}

		if (filters.maxSize !== undefined) {
			where.size = {
				...where.size,
				lte: filters.maxSize,
			};
		}

		if (filters.minCreatedAt !== undefined) {
			where.createdAt = {
				...where.createdAt,
				gte: new Date(filters.minCreatedAt),
			};
		}

		if (filters.maxCreatedAt !== undefined) {
			where.createdAt = {
				...where.createdAt,
				lte: new Date(filters.maxCreatedAt),
			};
		}

		if (filters.minUpdatedAt !== undefined) {
			where.updatedAt = {
				...where.updatedAt,
				gte: new Date(filters.minUpdatedAt),
			};
		}

		if (filters.maxUpdatedAt !== undefined) {
			where.updatedAt = {
				...where.updatedAt,
				lte: new Date(filters.maxUpdatedAt),
			};
		}

		// Realizar consulta para obtener total
		const totalVideos = await prisma.video.count({ where });

		// Realizar consulta principal para obtener videos
		const videos = await prisma.video.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortDirection,
			},
			include: {
				folder: true,
				tags: true,
				albums: true,
				collections: true,
			},
		});

		const transformedVideos = transformVideos(videos);
		const paginationInfo = getPaginationInfo(totalVideos, page, limit);

		logger.info('✅ Videos encontrados:', {
			count: videos.length,
			totalVideos,
			page,
			totalPages: paginationInfo.totalPages,
		});

		return {
			data: transformedVideos,
			pagination: paginationInfo,
		};
	} catch (error) {
		logger.error('❌ Error al buscar videos:', error);
		throw new VideoServiceError('Error al buscar videos', 'SEARCH_FAILED', error);
	}
}

/**
 * Obtiene estadísticas de videos
 * @returns Estadísticas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	try {
		logger.info('📊 Obteniendo estadísticas de videos');

		const [
			totalCount,
			totalPublicCount,
			totalPrivateCount,
			totalFavoritesCount,
			totalSize,
			totalDuration,
			oldestVideo,
			newestVideo,
			longestVideo,
			shortestVideo,
			largestVideo,
			smallestVideo,
			byFolderCount,
			byMonthCount,
		] = await Promise.all([
			// Total de videos
			prisma.video.count(),

			// Videos públicos
			prisma.video.count({
				where: { isPublic: true },
			}),

			// Videos privados
			prisma.video.count({
				where: { isPublic: false },
			}),

			// Videos favoritos
			prisma.video.count({
				where: { isFavorite: true },
			}),

			// Tamaño total
			prisma.video.aggregate({
				_sum: { size: true },
			}),

			// Duración total
			prisma.video.aggregate({
				_sum: { duration: true },
			}),

			// Video más antiguo
			prisma.video.findFirst({
				orderBy: { createdAt: 'asc' },
				select: { id: true, name: true, createdAt: true },
			}),

			// Video más reciente
			prisma.video.findFirst({
				orderBy: { createdAt: 'desc' },
				select: { id: true, name: true, createdAt: true },
			}),

			// Video más largo
			prisma.video.findFirst({
				orderBy: { duration: 'desc' },
				select: { id: true, name: true, duration: true },
			}),

			// Video más corto (con duración mayor a 0)
			prisma.video.findFirst({
				where: { duration: { gt: 0 } },
				orderBy: { duration: 'asc' },
				select: { id: true, name: true, duration: true },
			}),

			// Video más grande
			prisma.video.findFirst({
				orderBy: { size: 'desc' },
				select: { id: true, name: true, size: true },
			}),

			// Video más pequeño (con tamaño mayor a 0)
			prisma.video.findFirst({
				where: { size: { gt: 0 } },
				orderBy: { size: 'asc' },
				select: { id: true, name: true, size: true },
			}),

			// Videos por carpeta
			prisma.folder.findMany({
				select: {
					id: true,
					name: true,
					_count: {
						select: { videos: true },
					},
				},
				where: {
					videos: {
						some: {},
					},
				},
				orderBy: {
					name: 'asc',
				},
			}),

			// Videos por mes
			prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM "Video"
        GROUP BY month
        ORDER BY month DESC
      `,
		]);

		const stats: VideoStats = {
			totalCount,
			totalPublicCount,
			totalPrivateCount,
			totalFavoritesCount,
			totalSize: totalSize._sum.size || 0,
			totalDuration: totalDuration._sum.duration || 0,
			oldestVideo: oldestVideo
				? {
						id: oldestVideo.id,
						name: oldestVideo.name,
						date: oldestVideo.createdAt,
					}
				: null,
			newestVideo: newestVideo
				? {
						id: newestVideo.id,
						name: newestVideo.name,
						date: newestVideo.createdAt,
					}
				: null,
			longestVideo: longestVideo
				? {
						id: longestVideo.id,
						name: longestVideo.name,
						duration: longestVideo.duration,
					}
				: null,
			shortestVideo: shortestVideo
				? {
						id: shortestVideo.id,
						name: shortestVideo.name,
						duration: shortestVideo.duration,
					}
				: null,
			largestVideo: largestVideo
				? {
						id: largestVideo.id,
						name: largestVideo.name,
						size: largestVideo.size,
					}
				: null,
			smallestVideo: smallestVideo
				? {
						id: smallestVideo.id,
						name: smallestVideo.name,
						size: smallestVideo.size,
					}
				: null,
			byFolder: byFolderCount.map((folder) => ({
				id: folder.id,
				name: folder.name,
				count: folder._count.videos,
			})),
			byMonth: byMonthCount.map((record) => ({
				date: record.month,
				count: Number(record.count),
			})),
		};

		logger.info('✅ Estadísticas de videos obtenidas');
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas de videos:', error);
		throw new VideoServiceError('Error al obtener estadísticas', 'STATS_FAILED', error);
	}
}

/**
 * Marca/desmarca un video como favorito
 * @param id - ID del video
 * @param isFavorite - Si debe marcarse como favorito
 * @returns El video actualizado
 */
export async function toggleVideoFavorite(id: string, isFavorite: boolean): Promise<VideoExtended> {
	try {
		logger.info(`${isFavorite ? '⭐' : '✖️'} ${isFavorite ? 'Marcando' : 'Desmarcando'} video como favorito:`, { id });

		const video = await prisma.video.update({
			where: { id },
			data: { isFavorite },
		});

		logger.info('✅ Preferencia de favorito actualizada:', { id, isFavorite });
		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al actualizar preferencia de favorito:', { id, error });
		throw new VideoServiceError('No se pudo actualizar preferencia de favorito', 'FAVORITE_TOGGLE_FAILED', error);
	}
}

/**
 * Establece la visibilidad de un video
 * @param id - ID del video
 * @param isPublic - Si debe ser público
 * @returns El video actualizado
 */
export async function setVideoVisibility(id: string, isPublic: boolean): Promise<VideoExtended> {
	try {
		logger.info(`🔒/🔓 Cambiando visibilidad del video a ${isPublic ? 'público' : 'privado'}:`, { id });

		const video = await prisma.video.update({
			where: { id },
			data: { isPublic },
		});

		logger.info('✅ Visibilidad actualizada:', { id, isPublic });
		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al actualizar visibilidad:', { id, error });
		throw new VideoServiceError('No se pudo actualizar visibilidad', 'VISIBILITY_UPDATE_FAILED', error);
	}
}

/**
 * Mueve un video a otra carpeta
 * @param id - ID del video
 * @param folderId - ID de la carpeta destino
 * @returns El video actualizado
 */
export async function moveVideoToFolder(id: string, folderId: string): Promise<VideoExtended> {
	try {
		logger.info('📂 Moviendo video a otra carpeta:', { id, folderId });

		// Verificar que la carpeta existe
		const folderExists = await prisma.folder.findUnique({
			where: { id: folderId },
		});

		if (!folderExists) {
			throw new VideoServiceError('Carpeta destino no encontrada', 'FOLDER_NOT_FOUND');
		}

		const video = await prisma.video.update({
			where: { id },
			data: {
				folder: {
					connect: { id: folderId },
				},
			},
			include: {
				folder: true,
			},
		});

		logger.info('✅ Video movido a nueva carpeta:', {
			id,
			folderId,
			folderName: video.folder.name,
		});

		return transformVideo(video);
	} catch (error) {
		logger.error('❌ Error al mover video:', { id, folderId, error });
		throw new VideoServiceError('No se pudo mover el video', 'MOVE_FAILED', error);
	}
}
