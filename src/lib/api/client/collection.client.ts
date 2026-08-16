/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para colecciones.
 */
import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/collections';

export async function getCollectionsFromApi(): Promise<CollectionWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get collections');
	}
	const result = await response.json();
	return unwrapArrayResponse<CollectionWithStats>(result);
}

export async function getCollectionFromApi(id: string): Promise<CollectionWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);
	if (!response.ok) {
		throw new Error('Could not get the collection');
	}
	return response.json();
}

export async function createCollectionInApi(data: CollectionCreateInput): Promise<CollectionWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create collection');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updateCollectionInApi(id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update collection');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function deleteCollectionFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete collection');
	}
	await invalidateFavoriteQueries();
}
