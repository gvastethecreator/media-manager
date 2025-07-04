/**
 * @file Servicio para la entidad Video
 * @module services/video/video.service
 * @description Lógica de negocio y acceso a datos para los videos.
 */

import type {
	VideoCreateInput,
	VideoFilters,
	VideoPaginationOptions,
	VideoStats,
	VideoUpdateInput,
	VideoWithStats,
} from '@/types/entities/video';

/**
 * Obtiene un video por su ID con estadísticas calculadas
 * @param id ID del video
 * @returns Video con estadísticas o null
 */
export async function getVideo(id: string): Promise<VideoWithStats | null> {
	const response = await fetch(`/api/videos/${id}`);
	if (!response.ok) {
		if (response.status === 404) return null;
		throw new Error('No se pudo obtener el video.');
	}
	return response.json();
}

/**
 * Busca videos con filtros avanzados y paginación
 * @param options Opciones de búsqueda y paginación
 * @returns Videos con estadísticas
 */
export async function findVideos(
	options: { filters?: VideoFilters; pagination?: VideoPaginationOptions } = {}
): Promise<VideoWithStats[]> {
	const { filters = {}, pagination = {} } = options;

	// Construir query parameters
	const params = new URLSearchParams();

	if (filters.search) params.append('search', filters.search);
	if (filters.folders?.length) params.append('folders', filters.folders.join(','));
	if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
	if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
	if (filters.minDuration) params.append('minDuration', filters.minDuration.toString());
	if (filters.maxDuration) params.append('maxDuration', filters.maxDuration.toString());
	if (filters.minSize) params.append('minSize', filters.minSize.toString());
	if (filters.maxSize) params.append('maxSize', filters.maxSize.toString());
	if (filters.minWidth) params.append('minWidth', filters.minWidth.toString());
	if (filters.maxWidth) params.append('maxWidth', filters.maxWidth.toString());
	if (filters.minHeight) params.append('minHeight', filters.minHeight.toString());
	if (filters.maxHeight) params.append('maxHeight', filters.maxHeight.toString());
	if (filters.hasMetadata !== undefined) params.append('hasMetadata', filters.hasMetadata.toString());
	if (filters.hasThumbnail !== undefined) params.append('hasThumbnail', filters.hasThumbnail.toString());
	if (filters.dateRange?.start) params.append('dateStart', filters.dateRange.start.toISOString());
	if (filters.dateRange?.end) params.append('dateEnd', filters.dateRange.end.toISOString());

	if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
	if (pagination.limit) params.append('limit', pagination.limit.toString());
	if (pagination.page) params.append('page', pagination.page.toString());

	const response = await fetch(`/api/videos?${params.toString()}`);
	if (!response.ok) {
		throw new Error('No se pudieron obtener los videos.');
	}
	return response.json();
}

/**
 * Crea un nuevo video
 * @param data Datos del video a crear
 * @returns Video creado con estadísticas
 */
export async function createVideo(data: VideoCreateInput): Promise<VideoWithStats> {
	const response = await fetch('/api/videos', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo crear el video.');
	}
	return response.json();
}

/**
 * Actualiza un video existente
 * @param id ID del video a actualizar
 * @param data Datos a actualizar
 * @returns Video actualizado con estadísticas
 */
export async function updateVideo(id: string, data: VideoUpdateInput): Promise<VideoWithStats> {
	const response = await fetch(`/api/videos/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo actualizar el video.');
	}
	return response.json();
}

/**
 * Elimina un video
 * @param id ID del video a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteVideo(id: string): Promise<boolean> {
	const response = await fetch(`/api/videos/${id}`, {
		method: 'DELETE',
	});
	if (!response.ok) {
		throw new Error('No se pudo eliminar el video.');
	}
	return true;
}

/**
 * Marca/desmarca un video como favorito
 * @param id ID del video
 * @param isFavorite Si debe ser favorito o no
 * @returns Video actualizado con estadísticas
 */
export async function toggleVideoFavorite(id: string, isFavorite: boolean): Promise<VideoWithStats> {
	const response = await fetch(`/api/videos/${id}/favorite`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ isFavorite }),
	});
	if (!response.ok) {
		throw new Error('No se pudo actualizar el estado de favorito.');
	}
	return response.json();
}

/**
 * Cambia la visibilidad de un video
 * @param id ID del video
 * @param isPublic Si debe ser público o no
 * @returns Video actualizado con estadísticas
 */
export async function setVideoVisibility(id: string, isPublic: boolean): Promise<VideoWithStats> {
	const response = await fetch(`/api/videos/${id}/visibility`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ isPublic }),
	});
	if (!response.ok) {
		throw new Error('No se pudo actualizar la visibilidad.');
	}
	return response.json();
}

/**
 * Mueve un video a una carpeta específica
 * @param id ID del video
 * @param folderId ID de la carpeta destino
 * @returns Video actualizado con estadísticas
 */
export async function moveVideoToFolder(id: string, folderId: string): Promise<VideoWithStats> {
	const response = await fetch(`/api/videos/${id}/move`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folderId }),
	});
	if (!response.ok) {
		throw new Error('No se pudo mover el video.');
	}
	return response.json();
}

/**
 * Obtiene estadísticas generales de videos
 * @returns Estadísticas de videos
 */
export async function getVideoStats(): Promise<VideoStats> {
	const response = await fetch('/api/videos/stats');
	if (!response.ok) {
		throw new Error('No se pudieron obtener las estadísticas de videos.');
	}
	return response.json();
}
