/**
 * @file Servicio de gestión de personajes
 * @module services/character/character.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de personajes
 * @updated 2025-01-27
 */

import * as crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
// Drizzle imports
import { db } from '@/lib/drizzle';
import { characters } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';
import { fromDrizzleCharacter, fromDrizzleCharacters } from '@/transformers/character/transformer';
import type {
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterUpdateInput,
	CharacterWithStats,
} from '@/types/entities/character';
import { CharacterServiceError } from './character-errors';
import { CHARACTER_EVENTS, notifyCharacterChange } from './character-events';
import type { GetCharactersResult } from './character-types';

// Re-exports para compatibilidad backward
export { CharacterServiceError, createCharacterError } from './character-errors';
export { CHARACTER_EVENTS, notifyCharacterChange } from './character-events';
export type { GetCharactersResult } from './character-types';

// Logger específico para el servicio
const logger = serverLogger.withContext('CharacterService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/characters', '/settings/characters', '/dashboard/characters', '/api/characters'];

/**
 * Revalida las rutas de caché relacionadas con los personajes
 */
const revalidateCharacterPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	logger.info('🔄 Rutas de personajes revalidadas');
};

/**
 * Obtiene un personaje por su ID con estadísticas optimizadas
 */
export async function getCharacter(id: string): Promise<CharacterWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info(`🔍 Obteniendo personaje por ID: ${id}`);

		const drizzleCharacter = await db
			.select({
				id: characters.id,
				name: characters.name,
				description: characters.description,
				emoji: characters.emoji,
				color: characters.color,

				isFavorite: characters.isFavorite,
				// totalImages: moved to EntityAggregates
				// totalVideos: moved to EntityAggregates
				age: characters.age,
				gender: characters.gender,
				species: characters.species,
				occupation: characters.occupation,
				personality: characters.personality,
				background: characters.background,
				relationships: characters.relationships,
				skills: characters.skills,
				equipment: characters.equipment,
				notes: characters.notes,
				featuredImage: characters.featuredImage,
				parentId: characters.parentId,
				createdAt: characters.createdAt,
				updatedAt: characters.updatedAt,
			})
			.from(characters)
			.where(eq(characters.id, id))
			.limit(1);

		if (drizzleCharacter.length === 0) {
			logger.warn(`Personaje no encontrado: ${id}`);
			return null;
		}

		const rawCharacter = drizzleCharacter[0];

		const transformedCharacter = {
			...rawCharacter,
			isFavorite: Boolean(rawCharacter.isFavorite),
		};

		const result = fromDrizzleCharacter(transformedCharacter as any);
		if (!result) {
			throw new CharacterServiceError('Error al transformar personaje obtenido', 'TRANSFORM_ERROR');
		}

		logger.info(`✅ Personaje encontrado: ${result.name}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener personaje ${id}`, { error });
		throw new CharacterServiceError(
			`Error al obtener personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_CHARACTER_FAILED',
			error
		);
	}
}

/**
 * Obtiene personajes con opciones de búsqueda y filtrado
 */
export async function getCharacters(options: CharacterSearchOptions = {}): Promise<GetCharactersResult> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info('🔍 Obteniendo personajes con opciones:', options);

		// Por ahora, implementación básica sin filtros complejos
		const drizzleCharacters = await db
			.select({
				id: characters.id,
				name: characters.name,
				description: characters.description,
				emoji: characters.emoji,
				color: characters.color,
				age: characters.age,
				gender: characters.gender,
				species: characters.species,
				occupation: characters.occupation,
				personality: characters.personality,
				background: characters.background,
				relationships: characters.relationships,
				skills: characters.skills,
				equipment: characters.equipment,
				notes: characters.notes,
				featuredImage: characters.featuredImage,

				isFavorite: characters.isFavorite,
				// totalImages: moved to EntityAggregates
				// totalVideos: moved to EntityAggregates
				parentId: characters.parentId,
				createdAt: characters.createdAt,
				updatedAt: characters.updatedAt,
			})
			.from(characters)
			.orderBy(desc(characters.createdAt));

		const transformedCharacters = drizzleCharacters.map((rawCharacter: any) => ({
			...rawCharacter,
			isFavorite: Boolean(rawCharacter.isFavorite),
			// Mapear campos del esquema actual al formato esperado por el transformer
			level: 1, // default temporal
			class: rawCharacter.occupation || null,
			race: rawCharacter.species || null,
			type: 'character',
			alignment: null,
			backstory: rawCharacter.background || null,
			stats: null,
			psychologicalProfile: null,
			socialProfile: null,
			goals: null,
			fears: null,
			beliefs: null,
			abilities: rawCharacter.equipment || null,
			sortBy: null,
			filters: null,
			shortcut: null,
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: rawCharacter.totalImages || 0,
				videos: rawCharacter.totalVideos || 0,
				tags: 0,
				groups: 0,
				properties: 0,
				collections: 0,
				albums: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				relatedCharacters: 0,
				relatedTo: 0,
			},
		}));

		const charactersResult = fromDrizzleCharacters(transformedCharacters as any);

		const total = transformedCharacters.length; // TODO: implementar conteo separado

		logger.info(`✅ ${charactersResult.length} personajes encontrados`);
		return {
			characters: charactersResult,
			total,
		};
	} catch (error) {
		logger.error('❌ Error al obtener personajes', { error, options });
		throw new CharacterServiceError(
			`Error al obtener personajes: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_CHARACTERS_FAILED',
			error
		);
	}
}

