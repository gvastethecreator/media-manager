'use server';

/**
 * @file Acciones del servidor para gestionar videos
 * @module app/actions/videos
 * @description Server actions refactorizadas para usar el servicio de video
 * Última refactorización: 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { videoService } from '@/services/video';
import type {
	VideoCreateInput,
	VideoFilters,
	VideoPaginationOptions,
	VideoStats,
	VideoUpdateInput,
	VideoWithStats,
} from '@/types/entities/video';

// Logger específico para las acciones
const log = serverLogger.withContext('VideoActions');

/**
 * Obtiene un video por su ID con estadísticas calculadas
 * @param id ID del video
 * @returns Video con estadísticas o null
 */
export async function getVideo(id: string): Promise<VideoWithStats | null> {
	try {
		log.info('🔍 Action: Buscando video por ID', { id });
		return await videoService.getVideo(id);
	} catch (error) {
		log.error('❌ Error en action getVideo', { id, error });
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
		log.info('🔍 Action: Buscando videos con filtros', { options });
		return await videoService.findVideos(options);
	} catch (error) {
		log.error('❌ Error en action findVideos', { error });
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
		log.info('➕ Action: Creando nuevo video', { name: data.name });
		return await videoService.createVideo(data);
	} catch (error) {
		log.error('❌ Error en action createVideo', { error, data });
		throw error;
	}
}

/**
 * Actualiza un video existente
 * @param id ID del video
 * @param data Datos a actualizar
 * @returns Video actualizado con estadísticas
 */
export async function updateVideo(id: string, data: VideoUpdateInput): Promise<VideoWithStats> {
	try {
		log.info('🔄 Action: Actualizando video', { id, updates: Object.keys(data) });
		return await videoService.updateVideo(id, data);
	} catch (error) {
		log.error('❌ Error en action updateVideo', { id, error });
		throw error;
	}
}

/**
 * Elimina un video
 * @param id ID del video a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteVideo(id: string): Promise<boolean> {
	try {
		log.info('🗑️ Action: Eliminando video', { id });
		return await videoService.deleteVideo(id);
	} catch (error) {
		log.error('❌ Error en action deleteVideo', { id, error });
		throw error;
	}
}

/**
 * Marca/desmarca un video como favorito
 * @param id ID del video
 * @param isFavorite Nuevo estado de favorito
 * @returns Video actualizado
 */
export async function toggleVideoFavorite(id: string, isFavorite: boolean): Promise<VideoWithStats> {
	try {
		log.info('⭐ Action: Cambiando estado de favorito', { id, isFavorite });
		return await videoService.toggleVideoFavorite(id, isFavorite);
	} catch (error) {
		log.error('❌ Error en action toggleVideoFavorite', { id, error });
		throw error;
	}
}

/**
 * Establece la visibilidad de un video
 * @param id ID del video
 * @param isPublic Nuevo estado de visibilidad
 * @returns Video actualizado
 */
export async function setVideoVisibility(id: string, isPublic: boolean): Promise<VideoWithStats> {
	try {
		log.info('👁️ Action: Cambiando visibilidad de video', { id, isPublic });
		return await videoService.setVideoVisibility(id, isPublic);
	} catch (error) {
		log.error('❌ Error en action setVideoVisibility', { id, error });
		throw error;
	}
}

/**
 * Mueve un video a una carpeta
 * @param id ID del video
 * @param folderId ID de la carpeta destino
 * @returns Video actualizado
 */
export async function moveVideoToFolder(id: string, folderId: string): Promise<VideoWithStats> {
	try {
		log.info('📁 Action: Moviendo video a carpeta', { id, folderId });
		return await videoService.moveVideoToFolder(id, folderId);
	} catch (error) {
		log.error('❌ Error en action moveVideoToFolder', { id, folderId, error });
		throw error;
	}
}

/**
 * Obtiene estadísticas generales de videos
 * @returns Estadísticas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	try {
		log.info('📊 Action: Obteniendo estadísticas de videos');
		return await videoService.getVideoStats();
	} catch (error) {
		log.error('❌ Error en action getVideoStats', { error });
		throw error;
	}
}
