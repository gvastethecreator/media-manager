/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para documentos.
 */
import type { DocumentCreateInput, DocumentUpdateInput, DocumentWithStats } from '@/types/entities/document';

const API_BASE_PATH = '/api/documents';

export async function getDocumentsFromApi(): Promise<DocumentWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener documentos');
	}
	return response.json();
}

export async function createDocumentInApi(data: DocumentCreateInput): Promise<DocumentWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al crear documento');
	}
	return response.json();
}

export async function updateDocumentInApi(id: string, data: DocumentUpdateInput): Promise<DocumentWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Error al actualizar documento');
	}
	return response.json();
}

export async function deleteDocumentFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar documento');
	}
}
