'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { Character } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const characterLogger = logger.withContext('CharacterActions');

const REVALIDATE_PATHS = ['/settings', '/characters', '/characters/[id]'] as const;

const revalidateAllPaths = () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	characterLogger.info('🔄 Rutas revalidadas');
};

class CharacterError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'CharacterError';
	}
}

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
		throw new CharacterError('No se pudieron obtener los personajes', { cause: error });
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
			throw new CharacterError('Personaje no encontrado');
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
		if (error instanceof CharacterError) {
			throw error;
		}
		throw new CharacterError('No se pudo obtener el personaje', error);
	}
}

export async function createCharacter(data: CharacterCreate) {
	try {
		characterLogger.info('📝 Creando nuevo personaje:', data.name);
		const character = await prisma.character.create({
			data: {
				...data,
				stats: data.stats || '{}',
				filters: data.filters || '[]',
			},
		});

		// Emitir eventos usando el nuevo sistema de servidor
		await emit({
			type: 'characters:modified',
			data: { action: 'create', character },
		});
		statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);

		characterLogger.info('✅ Personaje creado:', character.name);
		revalidateAllPaths();
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al crear personaje:', error);
		throw new CharacterError('No se pudo crear el personaje', error);
	}
}

export async function updateCharacter(id: string, data: CharacterUpdate) {
	try {
		characterLogger.info('📝 Actualizando personaje:', id);
		const character = await prisma.character.update({
			where: { id },
			data: {
				...data,
				stats: data.stats || undefined,
				filters: data.filters || undefined,
			},
		});

		// Emitir eventos usando el nuevo sistema de servidor
		await emit({
			type: 'characters:modified',
			data: { action: 'update', character },
		});
		statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);

		characterLogger.info('✅ Personaje actualizado:', character.name);
		revalidateAllPaths();
		return character;
	} catch (error) {
		characterLogger.error('❌ Error al actualizar personaje:', error);
		throw new CharacterError('No se pudo actualizar el personaje', error);
	}
}

export async function deleteCharacter(id: string) {
	try {
		characterLogger.info('🗑️ Eliminando personaje:', id);
		await prisma.character.delete({
			where: { id },
		});

		// Emitir eventos usando el nuevo sistema de servidor
		await emit({
			type: 'characters:modified',
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);

		characterLogger.info('✅ Personaje eliminado');
		revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al eliminar personaje:', error);
		throw new CharacterError('No se pudo eliminar el personaje', error);
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
		throw new CharacterError('No se pudieron obtener las imágenes del personaje', error);
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
		revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al agregar imagen al personaje:', error);
		throw new CharacterError('No se pudo agregar la imagen al personaje', error);
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
		revalidateAllPaths();
	} catch (error) {
		characterLogger.error('❌ Error al eliminar imagen del personaje:', error);
		throw new CharacterError('No se pudo eliminar la imagen del personaje', error);
	}
}
