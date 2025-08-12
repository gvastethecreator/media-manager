/**
 * Cliente de API para videos.
 * Permite interactuar con /api/videos desde el cliente.
 */
import type { VideoCreateInput, VideoFilters, VideoWithStats } from '@/types/entities/video';

const API_BASE_PATH = '/api/videos';

export async function getVideoFromApi(id: string): Promise<VideoWithStats | null> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error('Error al obtener video');
	}
	return response.json();
}

export interface FindVideosOptions {
	filters?: Partial<VideoFilters>;
	folderIds?: string[];
}

export async function findVideosInApi(options: FindVideosOptions = {}): Promise<VideoWithStats[]> {
	const params = new URLSearchParams();
	if (options.folderIds) {
		params.append('folderIds', options.folderIds.join(','));
	}
	if (options.filters?.search) {
		params.append('search', options.filters.search);
	}
	const response = await fetch(`${API_BASE_PATH}?${params.toString()}`);
	if (!response.ok) {
		throw new Error('Error al buscar videos');
	}
	return response.json();
}

export async function createVideoInApi(data: VideoCreateInput): Promise<VideoWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear video');
	}
	return response.json();
}

export async function deleteVideoFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar video');
	}
}
