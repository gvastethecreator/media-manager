'use server';

/**
 * @file Server Actions para la entidad Album
 * @module app/actions/albums/album.actions
 * @description Acciones CRUD y de gestión de relaciones para los álbumes.
 */

import { prisma } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import {
    toPrismaAlbumCreate,
    toPrismaAlbumUpdate,
} from '@/transformers/album/serializers';
import {
    fromPrismaAlbum,
    fromPrismaAlbums,
} from '@/transformers/album/transformer';
import type {
    AlbumCreateInput,
    AlbumUpdateInput,
    AlbumWithStats,
} from '@/types/entities/album';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('AlbumActions');

const ALBUM_SELECT_WITH_STATS = {
	id: true,
	name: true,
	emoji: true,
	color: true,
	description: true,
	shortcut: true,
	category: true,
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
			characters: true,
		},
	},
};

/**
 * Obtiene todos los álbumes.
 */
export async function getAlbums(): Promise<AlbumWithStats[]> {
	logger.info('🎞️ Obteniendo todos los álbumes');
	const albums = await prisma.album.findMany({
		select: ALBUM_SELECT_WITH_STATS,
	});
	return fromPrismaAlbums(albums);
}

/**
 * Obtiene un único álbum por su ID.
 */
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
	logger.info(`🔍 Obteniendo álbum por ID: ${id}`);
	const album = await prisma.album.findUnique({
		where: { id },
		select: ALBUM_SELECT_WITH_STATS,
	});
	if (!album) {
		logger.warn(`Álbum no encontrado: ${id}`);
		return null;
	}
	return fromPrismaAlbum(album);
}

/**
 * Crea un nuevo álbum.
 */
export async function createAlbum(
	data: AlbumCreateInput,
): Promise<AlbumWithStats> {
	logger.info('📝 Creando nuevo álbum:', { name: data.name });
	const prismaData = toPrismaAlbumCreate(data);
	const newAlbumPrisma = await prisma.album.create({
		data: prismaData,
		select: ALBUM_SELECT_WITH_STATS,
	});
	revalidatePath('/albums');
	const newAlbum = fromPrismaAlbum(newAlbumPrisma);
	if (!newAlbum) {
		throw new Error('Error al transformar el álbum recién creado.');
	}
	return newAlbum;
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(
	id: string,
	data: AlbumUpdateInput,
): Promise<AlbumWithStats> {
	logger.info(`🔄 Actualizando álbum: ${id}`);
	const prismaData = toPrismaAlbumUpdate(data);
	const updatedAlbumPrisma = await prisma.album.update({
		where: { id },
		data: prismaData,
		select: ALBUM_SELECT_WITH_STATS,
	});
	revalidatePath('/albums');
	revalidatePath(`/albums/${id}`);
	const updatedAlbum = fromPrismaAlbum(updatedAlbumPrisma);
	if (!updatedAlbum) {
		throw new Error('Error al transformar el álbum actualizado.');
	}
	return updatedAlbum;
}

/**
 * Elimina un álbum.
 */
export async function deleteAlbum(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando álbum: ${id}`);
	await prisma.album.delete({ where: { id } });
	revalidatePath('/albums');
}

/**
 * Obtiene las imágenes de un álbum específico de forma eficiente.
 */
export async function getAlbumImages(
	albumId: string,
): Promise<{ id: string; name: string; path: string }[]> {
	logger.info(`🖼️ Obteniendo imágenes del álbum: ${albumId}`);
	const images = await prisma.image.findMany({
		where: {
			albums: {
				some: {
					id: albumId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});

	return images;
}
