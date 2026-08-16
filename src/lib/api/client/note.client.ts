/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para notas.
 */
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/notes';

export async function getNotesFromApi(): Promise<NoteWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get notes');
	}
	const result = await response.json();
	return unwrapArrayResponse<NoteWithStats>(result);
}

export async function createNoteInApi(data: NoteCreateInput): Promise<NoteWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create note');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function updateNoteInApi(id: string, data: NoteUpdateInput): Promise<NoteWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update note');
	}
	await invalidateFavoriteQueries();
	return response.json();
}

export async function deleteNoteFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete note');
	}
	await invalidateFavoriteQueries();
}
