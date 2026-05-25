/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * @file Cliente de API para carpetas
 * @description Permite obtener imagenes de una carpeta usando la API REST
 */
import type { ImageWithStats } from '@/types/entities/image';

const API_BASE_PATH = '/api/images';

export interface FolderImagesOptions {
	skip?: number;
	take?: number;
}

export interface FolderImagesResponse {
	items: ImageWithStats[];
	pagination: {
		total: number;
		hasMore: boolean;
		currentPage: number;
	};
}

/**
 * Obtiene las imágenes de una carpeta mediante la API.
 * Se utiliza en el store unificado para reemplazar la llamada al servicio del servidor.
 */
export async function getFolderImagesFromApi(
	folderId: string,
	options: FolderImagesOptions = {}
): Promise<FolderImagesResponse> {
	const params = new URLSearchParams();
	params.append('folderId', folderId);
	if (options.take) {
		params.append('limit', String(options.take));
	}
	if (options.skip) {
		params.append('offset', String(options.skip));
	}

	const response = await fetch(`${API_BASE_PATH}?${params.toString()}`);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al obtener las imágenes de la carpeta');
	}

	const data = await response.json();
	return {
		items: data.data ?? [],
		pagination: {
			total: data.pagination?.total ?? 0,
			hasMore: data.pagination?.hasNext ?? false,
			currentPage: Math.floor((data.pagination?.offset ?? 0) / (data.pagination?.limit ?? 1)),
		},
	};
}
