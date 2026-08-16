/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para documentos.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import type { DocumentCreateInput, DocumentUpdateInput, DocumentWithStats } from '@/types/entities/document';

export type PublicDocumentCreateInput = Omit<DocumentCreateInput, 'path'> & {
	source: AuthorizedPathReference;
};

export type PublicDocumentUpdateInput = Omit<DocumentUpdateInput, 'path'> & {
	source?: AuthorizedPathReference;
};

const API_BASE_PATH = '/api/documents';

export async function getDocumentsFromApi(): Promise<DocumentWithStats[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get documents');
	}
	return response.json();
}

export async function createDocumentInApi(data: PublicDocumentCreateInput): Promise<DocumentWithStats> {
	const response = await fetch(API_BASE_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not create document');
	}
	return response.json();
}

export async function updateDocumentInApi(id: string, data: PublicDocumentUpdateInput): Promise<DocumentWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Could not update document');
	}
	return response.json();
}

export async function deleteDocumentFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Could not delete document');
	}
}
