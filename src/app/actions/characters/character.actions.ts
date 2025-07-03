/**
 * @file Actions para la entidad Character - Migradas a API calls
 * @module app/actions/characters/character.actions
 * @description Funciones que llaman a las rutas API de personajes
 * @updated 2025-01-27
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { CharacterCreateInput, CharacterUpdateInput, CharacterWithStats } from '@/types/entities/character';

const logger = clientLogger.withContext('CharacterActions');
const API_BASE = '/api/characters';

/**
 * Obtiene todos los personajes con estadísticas.
 */
export async function getCharacters(): Promise<CharacterWithStats[]> {
	try {
		logger.info('👤 Obteniendo personajes via API');

		const response = await fetch(API_BASE);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		logger.error('❌ Error en API getCharacters', { error });
		throw error;
	}
}

/**
 * Obtiene un único personaje por su ID.
 */
export async function getCharacter(id: string): Promise<CharacterWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo personaje ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getCharacter: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo personaje.
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterWithStats> {
	try {
		logger.info('📝 Creando personaje via API', { name: data.name });

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
		logger.error('❌ Error en API createCharacter', { error, data });
		throw error;
	}
}

/**
 * Actualiza un personaje existente.
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterWithStats> {
	try {
		logger.info(`🔄 Actualizando personaje ${id} via API`);

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
		logger.error(`❌ Error en API updateCharacter: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un personaje.
 */
export async function deleteCharacter(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando personaje ${id} via API`);

		const response = await fetch(`${API_BASE}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error(`❌ Error en API deleteCharacter: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes asociadas a un personaje.
 */
export async function getCharacterImages(characterId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes de personaje ${characterId} via API`);

		const response = await fetch(`${API_BASE}/${characterId}/images`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		logger.error(`❌ Error en API getCharacterImages: ${characterId}`, { error });
		throw error;
	}
}

/**
 * Agrega un personaje a una imagen.
 */
export async function addCharacterToImage(imageId: string, characterId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando personaje ${characterId} a imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/characters/${characterId}`, {
			method: 'POST',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API addCharacterToImage', { error, imageId, characterId });
		throw error;
	}
}

/**
 * Remueve un personaje de una imagen.
 */
export async function removeCharacterFromImage(imageId: string, characterId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo personaje ${characterId} de imagen ${imageId} via API`);

		const response = await fetch(`/api/images/${imageId}/characters/${characterId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		logger.error('❌ Error en API removeCharacterFromImage', { error, imageId, characterId });
		throw error;
	}
}
