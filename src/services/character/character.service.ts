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
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { fromDrizzleCharacter, fromDrizzleCharacters } from '@/transformers/character/transformer';
import type {
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterUpdateInput,
	CharacterWithStats,
} from '@/types/entities/character';

// Logger específico para el servicio
const logger = serverLogger.withContext('CharacterService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/characters', '/settings/characters', '/dashboard/characters', '/api/characters'];

// Eventos del servicio de personajes
export const CHARACTER_EVENTS = {
	CREATED: 'character:created',
	UPDATED: 'character:updated',
	DELETED: 'character:deleted',
	STATS_UPDATED: 'character:stats:updated',
} as const;

// Tipos de entrada
export interface GetCharactersResult {
	characters: CharacterWithStats[];
	total: number;
}

/**
 * Clase de error personalizada para operaciones de Character
 */
export class CharacterServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'CharacterServiceError';
	}
}

/**
 * Notifica cambios en los personajes a través del sistema de eventos
 */
export const notifyCharacterChange = async (
	action: 'create' | 'update' | 'delete',
	character: CharacterWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = CHARACTER_EVENTS.CREATED;
				break;
			case 'update':
				eventType = CHARACTER_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = CHARACTER_EVENTS.DELETED;
				break;
			default:
				eventType = 'character:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'characters:modified',
			data: { action, character },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);

		logger.info(`🔔 Notificado cambio en personaje: ${action}`, { characterId: character.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en personaje: ${action}`, { error, characterId: character.id });
	}
};

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
				category: characters.category,
				isPublic: characters.isPublic,
				isFavorite: characters.isFavorite,
				totalImages: characters.totalImages,
				totalVideos: characters.totalVideos,
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
				shortcut: characters.shortcut,
				category: characters.category,
				level: characters.level,
				class: characters.class,
				race: characters.race,
				type: characters.type,
				alignment: characters.alignment,
				backstory: characters.backstory,
				stats: characters.stats,
				psychologicalProfile: characters.psychologicalProfile,
				socialProfile: characters.socialProfile,
				relationships: characters.relationships,
				goals: characters.goals,
				fears: characters.fears,
				beliefs: characters.beliefs,
				personality: characters.personality,
				skills: characters.skills,
				abilities: characters.abilities,
				sortBy: characters.sortBy,
				filters: characters.filters,
				featuredImage: characters.featuredImage,
				isFavorite: characters.isFavorite,
				createdAt: characters.createdAt,
				updatedAt: characters.updatedAt,
			})
			.from(characters)
			.orderBy(desc(characters.createdAt));

		const transformedCharacters = drizzleCharacters.map((rawCharacter) => ({
			...rawCharacter,
			isFavorite: Boolean(rawCharacter.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
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
				shortcut: data.shortcut || null,
				category: data.category || null,
				level: data.level || null,
				class: data.class || null,
				race: data.race || null,
				type: data.type || null,
				alignment: data.alignment || null,
				backstory: data.backstory || null,
				stats: data.stats || null,
				psychologicalProfile: data.psychologicalProfile || null,
				socialProfile: data.socialProfile || null,
				relationships: data.relationships || null,
				goals: data.goals || null,
				fears: data.fears || null,
				beliefs: data.beliefs || null,
				personality: data.personality || null,
				skills: data.skills || null,
				abilities: data.abilities || null,
				sortBy: data.sortBy || null,
				filters: data.filters || null,
				featuredImage: data.featuredImage || null,
				isFavorite: data.isFavorite || false,
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
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.level !== undefined) updateData.level = data.level;
		if (data.class !== undefined) updateData.class = data.class;
		if (data.race !== undefined) updateData.race = data.race;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.alignment !== undefined) updateData.alignment = data.alignment;
		if (data.backstory !== undefined) updateData.backstory = data.backstory;
		if (data.stats !== undefined) updateData.stats = data.stats;
		if (data.psychologicalProfile !== undefined) updateData.psychologicalProfile = data.psychologicalProfile;
		if (data.socialProfile !== undefined) updateData.socialProfile = data.socialProfile;
		if (data.relationships !== undefined) updateData.relationships = data.relationships;
		if (data.goals !== undefined) updateData.goals = data.goals;
		if (data.fears !== undefined) updateData.fears = data.fears;
		if (data.beliefs !== undefined) updateData.beliefs = data.beliefs;
		if (data.personality !== undefined) updateData.personality = data.personality;
		if (data.skills !== undefined) updateData.skills = data.skills;
		if (data.abilities !== undefined) updateData.abilities = data.abilities;
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
		if (data.filters !== undefined) updateData.filters = data.filters;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

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
