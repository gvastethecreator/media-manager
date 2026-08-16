/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para conceptos.
 */
import type { ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/concepts';

export async function getConceptsFromApi(): Promise<ConceptWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get concepts');
	}
	const result = await response.json();
	return unwrapArrayResponse<ConceptWithStats>(result);
}

export async function getConceptCountsFromApi(id: string): Promise<Record<string, number>> {
	const response = await fetch(`${API_BASE_PATH}/${id}/counts`);
	if (!response.ok) {
		throw new Error('Could not get concept counts');
	}
	return response.json();
}

export async function createConceptInApi(data: ConceptCreateInput): Promise<ConceptWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create concept');
	}
	return response.json();
}

export async function updateConceptInApi(id: string, data: ConceptUpdateInput): Promise<ConceptWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update concept');
	}
	return response.json();
}

export async function deleteConceptFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete concept');
	}
}
