'use server';

/**
 * @file Server Actions para la entidad Album
 * @module app/actions/albums/album.actions
 * @description Controladores delgados que llaman al servicio de álbumes
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import albumService, { type CreateAlbumInput, type GetAlbumsOptions, type UpdateAlbumInput } from '@/services/album-service-export';
import type { AlbumWithStats } from '@/types/entities/album';
import { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('AlbumActions');

/**
 * Obtiene todos los álbumes con sus estadísticas.
 */
export async function getAlbums(options?: GetAlbumsOptions): Promise<AlbumWithStats[]> {
	try {
		logger.info('🎞️ Obteniendo álbumes via action');
		const result = await albumService.getAlbums(options);
		return result.albums;
	} catch (error) {
		logger.error('❌ Error en action getAlbums', { error });
		throw error;
	}
}

/**
 * Obtiene un único álbum por su ID con estadísticas.
 */
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo álbum ${id} via action`);
		return await albumService.getAlbum(id);
	} catch (error) {
		logger.error(`❌ Error en action getAlbum: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea un nuevo álbum.
 */
export async function createAlbum(data: CreateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando álbum via action', { name: data.name });
		return await albumService.createAlbum(data);
	} catch (error) {
		logger.error('❌ Error en action createAlbum', { error, data });
		throw error;
	}
}

/**
 * Actualiza un álbum existente.
 */
export async function updateAlbum(id: string, data: UpdateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info(`🔄 Actualizando álbum ${id} via action`);
		return await albumService.updateAlbum(id, data);
	} catch (error) {
		logger.error(`❌ Error en action updateAlbum: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina un álbum.
 */
export async function deleteAlbum(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando álbum ${id} via action`);
		await albumService.deleteAlbum(id);
	} catch (error) {
		logger.error(`❌ Error en action deleteAlbum: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes de un álbum específico de forma eficiente.
 */
export async function getAlbumImages(albumId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes del álbum ${albumId} via action`);
		return await albumService.getAlbumImages(albumId);
	} catch (error) {
		logger.error(`❌ Error en action getAlbumImages: ${albumId}`, { error });
		throw error;
	}
}

/**
 * Agrega una imagen a un álbum
 */
export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} al álbum ${albumId} via action`);
		await albumService.addImageToAlbum(albumId, imageId);
	} catch (error) {
		logger.error(`❌ Error en action addImageToAlbum`, { error, albumId, imageId });
		throw error;
	}
}

/**
 * Remueve una imagen de un álbum
 */
export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} del álbum ${albumId} via action`);
		await albumService.removeImageFromAlbum(albumId, imageId);
	} catch (error) {
		logger.error(`❌ Error en action removeImageFromAlbum`, { error, albumId, imageId });
		throw error;
	}
}

/**
 * Cambia el estado de archivo de un álbum
 */
export async function toggleAlbumArchive(id: string): Promise<AlbumWithStats> {
	try {
		logger.info(`📦 Cambiando estado de archivo del álbum ${id} via action`);
		return await albumService.toggleAlbumArchive(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleAlbumArchive: ${id}`, { error });
		throw error;
	}
}

/**
 * Cambia la visibilidad de un álbum
 */
export async function toggleAlbumPrivacy(id: string): Promise<AlbumWithStats> {
	try {
		logger.info(`🔒 Cambiando visibilidad del álbum ${id} via action`);
		return await albumService.toggleAlbumPrivacy(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleAlbumPrivacy: ${id}`, { error });
		throw error;
	}
}

// Mantener compatibilidad con código legacy que usa Prisma types
export async function createAlbumLegacy(data: Prisma.AlbumCreateInput): Promise<AlbumWithStats> {
	const albumInput: CreateAlbumInput = {
		name: data.name,
		description: data.description || undefined,
		isPrivate: data.isPrivate || false,
		isArchived: data.isArchived || false,
	};
	return createAlbum(albumInput);
}

export async function updateAlbumLegacy(id: string, data: Prisma.AlbumUpdateInput): Promise<AlbumWithStats> {
	const albumInput: UpdateAlbumInput = {};
	if (data.name !== undefined) albumInput.name = data.name as string;
	if (data.description !== undefined) albumInput.description = data.description as string | undefined;
	if (data.isPrivate !== undefined) albumInput.isPrivate = data.isPrivate as boolean;
	if (data.isArchived !== undefined) albumInput.isArchived = data.isArchived as boolean;

	return updateAlbum(id, albumInput);
}
