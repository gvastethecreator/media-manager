/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para etiquetas (tags).
 */
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/tags';

export async function getTagsFromApi(): Promise<TagWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener etiquetas');
	}
	const result = await response.json();
	return unwrapArrayResponse<TagWithStats>(result);
}

export async function createTagInApi(data: TagCreateInput): Promise<TagWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear etiqueta');
	}
	return response.json();
}

export async function updateTagInApi(id: string, data: TagUpdateInput): Promise<TagWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar etiqueta');
	}
	return response.json();
}

export async function deleteTagFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar etiqueta');
	}
}
