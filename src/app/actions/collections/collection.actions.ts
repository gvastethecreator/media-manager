/**
 * @file Actions para la entidad Collection - Migradas a API calls
 * @module app/actions/collections/collection.actions
 * @description Funciones que llaman a las rutas API de colecciones
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type {
	CollectionCreateInput,
	CollectionSearchOptions,
	CollectionUpdateInput,
	CollectionWithStats,
} from '@/types/entities/collection';

const logger = clientLogger.withContext('CollectionActions');
const API_BASE = '/api/collections';

/**
 * Busca y obtiene colecciones según los criterios de búsqueda.
 */
export async function searchCollections(options: CollectionSearchOptions): Promise<CollectionWithStats[]> {
	try {
		logger.info('🔍 Buscando colecciones via API', { options });

		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(options)) {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
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
		logger.error('❌ Error en API searchCollections', { error, options });
		throw error;
	}
}

/**
 * Obtiene todas las colecciones.
 */
export async function getCollections(): Promise<CollectionWithStats[]> {
	try {
		logger.info('📚 Obteniendo colecciones via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getCollections', { error });
		throw error;
	}
}

/**
 * Obtiene una única colección por su ID.
 */
export async function getCollection(id: string): Promise<CollectionWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo colección ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getCollection: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva colección.
 */
export async function createCollection(data: CollectionCreateInput): Promise<CollectionWithStats> {
	try {
		logger.info('➕ Creando colección via API', { name: data.name });

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
		logger.error('❌ Error en API createCollection', { error, data });
		throw error;
	}
}

/**
 * Actualiza una colección existente.
 */
export async function updateCollection(id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> {
	try {
		logger.info(`🔄 Actualizando colección ${id} via API`);

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
		logger.error(`❌ Error en API updateCollection: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una colección.
 */
export async function deleteCollection(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando colección ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteCollection: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes asociadas a una colección.
 */
export async function getCollectionImages(collectionId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes de colección ${collectionId} via API`);

		const response = await fetch(`${API_BASE}/${collectionId}/images`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getCollectionImages: ${collectionId}`, { error });
		throw error;
	}
}

/**
 * Cambia el estado de favorito de una colección.
 */
export async function toggleCollectionFavorite(id: string): Promise<CollectionWithStats> {
	try {
		logger.info(`⭐ Cambiando favorito de colección ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}/favorite`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API toggleCollectionFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Agrega una imagen a una colección.
 */
export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} a colección ${collectionId} via API`);

		const response = await fetch(`${API_BASE}/${collectionId}/images/${imageId}`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API addImageToCollection', { error, collectionId, imageId });
		throw error;
	}
}

/**
 * Remueve una imagen de una colección.
 */
export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} de colección ${collectionId} via API`);

		const response = await fetch(`${API_BASE}/${collectionId}/images/${imageId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API removeImageFromCollection', { error, collectionId, imageId });
		throw error;
	}
}

/**
 * Agrega una colección a una imagen.
 */
export async function addCollectionToImage(imageId: string, collectionId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando colección ${collectionId} a imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/collections/${collectionId}`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API addCollectionToImage', { error, imageId, collectionId });
		throw error;
	}
}

/**
 * Remueve una colección de una imagen.
 */
export async function removeCollectionFromImage(imageId: string, collectionId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo colección ${collectionId} de imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/collections/${collectionId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API removeCollectionFromImage', { error, imageId, collectionId });
		throw error;
	}
}
