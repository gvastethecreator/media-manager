'use server';

/**
 * @file Server Actions para la entidad Character
 * @module app/actions/characters/character.actions
 * @description Acciones CRUD y de gestión de relaciones para los Personajes.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import {
    fromPrismaCharacter,
    fromPrismaCharacters,
    mapCharacterSearchOptionsToPrisma,
    mapCreateCharacterDataToPrisma,
    mapUpdateCharacterDataToPrisma,
} from '@/transformers/character';
import type {
    CharacterBase,
    CharacterComplete,
    CharacterCreateInput,
    CharacterSearchOptions,
    CharacterUpdateInput,
} from '@/types/entities/character';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('CharacterActions');

// Objeto de inclusión para obtener un personaje completo con todas sus relaciones y conteos.
const CHARACTER_INCLUDE = {
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
	_count: true,
};

// Re-exportar tipos extendidos para compatibilidad
export type CharacterWithImages = CharacterComplete;
export type CharacterWithStats = CharacterComplete;

/**
 * Revalida las rutas de caché relacionadas con los personajes.
 */
async function revalidateCharacterPaths() {
	revalidatePath('/characters');
	revalidatePath('/settings/characters');
}

/**
 * Busca y obtiene personajes según los criterios de búsqueda.
 */
export async function searchCharacters(options: CharacterSearchOptions): Promise<CharacterComplete[]> {
	logger.info('🔍 Buscando personajes', { options });
	const prismaOptions = mapCharacterSearchOptionsToPrisma(options);
	const characters = await prisma.character.findMany({
		...prismaOptions,
		include: CHARACTER_INCLUDE,
	});
	return fromPrismaCharacters(characters);
}

/**
 * Obtiene un único personaje por su ID.
 */
export async function getCharacter(id: string): Promise<CharacterComplete | null> {
	logger.info(`🔍 Obteniendo personaje por ID: ${id}`);
	const character = await prisma.character.findUnique({
		where: { id },
		include: CHARACTER_INCLUDE,
	});
	if (!character) {
		logger.warn(`Personaje no encontrado: ${id}`);
		return null;
	}
	return fromPrismaCharacter(character);
}

/**
 * Alias para getCharacter - para compatibilidad
 */
export const getCharacterById = getCharacter;

/**
 * Obtiene las imágenes de un personaje específico.
 */
export async function getCharacterImages(characterId: string): Promise<any[]> {
	logger.info(`🖼️ Obteniendo imágenes del personaje: ${characterId}`);
	const character = await prisma.character.findUnique({
		where: { id: characterId },
		include: {
			images: {
				orderBy: { createdAt: 'desc' },
			},
		},
	});

	if (!character) {
		logger.warn(`Personaje no encontrado: ${characterId}`);
		return [];
	}

	return character.images;
}

/**
 * Crea un nuevo personaje.
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterBase> {
	logger.info('➕ Creando nuevo personaje:', { name: data.name });
	const prismaData = mapCreateCharacterDataToPrisma(data);
	const newCharacter = await prisma.character.create({ data: prismaData });
	await revalidateCharacterPaths();
	return newCharacter;
}

/**
 * Actualiza un personaje existente.
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterBase> {
	logger.info(`🔄 Actualizando personaje: ${id}`);
	const prismaData = mapUpdateCharacterDataToPrisma(data);
	const updatedCharacter = await prisma.character.update({
		where: { id },
		data: prismaData,
	});
	await revalidateCharacterPaths();
	revalidatePath(`/characters/${id}`);
	return updatedCharacter;
}

/**
 * Elimina un personaje.
 */
export async function deleteCharacter(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando personaje: ${id}`);
	await prisma.character.delete({ where: { id } });
	await revalidateCharacterPaths();
	revalidatePath('/characters');
}

/**
 * Añade una imagen a un personaje.
 */
export async function addImageToCharacter(characterId: string, imageId: string): Promise<void> {
	logger.info(`🖼️ Añadiendo imagen ${imageId} a personaje ${characterId}`);
	await prisma.character.update({
		where: { id: characterId },
		data: { images: { connect: { id: imageId } } },
	});
	revalidatePath(`/characters/${characterId}`);
}

/**
 * Elimina una imagen de un personaje.
 */
export async function removeImageFromCharacter(characterId: string, imageId: string): Promise<void> {
	logger.info(`🖼️ Eliminando imagen ${imageId} de personaje ${characterId}`);
	await prisma.character.update({
		where: { id: characterId },
		data: { images: { disconnect: { id: imageId } } },
	});
	revalidatePath(`/characters/${characterId}`);
}
