"use server";

/**
 * @file Acciones del servidor para gestionar videos
 * @module app/actions/videos
 * @description Server actions optimizadas para Video con patrón EntityWithStats
 * Última refactorización: 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { db } from '@/lib/db';
import { fromPrismaVideoWithCounts, fromPrismaVideosWithCounts } from '@/transformers/video/transformer';
import type {
	VideoCreateInput,
	VideoUpdateInput,
	VideoWithStats,
	VideoFilters,
	PaginatedVideos,
	VideoPaginationOptions,
	VideoStats,
} from '@/types/entities/video';
import { revalidatePath } from 'next/cache';

// Logger específico para las acciones
const log = serverLogger.withContext('VideoActions');

/**
 * 🎬 Obtiene un video por su ID con estadísticas calculadas
 * @param id ID del video
 * @returns Video con estadísticas o null
 */
export async function getVideo(id: string): Promise<VideoWithStats | null> {
	try {
		log.info('🔍 Buscando video por ID', { id });

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
			log.warn('❌ Video no encontrado', { id });
			return null;
		}

		const transformedVideo = fromPrismaVideoWithCounts(video);
		log.info('✅ Video obtenido y transformado', {
			id,
			name: transformedVideo.name,
			qualityScore: transformedVideo.statistics.qualityScore
		});

		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al obtener video', { id, error });
		throw error;
	}
}

/**
 * 🔍 Busca videos con filtros avanzados y paginación
 * @param options Opciones de búsqueda y paginación
 * @returns Videos paginados con estadísticas
 */
export async function findVideos(options: {
	filters?: VideoFilters;
	pagination?: VideoPaginationOptions;
} = {}): Promise<VideoWithStats[]> {
	try {
		const { filters = {}, pagination = {} } = options;
		log.info('🔍 Buscando videos con filtros', { filters, pagination });

		// Construir where clause
		const where: any = {};

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
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

		log.info('✅ Videos encontrados y transformados', {
			count: transformedVideos.length,
			avgQualityScore: transformedVideos.reduce((sum, v) => sum + v.statistics.qualityScore, 0) / transformedVideos.length
		});

		return transformedVideos;
	} catch (error) {
		log.error('❌ Error al buscar videos', { error });
		throw error;
	}
}

/**
 * ➕ Crea un nuevo video
 * @param data Datos del video a crear
 * @returns Video creado con estadísticas
 */
