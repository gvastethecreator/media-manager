/**
 * @file Servicio de gestión de álbumes
 * @module services/album/album.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de álbumes
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { albums, imageAlbums, images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';
import { toAlbumWithStats } from '@/transformers/album';
import type { AlbumCreateInput, AlbumUpdateInput, AlbumWithStats } from '@/types/entities/album';

const logger = serverLogger.withContext('AlbumService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/albums'];

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

		// **MIGRACIÓN A DRIZZLE**
		const drizzleAlbum = await db
			.select({
				id: albums.id,
				name: albums.name,
				emoji: albums.emoji,
				color: albums.color,
				description: albums.description,
				// shortcut: albums.shortcut, // FIXME: Propiedad no existe en esquema
				category: albums.category,
				filters: albums.filters,
				featuredImage: albums.featuredImage,
				isFavorite: albums.isFavorite,

				totalImages: albums.totalImages,
				totalVideos: albums.totalVideos,
				totalSize: albums.totalSize,
				metadata: albums.metadata,
				lastImageAddedAt: albums.lastImageAddedAt,
				lastVideoAddedAt: albums.lastVideoAddedAt,
				createdAt: albums.createdAt,
				updatedAt: albums.updatedAt,
			})
			.from(albums)
			.where(eq(albums.id, id))
			.limit(1);

		if (drizzleAlbum.length === 0) {
			logger.warn(`Álbum no encontrado: ${id}`);
			return null;
		}

		const rawAlbum = drizzleAlbum[0];

		const transformedAlbum = {
			...rawAlbum,
			isFavorite: Boolean(rawAlbum.isFavorite),

			totalImages: rawAlbum.totalImages || 0,
			totalVideos: rawAlbum.totalVideos || 0,
			totalSize: rawAlbum.totalSize || 0,
			metadata: rawAlbum.metadata || null,
			lastImageAddedAt: rawAlbum.lastImageAddedAt || null,
			lastVideoAddedAt: rawAlbum.lastVideoAddedAt || null,
		};

		return toAlbumWithStats(transformedAlbum);
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
			orderDirection = 'asc',
		} = options;

		logger.info('🎞️ Obteniendo álbumes', { options });

		// **MIGRACIÓN A DRIZZLE**
		// Construir filtros dinámicamente
		const conditions: any[] = [];

		if (search) {
			conditions.push(or(like(albums.name, `%${search}%`), like(albums.description, `%${search}%`)));
		}

		// Determinar el ordenamiento
		const orderDirection_fn = orderDirection === 'desc' ? desc : asc;
		let orderByField: any;

		switch (orderBy) {
			case 'createdAt':
				orderByField = orderDirection_fn(albums.createdAt);
				break;
			case 'updatedAt':
				orderByField = orderDirection_fn(albums.updatedAt);
				break;
			default: // 'name'
				orderByField = orderDirection_fn(albums.name);
		}

		// Consulta principal
		let drizzleQuery = db
			.select({
				id: albums.id,
				name: albums.name,
				emoji: albums.emoji,
				color: albums.color,
				description: albums.description,
				// shortcut: albums.shortcut, // FIXME: Propiedad no existe en esquema
				category: albums.category,
				filters: albums.filters,
				featuredImage: albums.featuredImage,
				isFavorite: albums.isFavorite,

				totalImages: albums.totalImages,
				totalVideos: albums.totalVideos,
				totalSize: albums.totalSize,
				metadata: albums.metadata,
				lastImageAddedAt: albums.lastImageAddedAt,
				lastVideoAddedAt: albums.lastVideoAddedAt,
				createdAt: albums.createdAt,
				updatedAt: albums.updatedAt,
			})
			.from(albums);

		// Aplicar filtros si existen
		if (conditions.length > 0) {
			drizzleQuery = drizzleQuery.where(and(...conditions));
		}

		// Aplicar ordenamiento
		const drizzleAlbums = await drizzleQuery.orderBy(orderByField);

		// Consulta de conteo total (con los mismos filtros)
		let countQuery = db.select({ count: count() }).from(albums);

		if (conditions.length > 0) {
			countQuery = countQuery.where(and(...conditions));
		}

		const [{ count: total }] = await countQuery;

		// Transformar resultados de Drizzle a formato compatible con transformadores legacy
		const transformedAlbums = drizzleAlbums.map((rawAlbum: any) => ({
			...rawAlbum,
			isFavorite: Boolean(rawAlbum.isFavorite),

			totalImages: rawAlbum.totalImages || 0,
			totalVideos: rawAlbum.totalVideos || 0,
			totalSize: rawAlbum.totalSize || 0,
			metadata: rawAlbum.metadata || null,
			lastImageAddedAt: rawAlbum.lastImageAddedAt || null,
			lastVideoAddedAt: rawAlbum.lastVideoAddedAt || null,
		}));

		const finalAlbums = transformedAlbums.map((album: any) => toAlbumWithStats(album));

		return {
			albums: finalAlbums,
			total,
		};
	} catch (error) {
		logger.error('❌ Error al obtener álbumes', { error, options });
		throw new Error(
			`No se pudieron obtener los álbumes: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Crea un nuevo álbum
 */
