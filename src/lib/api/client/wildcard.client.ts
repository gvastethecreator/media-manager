/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para wildcards.
 */
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/wildcards';

export async function getWildcardFromApi(id: string): Promise<WildcardWithStats | null> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error('Error al obtener wildcard');
	}
	return response.json();
}

export async function getWildcardsFromApi(): Promise<WildcardWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener wildcards');
	}
	const result = await response.json();
	return unwrapArrayResponse<WildcardWithStats>(result);
}

export async function createWildcardInApi(data: WildcardCreateInput): Promise<WildcardWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear wildcard');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updateWildcardInApi(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar wildcard');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function deleteWildcardFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar wildcard');
	}
	await invalidateFavoriteQueries();
}

export async function moveWildcardInApi(id: string, newParentId: string | null): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}/move`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ parentId: newParentId }),
	});
	if (!response.ok) {
		throw new Error('Error al mover wildcard');
	}
}
