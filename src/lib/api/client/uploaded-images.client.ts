/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para imágenes subidas.
 */
import type { UploadedImageFilters, UploadedImageResult } from '@/types/uploaded-images';

const API_BASE_PATH = '/api/uploaded-images';

export interface GetUploadedImagesParams extends UploadedImageFilters {
	page?: number;
	pageSize?: number;
}

export interface UploadedImagesResponse {
	items: UploadedImageResult[];
	page: number;
	pageSize: number;
	total: number;
}

export async function getUploadedImagesFromApi(params: GetUploadedImagesParams = {}): Promise<UploadedImagesResponse> {
	const search = new URLSearchParams();
	if (params.page) {
		search.append('page', String(params.page));
	}
	if (params.pageSize) {
		search.append('pageSize', String(params.pageSize));
	}
	if (params.search) {
		search.append('searchTerm', params.search);
	}
	if (params.type) {
		search.append('category', params.type);
	}
	const url = search.toString() ? `${API_BASE_PATH}?${search.toString()}` : API_BASE_PATH;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Error al obtener imágenes subidas');
	}
	return response.json();
}

export async function uploadImagesToApi(formData: FormData): Promise<{ items: UploadedImageResult[] }> {
	const response = await fetch(API_BASE_PATH, { method: 'POST', body: formData });
	if (!response.ok) {
		throw new Error('Error al subir imágenes');
	}
	return response.json();
}

export async function deleteUploadedImageFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error('Error al eliminar imagen');
	}
}
