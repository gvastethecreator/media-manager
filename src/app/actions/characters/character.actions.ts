'use server';

import { EntityErrorCode, type SerializableError, createEntityErrorObject } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
  mapCreateCharacterDataToPrisma,
  mapUpdateCharacterDataToPrisma
} from '@/transformers/character';
import type { CharacterBase, CreateCharacterData, UpdateCharacterData } from '@/types/entities/character';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const characterLogger = serverLogger.withContext('CharacterActions');
const REVALIDATE_PATHS = ['/settings', '/characters', '/characters/[id]'] as const;

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

// Interfaces extendidas
export interface CharacterWithStats extends CharacterBase {
	_count: {
		images: number;
		groups: number;
		properties: number;
		wildcards: number;
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
 * Obtiene todos los personajes con estadísticas
 */
export async function getCharacters(): Promise<(CharacterExtended & { totalSize: number; imageCount?: number; recentImages?: (string | null)[] })[]> {
	try {
		characterLogger.info('👤 Obteniendo personajes');
		const characters = await prisma.character.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						relatedCharacters: true,
						relatedTo: true,
						albums: true,
						collections: true,
						tags: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
				images: {
					take: 9,
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
					},
				},
			},
			orderBy: { name: 'asc' },
		});

		const charactersWithStats = await Promise.all(
			characters.map(async (character) => {
				const totalSize = await prisma.image.aggregate({
					where: {
						characters: {
							some: {
								id: character.id,
							},
						},
					},
					_sum: {
						size: true,
					},
				});

				// Extraer las imágenes antes de transformar
				const images = character.images;
				const recentImages = images
					.filter((img) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
					.map((img) => {
						if (img.thumbnail) {
							return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
						}
						return null;
					});

				// Transformar a formato extendido
				const extendedCharacter = toExtendedCharacter({
					...character,
					// Mantener el array de imágenes vacío para evitar duplicación
					images: [],
					videos: [],
					relatedCharacters: [],
					relatedTo: [],
					albums: [],
					collections: [],
					tags: [],
					places: [],
					worldItems: [],
					concepts: [],
					prompts: [],
					notes: [],
					wildcards: [],
					properties: [],
					groups: [],
				});

				return {
					...extendedCharacter,
					totalSize: totalSize._sum.size || 0,
					imageCount: character._count.images,
					recentImages,
				};
			})
		);

		characterLogger.info('✅ Personajes obtenidos', { count: characters.length });
		return charactersWithStats;
	} catch (error) {
		characterLogger.error('❌ Error al obtener personajes', error);
		throw createCharacterError('No se pudieron obtener los personajes', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un personaje específico por su ID
 */
export async function getCharacter(id: string): Promise<CharacterExtended> {
	try {
		characterLogger.info('🔍 Obteniendo personaje:', id);
		const character = await prisma.character.findUnique({
			where: { id },
			include: {
				images: true,
				videos: true,
				relatedCharacters: true,
				relatedTo: true,
				albums: true,
				collections: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				_count: {
					select: {
						images: true,
						videos: true,
						relatedCharacters: true,
						relatedTo: true,
						albums: true,
						collections: true,
						tags: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					}
				},
			},
		});

		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		const totalSize = await prisma.image.aggregate({
			where: {
				characters: {
					some: {
						id: character.id,
					},
				},
			},
			_sum: {
				size: true,
			},
		});

		// Transformar a formato extendido
		const extendedCharacter = toExtendedCharacter(character);

		// Agregar propiedades adicionales de estadísticas
		const result = {
			...extendedCharacter,
			totalSize: totalSize._sum.size || 0,
			imageCount: character._count.images,
		};

		characterLogger.info('✅ Personaje obtenido:', id);
		return result;
	} catch (error) {
		characterLogger.error('❌ Error al obtener personaje', { id, error });
		throw createCharacterError(
			'No se pudo obtener el personaje',
			error instanceof Error && 'code' in error
				? (error.code as EntityErrorCode)
				: EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Crea un nuevo personaje
 */
export async function createCharacter(data: CreateCharacterData): Promise<CharacterExtended> {
	try {
		characterLogger.info('➕ Creando personaje', { name: data.name });

		// Utilizar el transformer para mapear datos de creación
		const createData = mapCreateCharacterDataToPrisma(data);

		const character = await prisma.character.create({
			data: createData,
		});

		// Transformar a formato extendido
		const extendedCharacter = toExtendedCharacter({
			...character,
			images: [],
			videos: [],
			relatedCharacters: [],
			relatedTo: [],
			albums: [],
			collections: [],
			tags: [],
			places: [],
			worldItems: [],
			concepts: [],
			prompts: [],
			notes: [],
			wildcards: [],
			properties: [],
			groups: [],
			_count: {},
		});

		await revalidateAllPaths();
		await notifyCharacterChange('create', character);

		characterLogger.info('✅ Personaje creado', { id: character.id, name: character.name });
		return extendedCharacter;
	} catch (error) {
		characterLogger.error('❌ Error al crear personaje', { error, data });
		throw createCharacterError('No se pudo crear el personaje', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un personaje existente
 */
export async function updateCharacter(id: string, data: UpdateCharacterData): Promise<CharacterExtended> {
	try {
		characterLogger.info('🔄 Actualizando personaje', { id });

		// Comprobar que el personaje existe
		const existingCharacter = await prisma.character.findUnique({
			where: { id },
			include: {
				images: true,
				videos: true,
				relatedCharacters: true,
				relatedTo: true,
				albums: true,
				collections: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				_count: true,
			}
		});

		if (!existingCharacter) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Utilizar el transformer para mapear datos de actualización
		const updateData = mapUpdateCharacterDataToPrisma(data);

		const updatedCharacter = await prisma.character.update({
			where: { id },
			data: updateData,
			include: {
				images: true,
				videos: true,
				relatedCharacters: true,
				relatedTo: true,
				albums: true,
				collections: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				_count: true,
			}
		});

		// Transformar a formato extendido
		const extendedCharacter = toExtendedCharacter(updatedCharacter);

		await revalidateAllPaths();
		await notifyCharacterChange('update', updatedCharacter);

		characterLogger.info('✅ Personaje actualizado', { id });
		return extendedCharacter;
	} catch (error) {
		characterLogger.error('❌ Error al actualizar personaje', { id, error });
		throw createCharacterError(
			'No se pudo actualizar el personaje',
			error instanceof Error && 'code' in error
				? (error.code as EntityErrorCode)
				: EntityErrorCode.OPERATION_FAILED,
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

		// Comprobar que el personaje existe
		const character = await prisma.character.findUnique({
			where: { id },
		});

		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		await prisma.character.delete({
			where: { id },
		});

		await revalidateAllPaths();
		await notifyCharacterChange('delete', { id });

		characterLogger.info('✅ Personaje eliminado', { id });
		return { id };
	} catch (error) {
		characterLogger.error('❌ Error al eliminar personaje', { id, error });
		throw createCharacterError(
			'No se pudo eliminar el personaje',
			error instanceof Error && 'code' in error
				? (error.code as EntityErrorCode)
				: EntityErrorCode.OPERATION_FAILED,
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

		// Comprobar que el personaje existe
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
						aspectRatio: true,
						blurhash: true,
						palette: true,
						format: true,
						focalPoint: true,
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

		const images = characterWithImages.images.map((image) => {
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

		// Comprobar que el personaje existe
		const character = await prisma.character.findUnique({
			where: { id: characterId },
		});

		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Comprobar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createCharacterError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}

		// Añadir relación
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

		// Comprobar que el personaje existe
		const character = await prisma.character.findUnique({
			where: { id: characterId },
		});

		if (!character) {
			throw createCharacterError('Personaje no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Comprobar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createCharacterError('Imagen no encontrada', EntityErrorCode.NOT_FOUND);
		}

		// Eliminar relación
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
		throw createCharacterError(
			'No se pudo eliminar la imagen del personaje',
			EntityErrorCode.OPERATION_FAILED,
			error
		);
	}
}