export async function createVideo(data: VideoCreateInput): Promise<VideoWithStats> {
	try {
		log.info('➕ Creando nuevo video', { name: data.name, folderId: data.folderId });

		const video = await db.video.create({
			data: {
				name: data.name,
				description: data.description,
				path: data.path,
				hash: data.hash,
				size: data.size,
				duration: data.duration,
				width: data.width,
				height: data.height,
				metadata: data.metadata,
				thumbnail: data.thumbnail,
				thumbnailSize: data.thumbnailSize,
				thumbnailWidth: data.thumbnailWidth,
				thumbnailHeight: data.thumbnailHeight,
				isPublic: data.isPublic ?? false,
				isFavorite: data.isFavorite ?? false,
				folder: { connect: { id: data.folderId } },
				// Conectar relaciones si se proporcionan
				...(data.albumIds && { albums: { connect: data.albumIds.map(id => ({ id })) } }),
				...(data.collectionIds && { collections: { connect: data.collectionIds.map(id => ({ id })) } }),
				...(data.tagIds && { tags: { connect: data.tagIds.map(id => ({ id })) } }),
				...(data.characterIds && { characters: { connect: data.characterIds.map(id => ({ id })) } }),
				...(data.placeIds && { places: { connect: data.placeIds.map(id => ({ id })) } }),
				...(data.worldItemIds && { worldItems: { connect: data.worldItemIds.map(id => ({ id })) } }),
				...(data.conceptIds && { concepts: { connect: data.conceptIds.map(id => ({ id })) } }),
				...(data.promptIds && { prompts: { connect: data.promptIds.map(id => ({ id })) } }),
				...(data.noteIds && { notes: { connect: data.noteIds.map(id => ({ id })) } }),
				...(data.wildcardIds && { wildcards: { connect: data.wildcardIds.map(id => ({ id })) } }),
				...(data.propertyIds && { properties: { connect: data.propertyIds.map(id => ({ id })) } }),
				...(data.groupIds && { groups: { connect: data.groupIds.map(id => ({ id })) } }),
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

		const transformedVideo = fromPrismaVideoWithCounts(video);

		log.info('✅ Video creado exitosamente', {
			id: transformedVideo.id,
			name: transformedVideo.name,
			qualityScore: transformedVideo.statistics.qualityScore
		});

		revalidatePath('/videos');
		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al crear video', { error, data });
		throw error;
	}
}

/**
 * 🔄 Actualiza un video existente
 * @param id ID del video
 * @param data Datos a actualizar
 * @returns Video actualizado con estadísticas
 */
export async function updateVideo(id: string, data: VideoUpdateInput): Promise<VideoWithStats> {
	try {
		log.info('🔄 Actualizando video', { id, updates: Object.keys(data) });

		const video = await db.video.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.path !== undefined && { path: data.path }),
				...(data.size !== undefined && { size: data.size }),
				...(data.duration !== undefined && { duration: data.duration }),
				...(data.width !== undefined && { width: data.width }),
				...(data.height !== undefined && { height: data.height }),
				...(data.metadata !== undefined && { metadata: data.metadata }),
				...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
				...(data.thumbnailSize !== undefined && { thumbnailSize: data.thumbnailSize }),
				...(data.thumbnailWidth !== undefined && { thumbnailWidth: data.thumbnailWidth }),
				...(data.thumbnailHeight !== undefined && { thumbnailHeight: data.thumbnailHeight }),
				...(data.isPublic !== undefined && { isPublic: data.isPublic }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.folderId !== undefined && { folder: { connect: { id: data.folderId } } }),
				// Actualizar relaciones si se proporcionan
				...(data.albumIds && { albums: { set: data.albumIds.map(id => ({ id })) } }),
				...(data.collectionIds && { collections: { set: data.collectionIds.map(id => ({ id })) } }),
				...(data.tagIds && { tags: { set: data.tagIds.map(id => ({ id })) } }),
				...(data.characterIds && { characters: { set: data.characterIds.map(id => ({ id })) } }),
				...(data.placeIds && { places: { set: data.placeIds.map(id => ({ id })) } }),
				...(data.worldItemIds && { worldItems: { set: data.worldItemIds.map(id => ({ id })) } }),
				...(data.conceptIds && { concepts: { set: data.conceptIds.map(id => ({ id })) } }),
				...(data.promptIds && { prompts: { set: data.promptIds.map(id => ({ id })) } }),
				...(data.noteIds && { notes: { set: data.noteIds.map(id => ({ id })) } }),
				...(data.wildcardIds && { wildcards: { set: data.wildcardIds.map(id => ({ id })) } }),
				...(data.propertyIds && { properties: { set: data.propertyIds.map(id => ({ id })) } }),
				...(data.groupIds && { groups: { set: data.groupIds.map(id => ({ id })) } }),
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

		const transformedVideo = fromPrismaVideoWithCounts(video);

		log.info('✅ Video actualizado exitosamente', {
			id,
			qualityScore: transformedVideo.statistics.qualityScore
		});

		revalidatePath('/videos');
		revalidatePath(`/videos/${id}`);
		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al actualizar video', { id, error });
		throw error;
	}
}

/**
 * 🗑️ Elimina un video
 * @param id ID del video a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteVideo(id: string): Promise<boolean> {
	try {
		log.info('🗑️ Eliminando video', { id });

		await db.video.delete({
			where: { id },
		});

		log.info('✅ Video eliminado exitosamente', { id });

		revalidatePath('/videos');
		return true;
	} catch (error) {
		log.error('❌ Error al eliminar video', { id, error });
		throw error;
	}
}

/**
 * ⭐ Marca/desmarca un video como favorito
 * @param id ID del video
 * @param isFavorite Nuevo estado de favorito
 * @returns Video actualizado
 */
export async function toggleVideoFavorite(id: string, isFavorite: boolean): Promise<VideoWithStats> {
	try {
		log.info('⭐ Cambiando estado de favorito', { id, isFavorite });

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

		const transformedVideo = fromPrismaVideoWithCounts(video);

		log.info('✅ Estado de favorito actualizado', { id, isFavorite });

		revalidatePath('/videos');
		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al cambiar favorito', { id, error });
		throw error;
	}
}

/**
 * 👁️ Cambia la visibilidad de un video
 * @param id ID del video
 * @param isPublic Nuevo estado de visibilidad
 * @returns Video actualizado
 */
export async function setVideoVisibility(id: string, isPublic: boolean): Promise<VideoWithStats> {
	try {
		log.info('👁️ Cambiando visibilidad', { id, isPublic });

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

		const transformedVideo = fromPrismaVideoWithCounts(video);

		log.info('✅ Visibilidad actualizada', { id, isPublic });

		revalidatePath('/videos');
		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al cambiar visibilidad', { id, error });
		throw error;
	}
}

/**
 * 📁 Mueve un video a otra carpeta
 * @param id ID del video
 * @param folderId ID de la nueva carpeta
 * @returns Video actualizado
 */
export async function moveVideoToFolder(id: string, folderId: string): Promise<VideoWithStats> {
	try {
		log.info('📁 Moviendo video a carpeta', { id, folderId });

		const video = await db.video.update({
			where: { id },
			data: {
				folder: { connect: { id: folderId } }
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

		const transformedVideo = fromPrismaVideoWithCounts(video);

		log.info('✅ Video movido exitosamente', { id, folderId });

		revalidatePath('/videos');
		return transformedVideo;
	} catch (error) {
		log.error('❌ Error al mover video', { id, folderId, error });
		throw error;
	}
}

/**
 * Obtiene estadísticas de videos
 * @returns Estadísticas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	try {
		log.info('📊 Obteniendo estadísticas de videos');
		const stats = await db.video.aggregate({
			_avg: {
				field: 'duration',
				as: 'avgDuration',
			},
		});
		return stats._avg.avgDuration as VideoStats;
	} catch (error) {
		log.error('❌ Error al obtener estadísticas de videos', { error });
		throw error;
	}
}
