/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para archivos 3D.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import { apiClient } from '@/lib/api/client';
import type { File3DCreateInput, File3DUpdateInput, File3DWithStats } from '@/types/entities/file3d';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

export type PublicFile3DCreateInput = Omit<File3DCreateInput, 'path'> & {
	source: AuthorizedPathReference;
};

export type PublicFile3DUpdateInput = Omit<File3DUpdateInput, 'path'> & {
	source?: AuthorizedPathReference;
};

const API_BASE_PATH = '/api/file3ds';

export async function getFile3DsFromApi(): Promise<File3DWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get 3D files');
	}
	return response.json();
}

export async function getFile3DFromApi(id: string): Promise<File3DWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);
	if (!response.ok) {
		throw new Error('Could not get 3D file');
	}
	return response.json();
}

export async function createFile3DInApi(data: PublicFile3DCreateInput): Promise<File3DWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create 3D file');
	}
	return response.json();
}

export async function updateFile3DInApi(id: string, data: PublicFile3DUpdateInput): Promise<File3DWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update 3D file');
	}
	return response.json();
}

export async function toggleFile3DFavoriteInApi(id: string): Promise<File3DWithStats> {
	await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.FILE_3D });
	await invalidateFavoriteQueries();
	return getFile3DFromApi(id);
}

export async function deleteFile3DFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete 3D file');
	}
}
