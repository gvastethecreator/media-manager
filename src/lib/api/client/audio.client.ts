/**
 * Cliente de API para audios.
 */
import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';

const API_BASE_PATH = '/api/audio';

export async function getAudiosFromApi(): Promise<AudioWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener audios');
	}
	return response.json();
}

export async function createAudioInApi(data: AudioCreateInput): Promise<AudioWithStats> {
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

export async function updateAudioInApi(id: string, data: AudioUpdateInput): Promise<AudioWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
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
