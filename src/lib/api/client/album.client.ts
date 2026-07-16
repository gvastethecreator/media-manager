/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para álbumes.
 */
import type { AlbumCreateInput, AlbumUpdateInput } from '@/lib/api/albums';
import type { AlbumWithStats } from '@/types/entities/album';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

const API_BASE_PATH = '/api/albums';

interface PaginatedResponse<T> {
	data: T[];
	message?: string;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
}

export async function getAlbumsFromApi(): Promise<AlbumWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener álbumes');
	}
	const result: PaginatedResponse<AlbumWithStats> = await response.json();
	return result.data;
}

export async function createAlbumInApi(data: AlbumCreateInput): Promise<AlbumWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear álbum');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updateAlbumInApi(id: string, data: AlbumUpdateInput): Promise<AlbumWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar álbum');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function deleteAlbumFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar álbum');
	}
	await invalidateFavoriteQueries();
}
