/**
 * @file Servicio de gestión de álbumes
 * @module services/album/album.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de álbumes
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import { toAlbumWithStats } from '@/transformers/album';
import type { AlbumWithStats } from '@/types/entities/album';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('AlbumService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/albums'];

const ALBUM_WITH_STATS_INCLUDE = {
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
} as const;

// Tipos de entrada
export interface CreateAlbumInput {
	name: string;
	description?: string;
	isPrivate?: boolean;
	isArchived?: boolean;
}

export interface UpdateAlbumInput {
	name?: string;
	description?: string;
	isPrivate?: boolean;
	isArchived?: boolean;
}

export interface GetAlbumsOptions {
	includeArchived?: boolean;
	includePrivate?: boolean;
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
}

export interface GetAlbumsResult {
	albums: AlbumWithStats[];
	total: number;
}

/**
 * Obtiene un álbum por su ID
 */
export async function getAlbum(id: string): Promise<AlbumWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo álbum por ID: ${id}`);

		const album = await prisma.album.findUnique({
			where: { id },
			include: ALBUM_WITH_STATS_INCLUDE,
		});

		if (!album) {
			logger.warn(`Álbum no encontrado: ${id}`);
			return null;
		}

		return toAlbumWithStats(album, album._count);
	} catch (error) {
		logger.error(`❌ Error al obtener el álbum ${id}`, { error });
		throw new Error(`No se pudo obtener el álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene álbumes con opciones de filtrado
 */
