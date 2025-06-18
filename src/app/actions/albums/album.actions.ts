'use server';

/**
 * @file Server Actions para la entidad Album
 * @module app/actions/albums/album.actions
 * @description Acciones CRUD y de gestión de relaciones para los álbumes.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { mapCreateAlbumDataToPrisma, mapUpdateAlbumDataToPrisma } from '@/transformers/album/mappers';
import { fromPrismaAlbum, fromPrismaAlbums } from '@/transformers/album/transformer';
import type { AlbumBase, AlbumComplete, AlbumCreateInput, AlbumUpdateInput } from '@/types/entities/album';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('AlbumActions');

const ALBUM_INCLUDE = {
	images: true,
	_count: {
		select: {
			images: true,
		},
	},
};

/**
 * Obtiene todos los álbumes.
 */
export async function getAlbums(): Promise<AlbumComplete[]> {
	logger.info('🎞️ Obteniendo todos los álbumes');
	const albums = await prisma.album.findMany({ include: ALBUM_INCLUDE });
	return fromPrismaAlbums(albums);
}

/**
 * Obtiene un único álbum por su ID.
 */
export async function getAlbum(id: string): Promise<AlbumComplete | null> {
	logger.info(`🔍 Obteniendo álbum por ID: ${id}`);
	const album = await prisma.album.findUnique({
		where: { id },
		include: ALBUM_INCLUDE,
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
export async function createAlbum(data: AlbumCreateInput): Promise<AlbumBase> {
	logger.info('📝 Creando nuevo álbum:', { name: data.name });
	const prismaData = mapCreateAlbumDataToPrisma(data);
	const newAlbum = await prisma.album.create({ data: prismaData });
	revalidatePath('/albums');
	return newAlbum;
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(id: string, data: AlbumUpdateInput): Promise<AlbumBase> {
	logger.info(`🔄 Actualizando álbum: ${id}`);
	const prismaData = mapUpdateAlbumDataToPrisma(data);
	const updatedAlbum = await prisma.album.update({
		where: { id },
		data: prismaData,
	});
	revalidatePath('/albums');
	revalidatePath(`/albums/${id}`);
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
 * Añade una imagen a un álbum.
 */
export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	logger.info(`🖼️➕ Añadiendo imagen ${imageId} al álbum ${albumId}`);
	await prisma.album.update({
		where: { id: albumId },
		data: {
			images: {
				connect: { id: imageId },
			},
		},
	});
	revalidatePath(`/albums/${albumId}`);
}

/**
 * Elimina una imagen de un álbum.
 */
export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	logger.info(`🖼️➖ Eliminando imagen ${imageId} del álbum ${albumId}`);
	await prisma.album.update({
		where: { id: albumId },
		data: {
			images: {
				disconnect: { id: imageId },
			},
		},
	});
	revalidatePath(`/albums/${albumId}`);
}
