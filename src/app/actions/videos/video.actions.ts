/**
 * @file Acciones del servidor para gestionar videos
 * @module app/actions/videos
 */

import { revalidatePathClient } from '@/app/actions/revalidate';
import { serverLogger } from '@/lib/logger/server-logger';
import { videoService } from '@/services/video-service-export';
import type {
    CreateVideoInput,
    PaginatedVideos,
    UpdateVideoInput,
    VideoExtended,
    VideoFilters,
    VideoPaginationOptions,
    VideoStats
} from '@/types/entities/video/types';

// Logger específico para las acciones
const log = serverLogger.withContext('VideoActions');

/**
 * Obtiene un video por su ID
 * @param id ID del video
 * @param includeRelations Si se deben incluir relaciones
 * @returns Video encontrado o null
 */
export async function getVideo(
  id: string,
  includeRelations = false
): Promise<VideoExtended | null> {
  try {
    log.info('🔍 Buscando video por ID', { id });
    const video = await videoService.getVideoById(id, includeRelations);
    return video;
  } catch (error) {
    log.error('❌ Error al obtener video', { id, error });
    throw error;
  }
}

/**
 * Busca videos con filtros y paginación
 * @param filters Filtros de búsqueda
 * @param pagination Opciones de paginación
 * @returns Resultado paginado de videos
 */
export async function findVideos(
  filters: VideoFilters = {},
  pagination: VideoPaginationOptions = {}
): Promise<PaginatedVideos> {
  try {
    log.info('🔍 Buscando videos', { filters, pagination });
    const result = await videoService.findVideos(filters, pagination);
    return result;
  } catch (error) {
    log.error('❌ Error al buscar videos', { error });
    throw error;
  }
}

/**
 * Crea un nuevo video
 * @param data Datos para crear el video
 * @returns Video creado
 */
export async function createVideo(data: CreateVideoInput): Promise<VideoExtended> {
  try {
    log.info('🎬 Creando nuevo video', { name: data.name });
    const video = await videoService.createVideo(data);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    await revalidatePathClient(`/folders/${data.folderId}`);

    return video;
  } catch (error) {
    log.error('❌ Error al crear video', { error });
    throw error;
  }
}

/**
 * Actualiza un video existente
 * @param id ID del video a actualizar
 * @param data Datos para actualizar
 * @returns Video actualizado
 */
export async function updateVideo(
  id: string,
  data: UpdateVideoInput
): Promise<VideoExtended> {
  try {
    log.info('📝 Actualizando video', { id });
    const video = await videoService.updateVideo(id, data);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    await revalidatePathClient(`/videos/${id}`);
    if (data.folderId) {
      await revalidatePathClient(`/folders/${data.folderId}`);
    }

    return video;
  } catch (error) {
    log.error('❌ Error al actualizar video', { id, error });
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
    log.info('🗑️ Eliminando video', { id });

    // Obtener el video para conocer su folderId antes de eliminarlo
    const video = await videoService.getVideoById(id);
    const folderId = video?.folderId;

    const result = await videoService.deleteVideo(id);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    if (folderId) {
      await revalidatePathClient(`/folders/${folderId}`);
    }

    return result;
  } catch (error) {
    log.error('❌ Error al eliminar video', { id, error });
    throw error;
  }
}

/**
 * Marca o desmarca un video como favorito
 * @param id ID del video
 * @param isFavorite Estado de favorito a establecer
 * @returns Video actualizado
 */
export async function toggleVideoFavorite(
  id: string,
  isFavorite: boolean
): Promise<VideoExtended> {
  try {
    log.info(`${isFavorite ? '⭐' : '✖️'} ${isFavorite ? 'Marcando' : 'Desmarcando'} video como favorito`, { id });
    const video = await videoService.toggleVideoFavorite(id, isFavorite);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    await revalidatePathClient(`/videos/${id}`);
    await revalidatePathClient('/favorites');

    return video;
  } catch (error) {
    log.error('❌ Error al cambiar estado de favorito', { id, error });
    throw error;
  }
}

/**
 * Cambia la visibilidad de un video
 * @param id ID del video
 * @param isPublic Estado de visibilidad a establecer
 * @returns Video actualizado
 */
export async function setVideoVisibility(
  id: string,
  isPublic: boolean
): Promise<VideoExtended> {
  try {
    log.info(`${isPublic ? '🌎' : '🔒'} Cambiando visibilidad de video`, { id, isPublic });
    const video = await videoService.setVideoVisibility(id, isPublic);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    await revalidatePathClient(`/videos/${id}`);

    return video;
  } catch (error) {
    log.error('❌ Error al cambiar visibilidad', { id, error });
    throw error;
  }
}

/**
 * Mueve un video a otra carpeta
 * @param id ID del video
 * @param folderId ID de la carpeta destino
 * @returns Video actualizado
 */
export async function moveVideoToFolder(
  id: string,
  folderId: string
): Promise<VideoExtended> {
  try {
    log.info('📁 Moviendo video a otra carpeta', { id, folderId });

    // Obtener el video para conocer su folderId anterior
    const existingVideo = await videoService.getVideoById(id);
    const oldFolderId = existingVideo?.folderId;

    const video = await videoService.moveVideoToFolder(id, folderId);

    // Revalidar rutas
    await revalidatePathClient('/videos');
    await revalidatePathClient(`/videos/${id}`);
    if (oldFolderId) {
      await revalidatePathClient(`/folders/${oldFolderId}`);
    }
    await revalidatePathClient(`/folders/${folderId}`);

    return video;
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
    const stats = await videoService.getVideoStats();
    return stats;
  } catch (error) {
    log.error('❌ Error al obtener estadísticas de videos', { error });
    throw error;
  }
}