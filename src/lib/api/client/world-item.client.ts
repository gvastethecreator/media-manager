/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para world items.
 */
import type {
	WorldItemCreateInput as CreateWorldItemData,
	WorldItemUpdateInput as UpdateWorldItemData,
	WorldItemWithStats as WorldItem,
} from '@/types/entities/world-item/types';
import { apiClient } from '@/lib/api/client';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/world-items';

export async function getWorldItemsFromApi(): Promise<WorldItem[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener world items');
	}
	const result = await response.json();
	return unwrapArrayResponse<WorldItem>(result);
}

export async function createWorldItemInApi(data: CreateWorldItemData): Promise<WorldItem> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear world item');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updateWorldItemInApi(id: string, data: UpdateWorldItemData): Promise<WorldItem> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar world item');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function toggleWorldItemFavoriteInApi(id: string): Promise<WorldItem> {
	await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.WORLD_ITEM });
	await invalidateFavoriteQueries();
	return apiClient.get<WorldItem>(`/world-items/${id}`);
}

export async function deleteWorldItemFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar world item');
	}
	await invalidateFavoriteQueries();
}
