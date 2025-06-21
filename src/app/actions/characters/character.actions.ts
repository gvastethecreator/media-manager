'use server';

/**
 * @file Server Actions para la entidad Character
 * @module app/actions/characters/character.actions
 * @description Acciones optimizadas para Character con patrón CharacterWithStats.
 */

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import {
    fromPrismaCharacter,
    fromPrismaCharacters,
    toPrismaCharacterCreate,
    toPrismaCharacterUpdate,
} from '@/transformers/character/transformer';
import { mapCharacterSearchOptionsToPrisma } from '@/transformers/character/mappers';
import type {
    CharacterBase,
    CharacterWithStats,
    CharacterCreateInput,
    CharacterSearchOptions,
    CharacterUpdateInput,
} from '@/types/entities/character';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('CharacterActions');

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

/**
 * 🔍 Obtiene un personaje por ID con estadísticas optimizadas.
 */
export async function getCharacter(id: string): Promise<CharacterWithStats | null> {
	logger.info(`🔍 Obteniendo personaje: ${id}`);

	try {
		const prisma = await getPrismaClient();
		const character = await prisma.character.findUnique({
			where: { id },
			select: CHARACTER_SELECT_WITH_STATS,
		});

		if (!character) {
			logger.warn(`❌ Personaje no encontrado: ${id}`);
			return null;
		}

		const result = fromPrismaCharacter(character);
		logger.info(`✅ Personaje obtenido: ${result?.name}`);
		return result;
	} catch (error) {
		logger.error('❌ Error al obtener personaje', { error, id });
		throw new Error(`Error al obtener personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * 🔍 Obtiene múltiples personajes con estadísticas optimizadas.
 */
export async function getCharacters(options: CharacterSearchOptions = {}): Promise<CharacterWithStats[]> {
	logger.info('🔍 Obteniendo personajes', { options });

	try {
		const prisma = await getPrismaClient();
		const prismaOptions = mapCharacterSearchOptionsToPrisma(options);

		const characters = await prisma.character.findMany({
			...prismaOptions,
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const results = fromPrismaCharacters(characters);
		logger.info(`✅ ${results.length} personajes obtenidos`);
		return results;
	} catch (error) {
		logger.error('❌ Error al obtener personajes', { error, options });
		throw new Error(`Error al obtener personajes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * ➕ Crea un nuevo personaje.
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterWithStats> {
	logger.info('➕ Creando personaje', { name: data.name });

	try {
		const prisma = await getPrismaClient();
		const prismaData = toPrismaCharacterCreate(data);

		const newCharacter = await prisma.character.create({
			data: prismaData,
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const result = fromPrismaCharacter(newCharacter);
		if (!result) {
			throw new Error('Error al transformar personaje creado');
		}

		await revalidateCharacterPaths();
		logger.info(`✅ Personaje creado: ${result.name} (${result.id})`);
		return result;
	} catch (error) {
		logger.error('❌ Error al crear personaje', { error, data });
		throw new Error(`Error al crear personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * 🔄 Actualiza un personaje existente.
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterWithStats> {
	logger.info(`🔄 Actualizando personaje: ${id}`);

	try {
		const prisma = await getPrismaClient();
		const prismaData = toPrismaCharacterUpdate(data);

		const updatedCharacter = await prisma.character.update({
			where: { id },
			data: prismaData,
			select: CHARACTER_SELECT_WITH_STATS,
		});

		const result = fromPrismaCharacter(updatedCharacter);
		if (!result) {
			throw new Error('Error al transformar personaje actualizado');
		}

		await revalidateCharacterPaths();
		revalidatePath(`/characters/${id}`);
		logger.info(`✅ Personaje actualizado: ${result.name}`);
		return result;
	} catch (error) {
		logger.error('❌ Error al actualizar personaje', { error, id, data });
		throw new Error(`Error al actualizar personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * 🗑️ Elimina un personaje.
 */
export async function deleteCharacter(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando personaje: ${id}`);

	try {
		const prisma = await getPrismaClient();
		await prisma.character.delete({ where: { id } });

		await revalidateCharacterPaths();
		logger.info(`✅ Personaje eliminado: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar personaje', { error, id });
		throw new Error(`Error al eliminar personaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * 🔄 Revalida las rutas de caché relacionadas con personajes.
 */
async function revalidateCharacterPaths(): Promise<void> {
	const paths = ['/characters', '/settings/characters'];

	for (const path of paths) {
		revalidatePath(path);
	}

	logger.info('🔄 Rutas de personajes revalidadas');
}

// Alias para compatibilidad con código existente
export const getCharacterById = getCharacter;
export const searchCharacters = getCharacters;
