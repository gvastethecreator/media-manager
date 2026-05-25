/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para lugares (places).
 */
import type { PlaceSearchOptions, PlaceWithStats } from '@/types/entities/place';

// Re-exportar tipos para uso externo
export type { PlaceSearchOptions };

const API_BASE_PATH = '/api/places';

export async function getPlacesFromApi(options: PlaceSearchOptions = {}): Promise<PlaceWithStats[]> {
	const params = new URLSearchParams();
	if (options.query) {
		params.append('search', options.query);
	}
	if (options.limit) {
		params.append('limit', String(options.limit));
	}
	if (options.offset) {
		params.append('offset', String(options.offset));
	}
	if (options.sortBy) {
		params.append('sortBy', options.sortBy);
	}
	if (options.sortOrder) {
		params.append('sortOrder', options.sortOrder);
	}

	const response = await fetch(`${API_BASE_PATH}?${params.toString()}`);
	if (!response.ok) {
		throw new Error('Error al obtener lugares');
	}
	const { data } = await response.json();
	return data as PlaceWithStats[];
}
