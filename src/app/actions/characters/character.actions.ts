'use server';

/**
 * @file Server Actions para la entidad Character (Controladores delgados)
 * @module app/actions/characters/character.actions
 * @description Actions optimizadas que actúan como controladores delgados llamando al servicio
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
	createCharacter as createCharacterService,
	deleteCharacter as deleteCharacterService,
	getCharacter as getCharacterService,
	getCharacters as getCharactersService,
	searchCharacters as searchCharactersService,
	toggleCharacterFavorite as toggleCharacterFavoriteService,
	updateCharacter as updateCharacterService,
	type GetCharactersResult,
} from '@/services/character';
import type {
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterUpdateInput,
	CharacterWithStats,
} from '@/types/entities/character';

const logger = serverLogger.withContext('CharacterActions');

/**
 * 🔍 Obtiene un personaje por ID con estadísticas optimizadas.
 */
export async function getCharacter(id: string): Promise<CharacterWithStats | null> {
	logger.info(`🔍 Action: Obteniendo personaje: ${id}`);

	try {
		return await getCharacterService(id);
	} catch (error) {
		logger.error('❌ Action: Error al obtener personaje', { error, id });
		throw error;
	}
}

/**
 * 🔍 Obtiene múltiples personajes con estadísticas optimizadas.
 */
export async function getCharacters(options: CharacterSearchOptions = {}): Promise<CharacterWithStats[]> {
	logger.info('🔍 Action: Obteniendo personajes', { options });

	try {
		const result = await getCharactersService(options);
		return result.characters;
	} catch (error) {
		logger.error('❌ Action: Error al obtener personajes', { error, options });
		throw error;
	}
}

/**
 * 🔍 Obtiene múltiples personajes con estadísticas optimizadas y conteo total.
 */
export async function getCharactersWithTotal(options: CharacterSearchOptions = {}): Promise<GetCharactersResult> {
	logger.info('🔍 Action: Obteniendo personajes con total', { options });

	try {
		return await getCharactersService(options);
	} catch (error) {
		logger.error('❌ Action: Error al obtener personajes con total', { error, options });
		throw error;
	}
}

/**
 * ➕ Crea un nuevo personaje.
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterWithStats> {
	logger.info('➕ Action: Creando personaje', { name: data.name });

	try {
		return await createCharacterService(data);
	} catch (error) {
		logger.error('❌ Action: Error al crear personaje', { error, data });
		throw error;
	}
}

/**
 * 🔄 Actualiza un personaje existente.
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterWithStats> {
	logger.info(`🔄 Action: Actualizando personaje: ${id}`);

	try {
		return await updateCharacterService(id, data);
	} catch (error) {
		logger.error('❌ Action: Error al actualizar personaje', { error, id, data });
		throw error;
	}
}

/**
 * 🗑️ Elimina un personaje.
 */
export async function deleteCharacter(id: string): Promise<void> {
	logger.warn(`🗑️ Action: Eliminando personaje: ${id}`);

	try {
		await deleteCharacterService(id);
	} catch (error) {
		logger.error('❌ Action: Error al eliminar personaje', { error, id });
		throw error;
	}
}

/**
 * ⭐ Cambia el estado de favorito de un personaje.
 */
export async function toggleCharacterFavorite(id: string): Promise<CharacterWithStats> {
	logger.info(`⭐ Action: Cambiando estado de favorito del personaje: ${id}`);

	try {
		return await toggleCharacterFavoriteService(id);
	} catch (error) {
		logger.error('❌ Action: Error al cambiar estado de favorito', { error, id });
		throw error;
	}
}

/**
 * 🔍 Busca personajes por nombre o descripción.
 */
export async function searchCharacters(query: string): Promise<CharacterWithStats[]> {
	logger.info(`🔍 Action: Buscando personajes: "${query}"`);

	try {
		return await searchCharactersService(query);
	} catch (error) {
		logger.error('❌ Action: Error al buscar personajes', { error, query });
		throw error;
	}
}

/**
 * 🖼️ Obtiene las imágenes asociadas a un personaje.
 */
export async function getCharacterImages(id: string): Promise<{ id: string; name: string; path: string }[]> {
	logger.info(`🖼️ Action: Obteniendo imágenes del personaje: ${id}`);

	try {
		// Nota: Esta función necesita ser implementada en el servicio
		// Por ahora retornamos un array vacío
		logger.warn(`⚠️ getCharacterImages no implementada para personaje: ${id}`);
		return [];
	} catch (error) {
		logger.error('❌ Action: Error al obtener imágenes del personaje', { error, id });
		throw error;
	}
}

/**
 * 🔗 Agrega una imagen a un personaje.
 */
export async function addImageToCharacter(characterId: string, imageId: string): Promise<void> {
	logger.info(`🔗 Action: Agregando imagen ${imageId} al personaje ${characterId}`);

	try {
		// Nota: Esta función necesita ser implementada en el servicio
		// Por ahora no hace nada
	} catch (error) {
		logger.error('❌ Action: Error al agregar imagen al personaje', { error, characterId, imageId });
		throw error;
	}
}

/**
 * 🔗 Remueve una imagen de un personaje.
 */
export async function removeImageFromCharacter(characterId: string, imageId: string): Promise<void> {
	logger.info(`🔗 Action: Removiendo imagen ${imageId} del personaje ${characterId}`);

	try {
		// Nota: Esta función necesita ser implementada en el servicio
		// Por ahora no hace nada
	} catch (error) {
		logger.error('❌ Action: Error al remover imagen del personaje', { error, characterId, imageId });
		throw error;
	}
}

// Alias para compatibilidad con código existente
export const getCharacterById = getCharacter;

// Re-exportar tipos para uso externo
export type { CharacterWithStats } from '@/types/entities/character';
