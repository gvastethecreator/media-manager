/**
 * @file Actions para la entidad Tag - Migradas a API calls
 * @module app/actions/tags/tag.actions
 * @description Funciones que llaman a las rutas API de etiquetas
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';

const logger = clientLogger.withContext('TagActions');
const API_BASE = '/api/tags';

/**
 * Obtiene todas las etiquetas con estadísticas.
 */
export async function getTags(): Promise<TagWithStats[]> {
	try {
		logger.info('🏷️ Obteniendo etiquetas via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getTags', { error });
		throw error;
	}
}

/**
 * Obtiene una única etiqueta por su ID.
 */
export async function getTag(id: string): Promise<TagWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo etiqueta ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getTag: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva etiqueta.
 */
export async function createTag(data: TagCreateInput): Promise<TagWithStats> {
	try {
		logger.info('📝 Creando etiqueta via API', { name: data.name });

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
		logger.error('❌ Error en API createTag', { error, data });
		throw error;
	}
}

/**
 * Actualiza una etiqueta existente.
 */
export async function updateTag(id: string, data: TagUpdateInput): Promise<TagWithStats> {
	try {
		logger.info(`🔄 Actualizando etiqueta ${id} via API`);

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
		logger.error(`❌ Error en API updateTag: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una etiqueta.
 */
export async function deleteTag(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando etiqueta ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteTag: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes asociadas a una etiqueta.
 */
export async function getTagImages(tagId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes de etiqueta ${tagId} via API`);

		const response = await fetch(`${API_BASE}/${tagId}/images`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getTagImages: ${tagId}`, { error });
		throw error;
	}
}

/**
 * Agrega una etiqueta a una imagen.
 */
export async function addTagToImage(imageId: string, tagId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando etiqueta ${tagId} a imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/tags/${tagId}`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API addTagToImage', { error, imageId, tagId });
		throw error;
	}
}

/**
 * Remueve una etiqueta de una imagen.
 */
export async function removeTagFromImage(imageId: string, tagId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo etiqueta ${tagId} de imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/tags/${tagId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API removeTagFromImage', { error, imageId, tagId });
		throw error;
	}
}