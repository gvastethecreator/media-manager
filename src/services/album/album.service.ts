/**
 * @file Servicio de gestión de álbumes
 * @module services/album/album.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de álbumes
 * @updated 2025-01-27
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';
import { toAlbumWithStats } from '@/transformers/album';
import type { AlbumWithStats, CreateAlbumInput, UpdateAlbumInput } from '@/types/entities/album';
// Drizzle imports
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { albums } from '@/lib/drizzle/schema';

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
				shortcut: albums.shortcut,
				category: albums.category,
				sortBy: albums.sortBy,
				filters: albums.filters,
				featuredImage: albums.featuredImage,
				isFavorite: albums.isFavorite,
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

		// Transformar a formato compatible con Prisma
		const transformedAlbum = {
			...rawAlbum,
			isFavorite: Boolean(rawAlbum.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaAlbum = await prisma.album.findUnique({
					where: { id },
					include: ALBUM_WITH_STATS_INCLUDE,
				});

				if (prismaAlbum && transformedAlbum) {
					logger.info('✅ Validación dual exitosa getAlbum:', {
						albumName: transformedAlbum.name
					});
				} else if (!prismaAlbum && !transformedAlbum) {
					logger.info('✅ Validación dual exitosa getAlbum: ambos null');
				} else {
					logger.warn('⚠️ Diferencia en getAlbum:', {
						drizzleFound: !!transformedAlbum,
						prismaFound: !!prismaAlbum
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getAlbum:', validationError);
			}
		}

		return toAlbumWithStats(transformedAlbum as any, transformedAlbum._count);
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
			conditions.push(
				or(
					like(albums.name, `%${search}%`),
					like(albums.description, `%${search}%`)
				)
			);
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
				shortcut: albums.shortcut,
				category: albums.category,
				sortBy: albums.sortBy,
				filters: albums.filters,
				featuredImage: albums.featuredImage,
				isFavorite: albums.isFavorite,
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

		// Transformar resultados de Drizzle a formato compatible con Prisma
		const transformedAlbums = drizzleAlbums.map((rawAlbum) => ({
			...rawAlbum,
			isFavorite: Boolean(rawAlbum.isFavorite),
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		}));

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				// Construir filtros para Prisma (código original)
				const where: Prisma.AlbumWhereInput = {};

				if (search) {
					where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
				}

				const [prismaTotal] = await Promise.all([
					prisma.album.count({ where }),
				]);

				// Comparar resultados básicos
				if (Math.abs(total - prismaTotal) > 0) {
					logger.warn('⚠️ Diferencia en conteo total getAlbums:', {
						drizzle: total,
						prisma: prismaTotal,
						options
					});
				} else {
					logger.info('✅ Validación dual exitosa getAlbums:', {
						total,
						albums: transformedAlbums.length
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getAlbums:', validationError);
			}
		}

		const finalAlbums = transformedAlbums.map((album) => toAlbumWithStats(album as any, album._count));

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
export async function createAlbum(data: CreateAlbumInput): Promise<AlbumWithStats> {
	try {
		logger.info('📝 Creando nuevo álbum', { name: data.name });

		const albumData: Prisma.AlbumCreateInput = {
			name: data.name,
			emoji: data.emoji || '📸',
			color: data.color || '#3b82f6',
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || 'general',
			sortBy: data.sortBy || 'name',
			filters: data.filters || '[]',
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
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
		if (data.emoji !== undefined) albumData.emoji = data.emoji;
		if (data.color !== undefined) albumData.color = data.color;
		if (data.description !== undefined) albumData.description = data.description;
		if (data.shortcut !== undefined) albumData.shortcut = data.shortcut;
		if (data.category !== undefined) albumData.category = data.category;
		if (data.sortBy !== undefined) albumData.sortBy = data.sortBy;
		if (data.filters !== undefined) albumData.filters = data.filters;
		if (data.featuredImage !== undefined) albumData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) albumData.isFavorite = data.isFavorite;

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
			where: { id },
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

		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
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

		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Revalidar rutas
		REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
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
