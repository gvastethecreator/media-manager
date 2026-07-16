/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para videos.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import type { VideoCreateInput, VideoFilters, VideoUpdateInput, VideoWithStats } from '@/types/entities/video';

export type PublicVideoCreateInput = Omit<VideoCreateInput, 'path'> & {
	source: AuthorizedPathReference;
};

export type PublicVideoUpdateInput = Omit<VideoUpdateInput, 'path'> & {
	source?: AuthorizedPathReference;
};

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
	folderId?: string;
	folderIds?: string[];
}

export async function findVideosInApi(options: FindVideosOptions = {}): Promise<VideoWithStats[]> {
	const params = new URLSearchParams();

	// Backend actual valida 'folderId' simple; mantenemos compatibilidad con múltiples
	if (options.folderId) {
		params.append('folderId', options.folderId);
	} else if (options.folderIds && options.folderIds.length === 1) {
		params.append('folderId', options.folderIds[0]);
	} else if (options.folderIds && options.folderIds.length > 1) {
		// Si en futuro el backend soporta arrays, enviar 'folderIds'
		params.append('folderIds', options.folderIds.join(','));
	}

	if (options.filters?.search) {
		params.append('search', options.filters.search);
	}
	if (options.filters?.isFavorite !== undefined) {
		params.append('isFavorite', String(options.filters.isFavorite));
	}

	const url = `${API_BASE_PATH}?${params.toString()}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Error al buscar videos');
	}
	// El backend retorna { data, pagination }
	const payload = await response.json();
	if (Array.isArray(payload)) {
		// Compat por si alguna ruta legacy devuelve lista directamente
		return payload as VideoWithStats[];
	}
	return (payload?.data as VideoWithStats[]) || [];
}

export async function createVideoInApi(data: PublicVideoCreateInput): Promise<VideoWithStats> {
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

export async function updateVideoInApi(id: string, data: PublicVideoUpdateInput): Promise<VideoWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar video');
	}
	return response.json();
}

export async function deleteVideoFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar video');
	}
}
