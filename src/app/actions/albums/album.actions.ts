/**
 * @file Actions para la entidad Album - Migradas a API calls
 * @module app/actions/albums/album.actions
 * @description Funciones que llaman a las rutas API de álbumes
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { AlbumWithStats, CreateAlbumInput, UpdateAlbumInput } from '@/types/entities/album';

const logger = clientLogger.withContext('AlbumActions');
const API_BASE = '/api/albums';

/**
 * Obtiene todos los álbumes con sus estadísticas.
 */
export async function getAlbums(options?: object): Promise<AlbumWithStats[]> {
	try {
		logger.info('🎞️ Obteniendo álbumes via API');

		// Construir query params si hay opciones
		const searchParams = new URLSearchParams();
		if (options && typeof options === 'object') {
			for (const [key, value] of Object.entries(options)) {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			}
		}

		const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getAlbums', { error });
		throw error;
	}
}

/**
 * Obtiene un único álbum por su ID con estadísticas.
 */
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo álbum ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getAlbum: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo álbum.
 */
export async function createAlbum(data: CreateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando álbum via API', { name: data.name });

		const response = await fetch(API_BASE, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error('❌ Error en API createAlbum', { error, data });
		throw error;
	}
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(id: string, data: UpdateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info(`🔄 Actualizando álbum ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API updateAlbum: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un álbum.
 */
export async function deleteAlbum(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando álbum ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteAlbum: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes de un álbum específico de forma eficiente.
 */
export async function getAlbumImages(albumId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes del álbum ${albumId} via API`);

		const response = await fetch(`${API_BASE}/${albumId}/images`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getAlbumImages: ${albumId}`, { error });
		throw error;
	}
}

/**
 * Agrega una imagen a un álbum
 */
export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} al álbum ${albumId} via API`);

		const response = await fetch(`${API_BASE}/${albumId}/images/${imageId}`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API addImageToAlbum', { error, albumId, imageId });
		throw error;
	}
}

/**
 * Remueve una imagen de un álbum
 */
export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} del álbum ${albumId} via API`);

		const response = await fetch(`${API_BASE}/${albumId}/images/${imageId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API removeImageFromAlbum', { error, albumId, imageId });
		throw error;
	}
}
