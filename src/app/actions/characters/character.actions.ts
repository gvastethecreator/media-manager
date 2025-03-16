'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { Character } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const characterLogger = serverLogger.withContext('CharacterActions');
const REVALIDATE_PATHS = ['/settings', '/characters', '/characters/[id]'] as const;

// Códigos de error
enum CharacterErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createCharacterError = (
	message: string,
	code: CharacterErrorCode = CharacterErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'CharacterError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces
export interface CharacterWithStats extends Character {
	_count: {
		images: number;
	};
	totalSize: number;
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

export interface CharacterCreate {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	sortBy: string;
	filters: string;
}

export interface CharacterUpdate extends Partial<CharacterCreate> {
	id: string;
}

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	characterLogger.info('🔄 Rutas revalidadas');
};

const notifyCharacterChange = async (action: 'create' | 'update' | 'delete', character: Character | { id: string }) => {
	// Emitir eventos usando el nuevo sistema de servidor
	await emit({
		type: 'characters:modified',
		data: { action, character },
	});
	statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);
};

// Acciones del servidor
export async function getCharacters(): Promise<CharacterWithStats[]> {
	try {
		characterLogger.info('👤 Obteniendo personajes');
		const characters = await prisma.character.findMany({
			include: {
				_count: {
					select: { images: true },
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

				return {
					...character,
					totalSize: totalSize._sum.size || 0,
					recentImages: character.images
						.filter((img) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
						.map((img) => {
							if (img.thumbnail) {
								return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
							}
							return null;
						}),
					images: undefined,
				};
			})
		);

		characterLogger.info('✅ Personajes obtenidos', { count: characters.length });
		return charactersWithStats;
	} catch (error) {
		characterLogger.error('❌ Error al obtener personajes', error);
		throw createCharacterError('No se pudieron obtener los personajes', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCharacter(id: string) {
	try {
		characterLogger.info('🔍 Obteniendo personaje:', id);
		const character = await prisma.character.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		if (!character) {
			throw createCharacterError('Personaje no encontrado', CharacterErrorCode.NOT_FOUND);
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

		const result = {
			...character,
			totalSize: totalSize._sum.size || 0,
		};

		characterLogger.info('✅ Personaje obtenido:', character.name);
		return result;
	} catch (error) {
		characterLogger.error('❌ Error al obtener personaje:', error);
		// Preservar el error si ya es un CharacterError
		if (error instanceof Error && error.name === 'CharacterError') {
			throw error;
		}
		throw createCharacterError('No se pudo obtener el personaje', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function createCharacter(data: CharacterCreate) {
	try {
		characterLogger.info('📝 Creando nuevo personaje:', data.name);

		// Validación de entrada
		if (!data.name?.trim()) {
			throw createCharacterError('El nombre del personaje es requerido', CharacterErrorCode.VALIDATION_ERROR);
		}

		const character = await prisma.character.create({
			data: {
				...data,
				stats: data.stats || '{}',
				filters: data.filters || '[]',
			},
		});

		await notifyCharacterChange('create', character);

		characterLogger.info('✅ Personaje creado:', character.name);
		await revalidateAllPaths();
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al crear personaje:', error);
		// Preservar el error si ya es un CharacterError
		if (error instanceof Error && error.name === 'CharacterError') {
			throw error;
		}
		throw createCharacterError('No se pudo crear el personaje', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateCharacter(id: string, data: CharacterUpdate) {
	try {
		characterLogger.info('📝 Actualizando personaje:', id);

		// Validación de entrada
		if (data.name === '') {
			throw createCharacterError('El nombre del personaje no puede estar vacío', CharacterErrorCode.VALIDATION_ERROR);
		}

		const character = await prisma.character.update({
			where: { id },
			data: {
				...data,
				stats: data.stats || undefined,
				filters: data.filters || undefined,
			},
		});

		await notifyCharacterChange('update', character);

		characterLogger.info('✅ Personaje actualizado:', character.name);
		await revalidateAllPaths();
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al actualizar personaje:', error);
		// Preservar el error si ya es un CharacterError
		if (error instanceof Error && error.name === 'CharacterError') {
			throw error;
		}
		throw createCharacterError('No se pudo actualizar el personaje', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteCharacter(id: string) {
	try {
		characterLogger.info('🗑️ Eliminando personaje:', id);
		await prisma.character.delete({
			where: { id },
		});

		await notifyCharacterChange('delete', { id });

		characterLogger.info('✅ Personaje eliminado');
		await revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al eliminar personaje:', error);
		throw createCharacterError('No se pudo eliminar el personaje', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCharacterImages(id: string) {
	try {
		characterLogger.info('🖼️ Obteniendo imágenes del personaje:', id);
		const images = await prisma.image.findMany({
			where: {
				characters: {
					some: {
						id,
					},
				},
			},
			select: {
				id: true,
				name: true,
				path: true,
				size: true,
				createdAt: true,
				updatedAt: true,
				hash: true,
				width: true,
				height: true,
				metadata: true,
				thumbnail: true,
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				folderId: true,
				isPublic: true,
				isFavorite: true,
			},
		});

		characterLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images.map((image) => ({
			...image,
			type: 'image',
		}));
	} catch (error) {
		characterLogger.error('❌ Error al obtener imágenes del personaje:', error);
		throw createCharacterError(
			'No se pudieron obtener las imágenes del personaje',
			CharacterErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function addImageToCharacter(characterId: string, imageId: string) {
	try {
		characterLogger.info('🖼️ Agregando imagen a personaje:', { characterId, imageId });
		await prisma.character.update({
			where: { id: characterId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema de servidor
		await emit({
			type: 'characters:modified',
			id: characterId,
			imageId,
			data: { action: 'addImage' },
		});

		characterLogger.info('✅ Imagen agregada al personaje');
		await revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al agregar imagen al personaje:', error);
		throw createCharacterError('No se pudo agregar la imagen al personaje', CharacterErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromCharacter(characterId: string, imageId: string) {
	try {
		characterLogger.info('🖼️ Eliminando imagen de personaje:', { characterId, imageId });
		await prisma.character.update({
			where: { id: characterId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema de servidor
		await emit({
			type: 'characters:modified',
			id: characterId,
			imageId,
			data: { action: 'removeImage' },
		});

		characterLogger.info('✅ Imagen eliminada del personaje');
		await revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al eliminar imagen del personaje:', error);
		throw createCharacterError(
			'No se pudo eliminar la imagen del personaje',
			CharacterErrorCode.OPERATION_FAILED,
			error
		);
	}
}
