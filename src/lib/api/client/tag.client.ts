/**
 * Cliente de API para etiquetas (tags).
 * Reemplaza el uso directo de tag.service en los stores.
 */
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';

const API_BASE_PATH = '/api/tags';

export async function getTagsFromApi(): Promise<TagWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener etiquetas');
	}
	return response.json();
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
