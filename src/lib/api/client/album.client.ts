/**
 * Cliente de API para álbumes.
 */
import type { AlbumCreateInput, AlbumUpdateInput } from '@/lib/api/albums';
import type { AlbumWithStats } from '@/types/entities/album';

const API_BASE_PATH = '/api/albums';

export async function getAlbumsFromApi(): Promise<AlbumWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) throw new Error('Error al obtener álbumes');
	return response.json();
}

export async function createAlbumInApi(data: AlbumCreateInput): Promise<AlbumWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error('Error al crear álbum');
	return response.json();
}

export async function updateAlbumInApi(id: string, data: AlbumUpdateInput): Promise<AlbumWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error('Error al actualizar álbum');
	return response.json();
}

export async function deleteAlbumFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) throw new Error('Error al eliminar álbum');
}