/**
 * Crea un nuevo personaje
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterWithStats> {
	try {
		logger.info('📝 Creando nuevo personaje', { name: data.name });

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(characters)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '👤',
				color: data.color || '#3b82f6',
				category: data.category || null,
				age: data.age || null,
				gender: data.gender || null,
				species: data.species || null,
				occupation: data.occupation || null,
				personality: data.personality || null,
				background: data.background || null,
				relationships: data.relationships || null,
				skills: data.skills || null,
				equipment: data.equipment || null,
				notes: data.notes || null,
				featuredImage: data.featuredImage || null,
				parentId: data.parentId || null,

				isFavorite: data.isFavorite,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newCharacter = result[0];

		// Obtener el personaje creado con estadísticas
		const createdCharacter = await getCharacter(newCharacter.id);
		if (!createdCharacter) {
			throw new CharacterServiceError('Error al obtener personaje creado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();

		// Notificar creación
		await notifyCharacterChange('create', createdCharacter);

		logger.info(`✅ Personaje creado exitosamente: ${createdCharacter.name}`, { id: createdCharacter.id });
		return createdCharacter;
	} catch (error) {
		logger.error('❌ Error al crear personaje', { error, data });
		throw new CharacterServiceError(
			`Error al crear personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'CREATE_CHARACTER_FAILED',
			error
		);
	}
}

/**
 * Actualiza un personaje existente
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterWithStats> {
	try {
		logger.info(`📝 Actualizando personaje: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar si el personaje existe
		const existingCharacter = await db
			.select({ id: characters.id })
			.from(characters)
			.where(eq(characters.id, id))
			.limit(1);

		if (existingCharacter.length === 0) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		const updateData: any = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos que se envían
		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.description !== undefined) {
			updateData.description = data.description;
		}
		if (data.emoji !== undefined) {
			updateData.emoji = data.emoji;
		}
		if (data.color !== undefined) {
			updateData.color = data.color;
		}
		if (data.category !== undefined) {
			updateData.category = data.category;
		}
		if (data.age !== undefined) {
			updateData.age = data.age;
		}
		if (data.gender !== undefined) {
			updateData.gender = data.gender;
		}
		if (data.species !== undefined) {
			updateData.species = data.species;
		}
		if (data.occupation !== undefined) {
			updateData.occupation = data.occupation;
		}
		if (data.personality !== undefined) {
			updateData.personality = data.personality;
		}
		if (data.background !== undefined) {
			updateData.background = data.background;
		}
		if (data.relationships !== undefined) {
			updateData.relationships = data.relationships;
		}
		if (data.skills !== undefined) {
			updateData.skills = data.skills;
		}
		if (data.equipment !== undefined) {
			updateData.equipment = data.equipment;
		}
		if (data.notes !== undefined) {
			updateData.notes = data.notes;
		}
		if (data.featuredImage !== undefined) {
			updateData.featuredImage = data.featuredImage;
		}
		if (data.parentId !== undefined) {
			updateData.parentId = data.parentId;
		}

		if (data.isFavorite !== undefined) {
			updateData.isFavorite = data.isFavorite;
		}

		await db.update(characters).set(updateData).where(eq(characters.id, id));

		// Obtener el personaje actualizado con estadísticas
		const updatedCharacter = await getCharacter(id);
		if (!updatedCharacter) {
			throw new CharacterServiceError('Error al obtener personaje actualizado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();
		revalidatePath(`/characters/${id}`);

		// Notificar actualización
		await notifyCharacterChange('update', updatedCharacter);

		logger.info(`✅ Personaje actualizado exitosamente: ${updatedCharacter.name}`, { id });
		return updatedCharacter;
	} catch (error) {
		logger.error(`❌ Error al actualizar personaje ${id}`, { error, data });
		throw new CharacterServiceError(
			`Error al actualizar personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'UPDATE_CHARACTER_FAILED',
			error
		);
	}
}

/**
 * Elimina un personaje
 */
