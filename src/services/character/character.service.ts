/**
 * @file Servicio de gestión de personajes
 * @module services/character/character.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de personajes
 * @updated 2025-01-27
 */

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { mapCharacterSearchOptionsToPrisma } from '@/transformers/character/mappers';
import {
	fromPrismaCharacter,
	fromPrismaCharacters,
	toPrismaCharacterCreate,
	toPrismaCharacterUpdate,
} from '@/transformers/character/transformer';
import type {
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterUpdateInput,
	CharacterWithStats,
} from '@/types/entities/character';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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

/**
 * 📊 Consulta optimizada para Character con conteos (sin relaciones completas).
 * Mejora significativa de rendimiento vs include completo.
 */
const CHARACTER_SELECT_WITH_STATS = {
	id: true,
	name: true,
	description: true,
	emoji: true,
	color: true,
	shortcut: true,
	category: true,
	level: true,
	class: true,
	race: true,
	type: true,
	alignment: true,
	backstory: true,
	stats: true,
	psychologicalProfile: true,
	socialProfile: true,
	relationships: true,
	goals: true,
	fears: true,
	beliefs: true,
	personality: true,
	skills: true,
	abilities: true,
	sortBy: true,
	filters: true,
	featuredImage: true,
	isFavorite: true,
	createdAt: true,
	updatedAt: true,
	_count: {
		select: {
			images: true,
			videos: true,
			tags: true,
			groups: true,
			properties: true,
			collections: true,
			albums: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			relatedCharacters: true,
			relatedTo: true,
		},
	},
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
		logger.info(`🔍 Obteniendo personaje por ID: ${id}`);
		const prisma = await getPrismaClient();

		const character = await prisma.character.findUnique({
			where: { id },
			select: CHARACTER_SELECT_WITH_STATS,
		});

		if (!character) {
			logger.warn(`Personaje no encontrado: ${id}`);
			return null;
		}

		const result = fromPrismaCharacter(character);
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
		logger.info('🔍 Obteniendo personajes', { options });
		const prisma = await getPrismaClient();

		const prismaOptions = mapCharacterSearchOptionsToPrisma(options);

		// Obtener personajes con conteo total
		const [characters, total] = await Promise.all([
			prisma.character.findMany({
				...prismaOptions,
				select: CHARACTER_SELECT_WITH_STATS,
			}),
			prisma.character.count({
				where: prismaOptions.where,
			}),
		]);

		const transformedCharacters = fromPrismaCharacters(characters);

		logger.info(`✅ ${transformedCharacters.length} personajes obtenidos`);
		return {
			characters: transformedCharacters,
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
		const prisma = await getPrismaClient();

		const prismaData = toPrismaCharacterCreate(data);

		const newCharacter = await prisma.character.create({
			data: prismaData,
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const result = fromPrismaCharacter(newCharacter);
		if (!result) {
			throw new CharacterServiceError('Error al transformar personaje creado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();

		// Notificar creación
		await notifyCharacterChange('create', result);

		logger.info(`✅ Personaje creado exitosamente: ${result.name}`, { id: result.id });
		return result;
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
		const prisma = await getPrismaClient();

		// Verificar si el personaje existe
		const existingCharacter = await prisma.character.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingCharacter) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		const prismaData = toPrismaCharacterUpdate(data);

		const updatedCharacter = await prisma.character.update({
			where: { id },
			data: prismaData,
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const result = fromPrismaCharacter(updatedCharacter);
		if (!result) {
			throw new CharacterServiceError('Error al transformar personaje actualizado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();
		revalidatePath(`/characters/${id}`);

		// Notificar actualización
		await notifyCharacterChange('update', result);

		logger.info(`✅ Personaje actualizado exitosamente: ${result.name}`, { id });
		return result;
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
		const prisma = await getPrismaClient();

		// Verificar si el personaje existe
		const existingCharacter = await prisma.character.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!existingCharacter) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		await prisma.character.delete({
			where: { id },
		});

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
		const prisma = await getPrismaClient();

		// Obtener estado actual
		const currentCharacter = await prisma.character.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!currentCharacter) {
			throw new CharacterServiceError('Personaje no encontrado', 'CHARACTER_NOT_FOUND');
		}

		const updatedCharacter = await prisma.character.update({
			where: { id },
			data: { isFavorite: !currentCharacter.isFavorite },
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const result = fromPrismaCharacter(updatedCharacter);
		if (!result) {
			throw new CharacterServiceError('Error al transformar personaje actualizado', 'TRANSFORM_ERROR');
		}

		// Revalidar rutas
		await revalidateCharacterPaths();

		// Notificar actualización
		await notifyCharacterChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
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
			search: query,
			orderBy: 'name',
			orderDirection: 'asc',
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
			category,
			orderBy: 'name',
			orderDirection: 'asc',
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
			onlyFavorites: true,
			orderBy: 'name',
			orderDirection: 'asc',
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
