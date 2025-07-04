/**
 * @file Cliente de API para el servicio de imágenes
 * @module lib/api/client/image.client
 * @description Funciones para interactuar con los endpoints de la API de imágenes desde el cliente.
 */

import type { GetImagesOptions, GetImagesResult, ImageUpdateInput } from '@/services/image/image.service';
import type { ImageWithStats } from '@/types/entities/image/types';

const API_BASE_PATH = '/api/images';

/**
 * Obtiene una lista de imágenes desde la API.
 * @param options - Opciones de filtrado y paginación.
 * @returns Una promesa que se resuelve con el resultado de la API.
 */
export async function getImagesFromApi(options: GetImagesOptions = {}): Promise<GetImagesResult> {
	const params = new URLSearchParams();
	if (options.folderId) params.append('folderId', options.folderId);
	if (options.limit) params.append('limit', String(options.limit));
	if (options.offset) params.append('offset', String(options.offset));
	if (options.search) params.append('search', options.search);
	if (options.sortBy) params.append('sortBy', options.sortBy);
	if (options.sortOrder) params.append('sortOrder', options.sortOrder);

	const response = await fetch(`${API_BASE_PATH}?${params.toString()}`);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Error al obtener las imágenes');
	}

	return response.json();
}

/**
 * Obtiene una única imagen por su ID desde la API.
 * @param id - El ID de la imagen.
 * @returns Una promesa que se resuelve con los datos de la imagen.
 */
export async function getImageFromApi(id: string): Promise<ImageWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || `Error al obtener la imagen ${id}`);
	}

	return response.json();
}

/**
 * Actualiza una imagen a través de la API.
 * @param id - El ID de la imagen a actualizar.
 * @param data - Los datos a actualizar.
 * @returns Una promesa que se resuelve con la imagen actualizada.
 */
export async function updateImageInApi(id: string, data: ImageUpdateInput): Promise<ImageWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Error al actualizar la imagen');
	}

	return response.json();
}

/**
 * Elimina una imagen a través de la API.
 * @param id - El ID de la imagen a eliminar.
 */
export async function deleteImageFromApi(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Error al eliminar la imagen');
	}
}

/**
 * Obtiene la URL de una imagen o su miniatura.
 * Esta es una función de utilidad que no hace una llamada a la API,
 * simplemente construye la URL correcta.
 * @param imageId - El ID de la imagen.
 * @param type - Si se desea la imagen original o la miniatura.
 * @returns La URL de la imagen.
 */
export function getImageUrl(imageId: string, type: 'thumbnail' | 'original' = 'thumbnail'): string {
	return `${API_BASE_PATH}/${imageId}/${type}`;
}
