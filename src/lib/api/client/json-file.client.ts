/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para archivos JSON.
 * Reemplaza llamadas directas a servicios del servidor.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import { apiClient } from '@/lib/api/client';
import type { JsonFileCreateInput, JsonFileUpdateInput, JsonFileWithStats } from '@/types/entities/json-file';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

export type PublicJsonFileCreateInput = Omit<JsonFileCreateInput, 'path'> & {
	source: AuthorizedPathReference;
};

export type PublicJsonFileUpdateInput = Omit<JsonFileUpdateInput, 'path'> & {
	source?: AuthorizedPathReference;
};

const API_BASE_PATH = '/api/json-files';

export async function getJsonFilesFromApi(): Promise<JsonFileWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener archivos JSON');
	}
	const payload = await response.json();
	if (Array.isArray(payload)) {
		return payload as JsonFileWithStats[];
	}
	return (payload?.data as JsonFileWithStats[]) || [];
}

export async function getJsonFileFromApi(id: string): Promise<JsonFileWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);
	if (!response.ok) {
		throw new Error('Error al obtener archivo JSON');
	}
	return response.json();
}

export async function createJsonFileInApi(data: PublicJsonFileCreateInput): Promise<JsonFileWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear archivo JSON');
	}
	return response.json();
}

export async function updateJsonFileInApi(id: string, data: PublicJsonFileUpdateInput): Promise<JsonFileWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar archivo JSON');
	}
	return response.json();
}

export async function toggleJsonFileFavoriteInApi(id: string): Promise<JsonFileWithStats> {
	await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.JSON_FILE });
	await invalidateFavoriteQueries();
	return getJsonFileFromApi(id);
}

export async function deleteJsonFileFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar archivo JSON');
	}
}
