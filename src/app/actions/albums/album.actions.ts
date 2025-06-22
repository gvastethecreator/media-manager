'use server';

/**
 * @file Server Actions para la entidad Album
 * @module app/actions/albums/album.actions
 * @description Acciones CRUD y de gestión de relaciones para los álbumes.
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toAlbumWithStats } from '@/transformers/album';
import type { AlbumWithStats } from '@/types/entities/album';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('AlbumActions');

const revalidatePaths = ['/albums']; // Ajustar a rutas reales de la UI

const albumWithStatsInclude = {
	_count: {
		select: {
			images: true,
			videos: true,
			collections: true,
			tags: true,
			characters: true,
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
};

/**
 * Obtiene todos los álbumes con sus estadísticas.
 */
export async function getAlbums(): Promise<AlbumWithStats[]> {
	try {
		logger.info('🎞️ Obteniendo todos los álbumes');
		const albums = await prisma.album.findMany({
			include: albumWithStatsInclude,
			orderBy: { name: 'asc' },
		});
		return albums.map(album => toAlbumWithStats(album, album._count));
	} catch (error) {
		logger.error('❌ Error al obtener los álbumes.', { error });
		throw new Error('No se pudieron obtener los álbumes.');
	}
}

/**
 * Obtiene un único álbum por su ID con estadísticas.
 */
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo álbum por ID: ${id}`);
		const album = await prisma.album.findUnique({
			where: { id },
			include: albumWithStatsInclude,
		});

		if (!album) {
			logger.warn(`Álbum no encontrado: ${id}`);
			return null;
		}
		return toAlbumWithStats(album, album._count);
	} catch (error) {
		logger.error(`❌ Error al obtener el álbum ${id}.`, { error });
		throw new Error(`No se pudo obtener el álbum.`);
	}
}

/**
 * Crea un nuevo álbum.
 */
export async function createAlbum(data: Prisma.AlbumCreateInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando nuevo álbum:', { name: data.name });
		const newAlbum = await prisma.album.create({
			data,
			include: albumWithStatsInclude,
		});
		revalidatePaths.forEach(path => revalidatePath(path));
		return toAlbumWithStats(newAlbum, newAlbum._count);
	} catch (error) {
		logger.error('❌ Error al crear el álbum.', { error, data });
		throw new Error('No se pudo crear el álbum.');
	}
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(id: string, data: Prisma.AlbumUpdateInput): Promise<AlbumWithStats> {
	try {
		logger.info(`🔄 Actualizando álbum: ${id}`);
		const updatedAlbum = await prisma.album.update({
			where: { id },
			data,
			include: albumWithStatsInclude,
		});
		revalidatePaths.forEach(path => revalidatePath(path));
		revalidatePath(`/albums/${id}`); // Ruta específica del detalle
		return toAlbumWithStats(updatedAlbum, updatedAlbum._count);
	} catch (error) {
		logger.error(`❌ Error al actualizar el álbum ${id}.`, { error, data });
		throw new Error('No se pudo actualizar el álbum.');
	}
}

/**
 * Elimina un álbum.
 */
export async function deleteAlbum(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando álbum: ${id}`);
		await prisma.album.delete({ where: { id } });
		revalidatePaths.forEach(path => revalidatePath(path));
	} catch (error) {
		logger.error(`❌ Error al eliminar el álbum ${id}.`, { error });
		throw new Error('No se pudo eliminar el álbum.');
	}
}

/**
 * Obtiene las imágenes de un álbum específico de forma eficiente.
 */
export async function getAlbumImages(albumId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
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
	} catch (error) {
		logger.error(`❌ Error al obtener imágenes del álbum ${albumId}.`, { error });
		throw new Error('No se pudieron obtener las imágenes del álbum.');
	}
}
