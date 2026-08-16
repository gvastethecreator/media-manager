/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para audios.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import { apiClient } from '@/lib/api/client';
import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

export type PublicAudioCreateInput = Omit<AudioCreateInput, 'path' | 'source'> & {
	source: AuthorizedPathReference;
};

export type PublicAudioUpdateInput = Omit<AudioUpdateInput, 'path' | 'source'> & {
	source?: AuthorizedPathReference;
};

const API_BASE_PATH = '/api/audio';

export async function getAudiosFromApi(): Promise<AudioWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get audio files');
	}
	return response.json();
}

export async function createAudioInApi(data: PublicAudioCreateInput): Promise<AudioWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create audio');
	}
	return response.json();
}

export async function updateAudioInApi(id: string, data: PublicAudioUpdateInput): Promise<AudioWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update audio');
	}
	return response.json();
}

export async function toggleAudioFavoriteInApi(id: string): Promise<AudioWithStats> {
	await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.AUDIO });
	await invalidateFavoriteQueries();
	return apiClient.get<AudioWithStats>(`/audio/${id}`);
}

export async function deleteAudioFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete audio');
	}
}
