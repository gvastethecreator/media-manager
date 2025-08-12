/**
 * Cliente de API para notas.
 */
import type { NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';

const API_BASE_PATH = '/api/notes';

export async function getNotesFromApi(): Promise<NoteWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener notas');
	}
	const result = await response.json();
	return result.items ?? result;
}

export async function createNoteInApi(data: NoteCreateInput): Promise<NoteWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear nota');
	}
	return response.json();
}

export async function updateNoteInApi(id: string, data: NoteUpdateInput): Promise<NoteWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar nota');
	}
	return response.json();
}

export async function deleteNoteFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar nota');
	}
}
