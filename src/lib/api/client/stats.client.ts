/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para estadísticas del sistema.
 */
import type { SystemStats } from '@/lib/api/system';
import type { ImageStatistics } from '@/types/entities/image';

const API_BASE_PATH = '/api/stats';

export async function getSystemStatsFromApi(): Promise<SystemStats> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Error al obtener estadísticas');
	}
	return response.json();
}

export async function invalidateStatsInApi(): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/invalidate`, { method: 'POST' });
	if (!response.ok) {
		throw new Error('Error al invalidar estadísticas');
	}
}

/**
 * Obtiene estadísticas de una imagen específica.
 * Se añadió para reemplazar el uso directo de StatsService en hooks del cliente.
 */
export async function getImageStatsFromApi(imageId: string): Promise<ImageStatistics> {
	const response = await fetch(`/api/images/${imageId}/stats`);
	if (!response.ok) {
		throw new Error('Error al obtener estadísticas de imagen');
	}
	return response.json();
}

/**
 * Incrementa el contador de vistas de una imagen mediante la API.
 */
export async function incrementImageViewInApi(imageId: string): Promise<ImageStatistics> {
	const response = await fetch(`/api/images/${imageId}/view`, { method: 'POST' });
	if (!response.ok) {
		throw new Error('Error al incrementar vistas');
	}
	return response.json();
}

/**
 * Incrementa el contador de descargas de una imagen mediante la API.
 */
export async function incrementImageDownloadInApi(imageId: string): Promise<ImageStatistics> {
	const response = await fetch(`/api/images/${imageId}/download`, { method: 'POST' });
	if (!response.ok) {
		throw new Error('Error al incrementar descargas');
	}
	return response.json();
}