export async function createAlbum(data: AlbumCreateInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando nuevo álbum', { name: data.name });

		const [newAlbum] = await db
			.insert(albums)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				emoji: data.emoji || '📸',
				color: data.color || '#3b82f6',
				description: data.description || null,
				featuredImage: data.featuredImage || null,

				isFavorite: data.isFavorite,
				totalImages: 0,
				totalVideos: 0,
				totalSize: 0,
				filters: data.filters || null,
				shortcut: data.shortcut || null,
				category: data.category || null,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
			})
			.returning();

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}

		const result = toAlbumWithStats(newAlbum);
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
export async function updateAlbum(id: string, data: AlbumUpdateInput): Promise<AlbumWithStats> {
	try {
		logger.info(`🔄 Actualizando álbum: ${id}`, { data });

		const [updatedAlbum] = await db
			.update(albums)
			.set({
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description,
				featuredImage: data.featuredImage,

				isFavorite: data.isFavorite,

				filters: data.filters,
				shortcut: data.shortcut,
				category: data.category,
				updatedAt: sql`(strftime('%s', 'now'))`,
			})
			.where(eq(albums.id, id))
			.returning();

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/albums/${id}`);

		const result = toAlbumWithStats(updatedAlbum);
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

		await db.delete(albums).where(eq(albums.id, id));

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

		const imagesData = await db
			.select({
				id: images.id,
				name: images.name,
				path: images.path,
			})
			.from(images)
			.innerJoin(imageAlbums, eq(images.id, imageAlbums.A))
			.where(eq(imageAlbums.B, albumId))
			.orderBy(desc(images.createdAt));

		logger.info(`✅ Obtenidas ${imagesData.length} imágenes del álbum ${albumId}`);
		return imagesData;
	} catch (error) {
		logger.error(`❌ Error al obtener imágenes del álbum ${albumId}`, { error });
		throw new Error(
			`No se pudieron obtener las imágenes del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Agrega una imagen a un álbum
 */
export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} al álbum ${albumId}`);

		await db.insert(imageAlbums).values({
			A: imageId,
			B: albumId,
		});

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/albums/${albumId}`);

		logger.info('✅ Imagen agregada exitosamente al álbum');
	} catch (error) {
		logger.error('❌ Error al agregar imagen al álbum', { error, albumId, imageId });
		throw new Error(
			`No se pudo agregar la imagen al álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Remueve una imagen de un álbum
 */
export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} del álbum ${albumId}`);

		await db.delete(imageAlbums).where(and(eq(imageAlbums.A, imageId), eq(imageAlbums.B, albumId)));

		// Revalidar rutas
		for (const path of REVALIDATE_PATHS) {
			revalidatePath(path);
		}
		revalidatePath(`/albums/${albumId}`);

		logger.info('✅ Imagen removida exitosamente del álbum');
	} catch (error) {
		logger.error('❌ Error al remover imagen del álbum', { error, albumId, imageId });
		throw new Error(
			`No se pudo remover la imagen del álbum: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
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
};

export default albumService;
