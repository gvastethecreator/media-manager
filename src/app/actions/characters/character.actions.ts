'use server';

import { EntityErrorCode, type SerializableError, createEntityErrorObject } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
	createCharacter as createCharacterTransformer,
	deleteCharacter as deleteCharacterTransformer,
	getCharacterById as getCharacterByIdTransformer,
	searchCharacters as searchCharactersTransformer,
	updateCharacter as updateCharacterTransformer,
} from '@/transformers/character';
import type { CharacterBase } from '@/types/entities/character/base';
import type {
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterUpdateInput,
} from '@/types/entities/character/types';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const characterLogger = serverLogger.withContext('CharacterActions');
const REVALIDATE_PATHS = [
	'/characters',
	'/characters/[id]',
	'/settings/characters',
	'/dashboard/characters',
	'/api/characters',
] as const;

// Función creadora de errores (enfoque funcional)
const createCharacterError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
): SerializableError => {
	return createEntityErrorObject('CharacterError', message, code, cause);
};

/**
 * Revalida todas las rutas relacionadas con personajes
 */
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	characterLogger.info('🔄 Rutas revalidadas');
};

/**
 * Notifica cambios en un personaje a través del sistema de eventos
 */
const notifyCharacterChange = async (
	action: 'create' | 'update' | 'delete',
	character: CharacterBase | { id: string }
) => {
	// Emitir eventos usando el sistema de servidor
	await emit({
		type: 'characters:modified',
		data: { action, character },
	});
	statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);
};

// Interfaces extendidas - 🔧 Tipo completo con todas las propiedades necesarias
export interface CharacterWithStats extends CharacterBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
		relatedCharacters: number;
		relatedTo: number;
	};
	totalSize: number;
	imageCount?: number;
}

export interface CharacterWithImages extends CharacterBase {
	images?: {
		id: string;
		thumbnail: Buffer | null;
		thumbnailWidth: number | null;
		thumbnailHeight: number | null;
		thumbnailSize: number | null;
		url?: string;
	}[];
	recentImages?: (string | null)[];
}

/**
 * 🔍 Busca personajes según los criterios especificados
 */
export async function searchCharacters(options: CharacterSearchOptions) {
	try {
		characterLogger.info('🔍 Buscando personajes');
		const result = await searchCharactersTransformer(options);
		characterLogger.info('✅ Personajes encontrados', { count: result.items?.length || result.total || 0 });
		return result;
	} catch (error) {
		characterLogger.error('❌ Error al buscar personajes', error);
		throw createCharacterError('No se pudieron buscar los personajes', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🔍 Obtiene un personaje por su ID
 */
export async function getCharacterById(id: string) {
	try {
		characterLogger.info('🔍 Obteniendo personaje:', id);
		const character = await getCharacterByIdTransformer(id);
		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}
		characterLogger.info('✅ Personaje obtenido:', id);
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al obtener personaje', { id, error });
		throw createCharacterError(
			'No se pudo obtener el personaje',
			error instanceof Error && 'code' in error ? (error.code as EntityErrorCode) : EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * ✨ Crea un nuevo personaje
 */
export async function createCharacter(data: CharacterCreateInput) {
	try {
		characterLogger.info('➕ Creando personaje', { name: data.name });
		const character = await createCharacterTransformer(data);
		await revalidateAllPaths();
		await notifyCharacterChange('create', character);
		characterLogger.info('✅ Personaje creado', { id: character.id, name: character.name });
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al crear personaje', { error, data });
		throw createCharacterError('No se pudo crear el personaje', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 📝 Actualiza un personaje existente
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput) {
	try {
		characterLogger.info('🔄 Actualizando personaje', { id });
		const character = await updateCharacterTransformer(id, data);
		await revalidateAllPaths();
		await notifyCharacterChange('update', character);
		characterLogger.info('✅ Personaje actualizado', { id });
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al actualizar personaje', { id, error });
		throw createCharacterError(
			'No se pudo actualizar el personaje',
			error instanceof Error && 'code' in error ? (error.code as EntityErrorCode) : EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Elimina un personaje por su ID
 */
export async function deleteCharacter(id: string): Promise<{ id: string }> {
	try {
		characterLogger.info('🗑️ Eliminando personaje', { id });
		const character = await deleteCharacterTransformer(id);
		await revalidateAllPaths();
		await notifyCharacterChange('delete', { id });
		characterLogger.info('✅ Personaje eliminado', { id });
		return { id };
	} catch (error) {
		characterLogger.error('❌ Error al eliminar personaje', { id, error });
		throw createCharacterError(
			'No se pudo eliminar el personaje',
			error instanceof Error && 'code' in error ? (error.code as EntityErrorCode) : EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene las imágenes asociadas a un personaje
 */
export async function getCharacterImages(id: string) {
	try {
		characterLogger.info('🖼️ Obteniendo imágenes del personaje', { id });
		const character = await prisma.character.findUnique({
			where: { id },
		});
		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}
		const characterWithImages = await prisma.character.findUnique({
			where: { id },
			include: {
				images: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						name: true,
						description: true,
						width: true,
						height: true,
						size: true,
						metadata: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		});
		if (!characterWithImages) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// 🔧 Fix: Verificar que characterWithImages.images existe antes de mapear
		if (!characterWithImages.images) {
			characterLogger.info('✅ Personaje sin imágenes encontrado', { id });
			return [];
		}

		const images = characterWithImages.images.map((image: any) => {
			const thumbnailUrl = image.thumbnail
				? `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`
				: null;
			return {
				...image,
				thumbnail: undefined,
				thumbnailUrl,
			};
		});
		characterLogger.info('✅ Imágenes del personaje obtenidas', { id, count: images.length });
		return images;
	} catch (error) {
		characterLogger.error('❌ Error al obtener imágenes del personaje', { id, error });
		throw createCharacterError(
			'No se pudieron obtener las imágenes del personaje',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Asocia una imagen a un personaje
 */
export async function addImageToCharacter(characterId: string, imageId: string) {
	try {
		characterLogger.info('🔗 Añadiendo imagen a personaje', { characterId, imageId });
		const character = await prisma.character.findUnique({
			where: { id: characterId },
		});
		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});
		if (!image) {
			throw createCharacterError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}
		await prisma.character.update({
			where: { id: characterId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});
		await revalidateAllPaths();
		characterLogger.info('✅ Imagen añadida a personaje', { characterId, imageId });
		return { success: true };
	} catch (error) {
		characterLogger.error('❌ Error al añadir imagen a personaje', { characterId, imageId, error });
		throw createCharacterError('No se pudo añadir la imagen al personaje', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina la asociación entre una imagen y un personaje
 */
export async function removeImageFromCharacter(characterId: string, imageId: string) {
	try {
		characterLogger.info('🔗 Eliminando imagen de personaje', { characterId, imageId });
		const character = await prisma.character.findUnique({
			where: { id: characterId },
		});
		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});
		if (!image) {
			throw createCharacterError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}
		await prisma.character.update({
			where: { id: characterId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});
		await revalidateAllPaths();
		characterLogger.info('✅ Imagen eliminada de personaje', { characterId, imageId });
		return { success: true };
	} catch (error) {
		characterLogger.error('❌ Error al eliminar imagen de personaje', { characterId, imageId, error });
		throw createCharacterError('No se pudo eliminar la imagen del personaje', EntityErrorCode.OPERATION_FAILED, error);
	}
}