export async function deleteCharacter(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando personaje: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Verificar si el personaje existe
		const existingCharacter = await db
			.select({ id: characters.id, name: characters.name })
			.from(characters)
			.where(eq(characters.id, id))
			.limit(1);

		if (existingCharacter.length === 0) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		await db.delete(characters).where(eq(characters.id, id));

		// Revalidar rutas
		await revalidateCharacterPaths();

		// Notificar eliminación
		await notifyCharacterChange('delete', { id });

		logger.info(`✅ Personaje eliminado exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar personaje ${id}`, { error });
		throw new CharacterServiceError(
			`Error al eliminar personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'DELETE_CHARACTER_FAILED',
			error
		);
	}
}

/**
 * Cambia el estado de favorito de un personaje
 */
export async function toggleCharacterFavorite(id: string): Promise<CharacterWithStats> {
	try {
		logger.info(`⭐ Cambiando estado de favorito del personaje: ${id}`);

		// **MIGRACIÓN A DRIZZLE**
		// Obtener estado actual
		const currentCharacter = await db
			.select({ isFavorite: characters.isFavorite })
			.from(characters)
			.where(eq(characters.id, id))
			.limit(1);

		if (currentCharacter.length === 0) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		const newFavoriteState = !currentCharacter[0].isFavorite;

		await db
			.update(characters)
			.set({
				isFavorite: newFavoriteState,
				updatedAt: new Date(),
			})
			.where(eq(characters.id, id));

		// Obtener el personaje actualizado con estadísticas
		const updatedCharacter = await getCharacter(id);
		if (!updatedCharacter) {
			throw new CharacterServiceError('Error al obtener personaje actualizado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();

		// Notificar actualización
		await notifyCharacterChange('update', updatedCharacter);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${updatedCharacter.isFavorite}`);
		return updatedCharacter;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito del personaje ${id}`, { error });
		throw new CharacterServiceError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_FAVORITE_FAILED',
			error
		);
	}
}

/**
 * Busca personajes por nombre o descripción
 */
export async function searchCharacters(query: string): Promise<CharacterWithStats[]> {
	try {
		logger.info(`🔍 Buscando personajes: "${query}"`);

		const searchOptions: CharacterSearchOptions = {
			filters: {
				search: query,
			},
			orderBy: { name: 'asc' },
		};

		const result = await getCharacters(searchOptions);
		logger.info(`✅ ${result.characters.length} personajes encontrados para "${query}"`);
		return result.characters;
	} catch (error) {
		logger.error(`❌ Error al buscar personajes: "${query}"`, { error });
		throw new CharacterServiceError(
			`Error al buscar personajes: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'SEARCH_CHARACTERS_FAILED',
			error
		);
	}
}

/**
 * Obtiene personajes por categoría
 */
export async function getCharactersByCategory(category: string): Promise<CharacterWithStats[]> {
	try {
		logger.info(`🔍 Obteniendo personajes por categoría: ${category}`);

		const searchOptions: CharacterSearchOptions = {
			filters: {
				category: [category],
			},
			orderBy: { name: 'asc' },
		};

		const result = await getCharacters(searchOptions);
		logger.info(`✅ ${result.characters.length} personajes encontrados en categoría "${category}"`);
		return result.characters;
	} catch (error) {
		logger.error(`❌ Error al obtener personajes por categoría: ${category}`, { error });
		throw new CharacterServiceError(
			`Error al obtener personajes por categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_CHARACTERS_BY_CATEGORY_FAILED',
			error
		);
	}
}

/**
 * Obtiene personajes favoritos
 */
export async function getFavoriteCharacters(): Promise<CharacterWithStats[]> {
	try {
		logger.info('⭐ Obteniendo personajes favoritos');

		const searchOptions: CharacterSearchOptions = {
			filters: {
				isFavorite: true,
			},
			orderBy: { name: 'asc' },
		};

		const result = await getCharacters(searchOptions);
		logger.info(`✅ ${result.characters.length} personajes favoritos encontrados`);
		return result.characters;
	} catch (error) {
		logger.error('❌ Error al obtener personajes favoritos', { error });
		throw new CharacterServiceError(
			`Error al obtener personajes favoritos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_FAVORITE_CHARACTERS_FAILED',
			error
		);
	}
}

/**
 * Clase de servicio para gestión de personajes
 */
export class CharacterService {
	async getCharacters(filters?: any): Promise<{ characters: CharacterWithStats[]; total: number }> {
		const result = await getCharacters(filters || {});
		return result;
	}

	async getCharacterById(id: string): Promise<CharacterWithStats | null> {
		return await getCharacter(id);
	}

	async createCharacter(data: CharacterCreateInput): Promise<CharacterWithStats> {
		return await createCharacter(data);
	}

	async updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterWithStats | null> {
		try {
			return await updateCharacter(id, data);
		} catch (error) {
			if (error instanceof CharacterServiceError && error.code === 'CHARACTER_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	}

	async deleteCharacter(id: string): Promise<boolean> {
		try {
			await deleteCharacter(id);
			return true;
		} catch (error) {
			if (error instanceof CharacterServiceError && error.code === 'CHARACTER_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}

	async getCharacterImages(id: string): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes del personaje
		logger.info(`Obteniendo imágenes del personaje ${id}`);
		return [];
	}

	async getRecentCharacterImages(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes recientes del personaje
		logger.info(`Obteniendo imágenes recientes del personaje ${id} (limit: ${limit})`);
		return [];
	}
}

// Servicio principal
const characterService = {
	getCharacter,
	getCharacters,
	createCharacter,
	updateCharacter,
	deleteCharacter,
	toggleCharacterFavorite,
	searchCharacters,
	getCharactersByCategory,
	getFavoriteCharacters,
	notifyCharacterChange,
	CHARACTER_EVENTS,
	CharacterServiceError,
};

export default characterService;
