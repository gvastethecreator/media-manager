'use server';

/**
 * @file Servicio para la entidad Video
 * @module services/video/video.service
 * @description Lógica de negocio y acceso a datos para los videos.
 */

import { db } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { fromPrismaVideosWithCounts, fromPrismaVideoWithCounts } from '@/transformers/video/transformer';
import type {
	VideoCreateInput,
	VideoFilters,
	VideoPaginationOptions,
	VideoStats,
	VideoUpdateInput,
	VideoWithStats,
} from '@/types/entities/video';
import { revalidatePath } from '@/lib/server/revalidate';

const logger = serverLogger.withContext('VideoService');

/**
 * Revalida las rutas de caché relacionadas con los videos.
 * @param videoId - El ID del video específico para revalidar su página.
 */
async function revalidateVideoPaths(videoId?: string) {
	revalidatePath('/videos');
	revalidatePath('/gallery');
	if (videoId) {
		revalidatePath(`/videos/${videoId}`);
	}
}

/**
 * Obtiene un video por su ID con estadísticas calculadas
 * @param id ID del video
 * @returns Video con estadísticas o null
 */
export async function getVideo(id: string): Promise<VideoWithStats | null> {
	try {
		logger.info('🔍 Buscando video por ID', { id });

		const video = await db.video.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!video) {
			logger.warn('❌ Video no encontrado', { id });
			return null;
		}

		const transformedVideo = fromPrismaVideoWithCounts(video);
		logger.info('✅ Video obtenido y transformado', {
			id,
			name: transformedVideo.name,
			qualityScore: transformedVideo.statistics.qualityScore,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al obtener video', { id, error });
		throw error;
	}
}

/**
 * Busca videos con filtros avanzados y paginación
 * @param options Opciones de búsqueda y paginación
 * @returns Videos con estadísticas
 */
export async function findVideos(
	options: { filters?: VideoFilters; pagination?: VideoPaginationOptions } = {}
): Promise<VideoWithStats[]> {
	try {
		const { filters = {}, pagination = {} } = options;
		logger.info('🔍 Buscando videos con filtros', { filters, pagination });

		// Construir where clause
		const where: any = {};

		if (filters.search) {
			where.OR = [{ name: { contains: filters.search } }, { description: { contains: filters.search } }];
		}

		if (filters.folders && filters.folders.length > 0) {
			where.folderId = { in: filters.folders };
		}

		if (filters.isFavorite !== undefined) {
			where.isFavorite = filters.isFavorite;
		}

		if (filters.isPublic !== undefined) {
			where.isPublic = filters.isPublic;
		}

		if (filters.minDuration || filters.maxDuration) {
			where.duration = {};
			if (filters.minDuration) where.duration.gte = filters.minDuration;
			if (filters.maxDuration) where.duration.lte = filters.maxDuration;
		}

		if (filters.minSize || filters.maxSize) {
			where.size = {};
			if (filters.minSize) where.size.gte = filters.minSize;
			if (filters.maxSize) where.size.lte = filters.maxSize;
		}

		if (filters.minWidth || filters.maxWidth) {
			where.width = {};
			if (filters.minWidth) where.width.gte = filters.minWidth;
			if (filters.maxWidth) where.width.lte = filters.maxWidth;
		}

		if (filters.minHeight || filters.maxHeight) {
			where.height = {};
			if (filters.minHeight) where.height.gte = filters.minHeight;
			if (filters.maxHeight) where.height.lte = filters.maxHeight;
		}

		if (filters.hasMetadata !== undefined) {
			where.metadata = filters.hasMetadata ? { not: null } : null;
		}

		if (filters.hasThumbnail !== undefined) {
			where.thumbnail = filters.hasThumbnail ? { not: null } : null;
		}

		if (filters.dateRange?.start || filters.dateRange?.end) {
			where.createdAt = {};
			if (filters.dateRange.start) where.createdAt.gte = filters.dateRange.start;
			if (filters.dateRange.end) where.createdAt.lte = filters.dateRange.end;
		}

		// Construir orderBy
		let orderBy: any = { createdAt: 'desc' }; // Default
		if (pagination.sortBy) {
			const [field, direction] = pagination.sortBy.split(':');
			orderBy = { [field]: direction || 'asc' };
		}

		// Ejecutar consulta optimizada
		const videos = await db.video.findMany({
			where,
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
			orderBy,
			take: pagination.limit || 50,
			skip: pagination.page ? (pagination.page - 1) * (pagination.limit || 50) : 0,
		});

		const transformedVideos = fromPrismaVideosWithCounts(videos);

		logger.info('✅ Videos encontrados y transformados', {
			count: transformedVideos.length,
			avgQualityScore:
				transformedVideos.reduce((sum, v) => sum + v.statistics.qualityScore, 0) / transformedVideos.length,
		});

		return transformedVideos;
	} catch (error) {
		logger.error('❌ Error al buscar videos', { error });
		throw error;
	}
}

/**
 * Crea un nuevo video
 * @param data Datos del video a crear
 * @returns Video creado con estadísticas
 */
export async function createVideo(data: VideoCreateInput): Promise<VideoWithStats> {
	try {
		logger.info('➕ Creando nuevo video', { name: data.name });

		const video = await db.video.create({
			data: {
				...data,
				// Asegurar valores por defecto
				isFavorite: data.isFavorite ?? false,
				isPublic: data.isPublic ?? false,
			},
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		await revalidateVideoPaths();
		const transformedVideo = fromPrismaVideoWithCounts(video);

		logger.info('✅ Video creado exitosamente', {
			id: transformedVideo.id,
			name: transformedVideo.name,
			qualityScore: transformedVideo.statistics.qualityScore,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al crear video', { error, data });
		throw error;
	}
}

/**
 * Actualiza un video existente
 * @param id ID del video a actualizar
 * @param data Datos para actualizar el video
 * @returns Video actualizado con estadísticas
 */
export async function updateVideo(id: string, data: VideoUpdateInput): Promise<VideoWithStats> {
	try {
		logger.info('🔄 Actualizando video', { id, data });

		const video = await db.video.update({
			where: { id },
			data,
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		await revalidateVideoPaths(id);
		const transformedVideo = fromPrismaVideoWithCounts(video);

		logger.info('✅ Video actualizado exitosamente', {
			id: transformedVideo.id,
			name: transformedVideo.name,
			qualityScore: transformedVideo.statistics.qualityScore,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al actualizar video', { id, error, data });
		throw error;
	}
}

/**
 * Elimina un video
 * @param id ID del video a eliminar
 * @returns true si se eliminó exitosamente
 */
export async function deleteVideo(id: string): Promise<boolean> {
	try {
		logger.warn('🗑️ Eliminando video', { id });

		await db.video.delete({
			where: { id },
		});

		await revalidateVideoPaths();
		logger.info('✅ Video eliminado exitosamente', { id });

		return true;
	} catch (error) {
		logger.error('❌ Error al eliminar video', { id, error });
		throw error;
	}
}

/**
 * Alterna el estado de favorito de un video
 * @param id ID del video
 * @param isFavorite Nuevo estado de favorito
 * @returns Video actualizado con estadísticas
 */
export async function toggleVideoFavorite(id: string, isFavorite: boolean): Promise<VideoWithStats> {
	try {
		logger.info('⭐ Alternando favorito de video', { id, isFavorite });

		const video = await db.video.update({
			where: { id },
			data: { isFavorite },
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		await revalidateVideoPaths(id);
		const transformedVideo = fromPrismaVideoWithCounts(video);

		logger.info('✅ Estado de favorito actualizado', {
			id: transformedVideo.id,
			isFavorite: transformedVideo.isFavorite,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al alternar favorito', { id, error });
		throw error;
	}
}

/**
 * Establece la visibilidad de un video
 * @param id ID del video
 * @param isPublic Nuevo estado de visibilidad
 * @returns Video actualizado con estadísticas
 */
export async function setVideoVisibility(id: string, isPublic: boolean): Promise<VideoWithStats> {
	try {
		logger.info('👁️ Cambiando visibilidad de video', { id, isPublic });

		const video = await db.video.update({
			where: { id },
			data: { isPublic },
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		await revalidateVideoPaths(id);
		const transformedVideo = fromPrismaVideoWithCounts(video);

		logger.info('✅ Visibilidad actualizada', {
			id: transformedVideo.id,
			isPublic: transformedVideo.isPublic,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al cambiar visibilidad', { id, error });
		throw error;
	}
}

/**
 * Mueve un video a una carpeta
 * @param id ID del video
 * @param folderId ID de la carpeta destino
 * @returns Video actualizado con estadísticas
 */
export async function moveVideoToFolder(id: string, folderId: string): Promise<VideoWithStats> {
	try {
		logger.info('📁 Moviendo video a carpeta', { id, folderId });

		const video = await db.video.update({
			where: { id },
			data: { folderId },
			include: {
				_count: {
					select: {
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		await revalidateVideoPaths(id);
		const transformedVideo = fromPrismaVideoWithCounts(video);

		logger.info('✅ Video movido a carpeta', {
			id: transformedVideo.id,
			folderId: transformedVideo.folderId,
		});

		return transformedVideo;
	} catch (error) {
		logger.error('❌ Error al mover video', { id, folderId, error });
		throw error;
	}
}

/**
 * Obtiene estadísticas generales de videos
 * @returns Estadísticas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	try {
		logger.info('📊 Obteniendo estadísticas de videos');

		const [total, favorites, public_, withThumbnail, withMetadata, totalSize, avgDuration] = await Promise.all([
			db.video.count(),
			db.video.count({ where: { isFavorite: true } }),
			db.video.count({ where: { isPublic: true } }),
			db.video.count({ where: { thumbnail: { not: null } } }),
			db.video.count({ where: { metadata: { not: null } } }),
			db.video.aggregate({ _sum: { size: true } }),
			db.video.aggregate({ _avg: { duration: true } }),
		]);

		const stats: VideoStats = {
			total,
			favorites,
			public: public_,
			withThumbnail,
			withMetadata,
			totalSize: totalSize._sum.size || 0,
			avgDuration: avgDuration._avg.duration || 0,
		};

		logger.info('✅ Estadísticas obtenidas', stats);
		return stats;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas', { error });
		throw error;
	}
}

// Exportar el servicio como objeto para mantener consistencia
export const videoService = {
	getVideo,
	findVideos,
	createVideo,
	updateVideo,
	deleteVideo,
	toggleVideoFavorite,
	setVideoVisibility,
	moveVideoToFolder,
	getVideoStats,
};
