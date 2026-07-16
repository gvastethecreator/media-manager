/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para audios.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';

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
		throw new Error('Error al obtener audios');
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
		throw new Error('Error al crear audio');
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
		throw new Error('Error al actualizar audio');
	}
	return response.json();
}

export async function toggleAudioFavoriteInApi(id: string): Promise<AudioWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}/favorite`, {
		method: 'POST',
	});
	if (!response.ok) {
		throw new Error('Error al alternar favorito del audio');
	}
	return response.json();
}

export async function deleteAudioFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar audio');
	}
}