export async function getAlbums(options: GetAlbumsOptions = {}): Promise<GetAlbumsResult> {
	try {
		const {
			includeArchived = false,
			includePrivate = true,
			search,
			orderBy = 'name',
			orderDirection = 'asc'
		} = options;

		logger.info('🎞️ Obteniendo álbumes', { options });

		// Construir filtros
		const where: Prisma.AlbumWhereInput = {};

		if (!includeArchived) {
			where.isArchived = false;
		}

		if (!includePrivate) {
			where.isPrivate = false;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		// Obtener álbumes
		const [albums, total] = await Promise.all([
			prisma.album.findMany({
				where,
				include: ALBUM_WITH_STATS_INCLUDE,
				orderBy: { [orderBy]: orderDirection },
			}),
			prisma.album.count({ where }),
		]);

		const transformedAlbums = albums.map(album => toAlbumWithStats(album, album._count));

		return {
			albums: transformedAlbums,
			total,
		};
	} catch (error) {
		logger.error('❌ Error al obtener álbumes', { error, options });
		throw new Error(`No se pudieron obtener los álbumes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Crea un nuevo álbum
 */
export async function createAlbum(data: CreateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando nuevo álbum', { name: data.name });

		const albumData: Prisma.AlbumCreateInput = {
			name: data.name,
			description: data.description,
			isPrivate: data.isPrivate ?? false,
			isArchived: data.isArchived ?? false,
		};

		const newAlbum = await prisma.album.create({
			data: albumData,
			include: ALBUM_WITH_STATS_INCLUDE,
		});

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		const result = toAlbumWithStats(newAlbum, newAlbum._count);
		logger.info(`✅ Álbum creado exitosamente: ${result.id}`);

		return result;
	} catch (error) {
		logger.error('❌ Error al crear álbum', { error, data });
		throw new Error(`No se pudo crear el álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Actualiza un álbum existente
 */
export async function updateAlbum(id: string, data: UpdateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info(`🔄 Actualizando álbum: ${id}`, { data });

		const albumData: Prisma.AlbumUpdateInput = {};

		if (data.name !== undefined) albumData.name = data.name;
		if (data.description !== undefined) albumData.description = data.description;
		if (data.isPrivate !== undefined) albumData.isPrivate = data.isPrivate;
		if (data.isArchived !== undefined) albumData.isArchived = data.isArchived;

		const updatedAlbum = await prisma.album.update({
			where: { id },
			data: albumData,
			include: ALBUM_WITH_STATS_INCLUDE,
		});

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/albums/${id}`);

		const result = toAlbumWithStats(updatedAlbum, updatedAlbum._count);
		logger.info(`✅ Álbum actualizado exitosamente: ${id}`);

		return result;
	} catch (error) {
		logger.error(`❌ Error al actualizar álbum ${id}`, { error, data });
		throw new Error(`No se pudo actualizar el álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Elimina un álbum
 */
export async function deleteAlbum(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando álbum: ${id}`);

				await prisma.album.delete({
			where: { id }
		});

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		logger.info(`✅ Álbum eliminado exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar álbum ${id}`, { error });
		throw new Error(`No se pudo eliminar el álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene las imágenes de un álbum específico
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

		logger.info(`✅ Obtenidas ${images.length} imágenes del álbum ${albumId}`);
		return images;
	} catch (error) {
		logger.error(`❌ Error al obtener imágenes del álbum ${albumId}`, { error });
		throw new Error(`No se pudieron obtener las imágenes del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Agrega una imagen a un álbum
 */
export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} al álbum ${albumId}`);

		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach(path => revalidatePath(path));
		revalidatePath(`/albums/${albumId}`);

		logger.info(`✅ Imagen agregada exitosamente al álbum`);
	} catch (error) {
		logger.error(`❌ Error al agregar imagen al álbum`, { error, albumId, imageId });
		throw new Error(`No se pudo agregar la imagen al álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Remueve una imagen de un álbum
 */
export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} del álbum ${albumId}`);

		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach(path => revalidatePath(path));
		revalidatePath(`/albums/${albumId}`);

		logger.info(`✅ Imagen removida exitosamente del álbum`);
	} catch (error) {
		logger.error(`❌ Error al remover imagen del álbum`, { error, albumId, imageId });
		throw new Error(`No se pudo remover la imagen del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Cambia el estado de archivo de un álbum
 */
export async function toggleAlbumArchive(id: string): Promise<AlbumWithStats> {
	try {
		logger.info(`📦 Cambiando estado de archivo del álbum: ${id}`);

		// Obtener estado actual
		const currentAlbum = await prisma.album.findUnique({
			where: { id },
			select: { isArchived: true },
		});

		if (!currentAlbum) {
			throw new Error('Álbum no encontrado');
		}

		const updatedAlbum = await prisma.album.update({
			where: { id },
			data: { isArchived: !currentAlbum.isArchived },
			include: ALBUM_WITH_STATS_INCLUDE,
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach(path => revalidatePath(path));
		revalidatePath(`/albums/${id}`);

		const result = toAlbumWithStats(updatedAlbum, updatedAlbum._count);
		logger.info(`✅ Estado de archivo cambiado: ${id} -> ${result.isArchived}`);

		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de archivo del álbum ${id}`, { error });
		throw new Error(`No se pudo cambiar el estado del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Cambia la visibilidad de un álbum
 */
export async function toggleAlbumPrivacy(id: string): Promise<AlbumWithStats> {
	try {
		logger.info(`🔒 Cambiando visibilidad del álbum: ${id}`);

		// Obtener estado actual
		const currentAlbum = await prisma.album.findUnique({
			where: { id },
			select: { isPrivate: true },
		});

		if (!currentAlbum) {
			throw new Error('Álbum no encontrado');
		}

		const updatedAlbum = await prisma.album.update({
			where: { id },
			data: { isPrivate: !currentAlbum.isPrivate },
			include: ALBUM_WITH_STATS_INCLUDE,
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach(path => revalidatePath(path));
		revalidatePath(`/albums/${id}`);

		const result = toAlbumWithStats(updatedAlbum, updatedAlbum._count);
		logger.info(`✅ Visibilidad cambiada: ${id} -> ${result.isPrivate ? 'privado' : 'público'}`);

		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar visibilidad del álbum ${id}`, { error });
		throw new Error(`No se pudo cambiar la visibilidad del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

// Servicio principal
const albumService = {
	getAlbum,
	getAlbums,
	createAlbum,
	updateAlbum,
	deleteAlbum,
	getAlbumImages,
	addImageToAlbum,
	removeImageFromAlbum,
	toggleAlbumArchive,
	toggleAlbumPrivacy,
};

export default albumService;
