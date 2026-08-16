/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para propiedades.
 */
import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/properties';

export async function getPropertiesFromApi(): Promise<PropertyWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get properties');
	}
	const result = await response.json();
	return unwrapArrayResponse<PropertyWithStats>(result);
}

export async function createPropertyInApi(data: PropertyCreateInput): Promise<PropertyWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create property');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updatePropertyInApi(id: string, data: PropertyUpdateInput): Promise<PropertyWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update property');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function deletePropertyFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete property');
	}
	await invalidateFavoriteQueries();
}
