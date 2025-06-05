/**
 * @file Servicio para la gestión de álbumes
 * @module services/album
 * @description Implementación del servicio de gestión de álbumes
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
	createAlbum,
	deleteAlbum,
	fromPrismaAlbum,
	getAlbumById,
	searchAlbums,
	updateAlbum,
} from '@/transformers/album';
import type {
	Album,
	AlbumComplete,
	AlbumCreateInput,
	AlbumSearchOptions,
	AlbumSearchResult,
	AlbumUpdateInput,
	AlbumWithStats,
} from '@/types/entities/album';

// Logger específico para el servicio de álbumes
const logger = serverLogger.withContext('AlbumService');

// Códigos de error
export enum AlbumErrorCode {
	NOT_FOUND = 'ALBUM_NOT_FOUND',
	ALREADY_EXISTS = 'ALBUM_ALREADY_EXISTS',
	INVALID_DATA = 'ALBUM_INVALID_DATA',
	OPERATION_FAILED = 'ALBUM_OPERATION_FAILED',
	PERMISSION_DENIED = 'ALBUM_PERMISSION_DENIED',
}

// Constructor de errores para álbumes
export const createAlbumError = (
	message: string,
	code: AlbumErrorCode = AlbumErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'AlbumServiceError';
	Object.assign(error, { code, cause });
	return error;
};

// Eventos del servicio
export const ALBUM_EVENTS = {
	CREATED: 'album:created',
	UPDATED: 'album:updated',
	DELETED: 'album:deleted',
	ITEMS_ADDED: 'album:items:added',
	ITEMS_REMOVED: 'album:items:removed',
	STATS_UPDATED: 'album:stats:updated',
} as const;

// Notificación de cambios en álbumes
export const notifyAlbumChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	album: Album | AlbumComplete | { id: string }
) => {
	let eventType: string;

	switch (action) {
		case 'create':
			eventType = ALBUM_EVENTS.CREATED;
			break;
		case 'update':
			eventType = ALBUM_EVENTS.UPDATED;
			break;
		case 'delete':
			eventType = ALBUM_EVENTS.DELETED;
			break;
		case 'items:add':
			eventType = ALBUM_EVENTS.ITEMS_ADDED;
			break;
		case 'items:remove':
			eventType = ALBUM_EVENTS.ITEMS_REMOVED;
			break;
		default:
			eventType = 'album:modified';
	}

	// Emitir evento
	await emit({
		type: eventType,
		data: { action, album },
	});

	// Notificar a estadísticas
	statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);

	logger.info(`🔔 Notificado cambio en álbum: ${action}`, { albumId: album.id });
};

/**
 * Obtiene un álbum por su ID
 */
export const getAlbumService = async (id: string): Promise<AlbumComplete | null> => {
	try {
		logger.info(`🔍 Buscando álbum con ID: ${id}`);
		const album = await getAlbumById(id);

		if (!album) {
			logger.warn(`⚠️ Álbum no encontrado: ${id}`);
			return null;
		}

		logger.info(`✅ Álbum encontrado: ${album.name}`);
		return album;
	} catch (error) {
		logger.error('❌ Error al obtener álbum por ID', { error, albumId: id });
		throw createAlbumError(`Error al obtener álbum: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Busca álbumes según criterios específicos
 */
export const searchAlbumsService = async (options: AlbumSearchOptions): Promise<AlbumSearchResult> => {
	try {
		logger.info('🔍 Buscando álbumes con filtros');
		const result = await searchAlbums(options);
		logger.info(`✅ Búsqueda completada, encontrados ${result.total} álbumes`);
		return result;
	} catch (error) {
		logger.error('❌ Error al buscar álbumes', { error, options });
		throw createAlbumError(`Error al buscar álbumes: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Crea un nuevo álbum
 */
export const createAlbumService = async (data: AlbumCreateInput): Promise<AlbumComplete> => {
	try {
		logger.info('✨ Creando nuevo álbum', { name: data.name });

		// Verificar si ya existe un álbum con el mismo nombre
		if (data.name) {
			const existingAlbum = await prisma.album.findFirst({
				where: { name: data.name },
			});

			if (existingAlbum) {
				throw createAlbumError(`Ya existe un álbum con el nombre "${data.name}"`, AlbumErrorCode.ALREADY_EXISTS);
			}
		}

		// Crear álbum usando el transformador
		const album = await createAlbum(data);

		// Notificar creación
		await notifyAlbumChange('create', album);

		logger.info(`✅ Álbum creado: ${album.name}`, { albumId: album.id });
		return album;
	} catch (error) {
		logger.error('❌ Error al crear álbum', { error, data });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(`Error al crear álbum: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Actualiza un álbum existente
 */
export const updateAlbumService = async (id: string, data: AlbumUpdateInput): Promise<AlbumComplete> => {
	try {
		logger.info(`📝 Actualizando álbum: ${id}`);

		// Verificar que el álbum existe
		const existingAlbum = await prisma.album.findUnique({
			where: { id },
		});

		if (!existingAlbum) {
			throw createAlbumError(`No se encontró el álbum con ID: ${id}`, AlbumErrorCode.NOT_FOUND);
		}

		// Actualizar álbum usando el transformador
		const album = await updateAlbum(id, data);

		// Notificar actualización
		await notifyAlbumChange('update', album);

		logger.info(`✅ Álbum actualizado: ${album.name}`, { albumId: album.id });
		return album;
	} catch (error) {
		logger.error('❌ Error al actualizar álbum', { error, albumId: id, data });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(`Error al actualizar álbum: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Elimina un álbum
 */
export const deleteAlbumService = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando álbum: ${id}`);

		// Verificar que el álbum existe
		const existingAlbum = await prisma.album.findUnique({
			where: { id },
		});

		if (!existingAlbum) {
			throw createAlbumError(`No se encontró el álbum con ID: ${id}`, AlbumErrorCode.NOT_FOUND);
		}

		// Notificar antes de eliminar para tener los datos completos
		await notifyAlbumChange('delete', { id });

		// Eliminar álbum usando el transformador
		await deleteAlbum(id);

		logger.info(`✅ Álbum eliminado: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar álbum', { error, albumId: id });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(`Error al eliminar álbum: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Obtiene estadísticas para un álbum específico
 */
export const getAlbumStatsService = async (id: string): Promise<AlbumWithStats> => {
	try {
		logger.info(`📊 Obteniendo estadísticas del álbum: ${id}`);

		// Verificar que el álbum existe
		const albumData = await prisma.album.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
					},
				},
			},
		});

		if (!albumData) {
			throw createAlbumError(`No se encontró el álbum con ID: ${id}`, AlbumErrorCode.NOT_FOUND);
		}

		// Obtener tamaño total de activos
		const [imagesSize, videosSize] = await Promise.all([
			// Tamaño total de imágenes
			prisma.image.aggregate({
				where: {
					albums: {
						some: { id },
					},
				},
				_sum: {
					size: true,
				},
			}),
			// Tamaño total de videos
			prisma.video.aggregate({
				where: {
					albums: {
						some: { id },
					},
				},
				_sum: {
					size: true,
				},
			}),
		]);

		// Transformar álbum
		const album = fromPrismaAlbum(albumData);

		// Calcular estadísticas
		const totalSize = (imagesSize._sum.size || 0) + (videosSize._sum.size || 0);
		const totalItems =
			albumData._count.images +
			albumData._count.videos +
			albumData._count.characters +
			albumData._count.places +
			albumData._count.worldItems +
			albumData._count.concepts;

		// Obtener fechas de último acceso
		const lastUpdated = albumData.updatedAt;
		const lastAccessed = albumData.lastAccessedAt || albumData.updatedAt;

		// Construir objeto con estadísticas
		const stats = {
			totalItems,
			totalSize,
			imagesCount: albumData._count.images,
			videosCount: albumData._count.videos,
			charactersCount: albumData._count.characters,
			placesCount: albumData._count.places,
			worldItemsCount: albumData._count.worldItems,
			conceptsCount: albumData._count.concepts,
			imagesSize: imagesSize._sum.size || 0,
			videosSize: videosSize._sum.size || 0,
			lastUpdated,
			lastAccessed,
		};

		// Emitir evento de estadísticas
		await emit({
			type: ALBUM_EVENTS.STATS_UPDATED,
			data: { albumId: id, stats },
		});

		logger.info(`✅ Estadísticas obtenidas para el álbum: ${id}`);
		return {
			...album,
			stats,
		};
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas del álbum', { error, albumId: id });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(`Error al obtener estadísticas: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Añade una imagen a un álbum
 */
export const addImageToAlbumService = async (albumId: string, imageId: string): Promise<void> => {
	try {
		logger.info(`➕ Añadiendo imagen ${imageId} al álbum ${albumId}`);

		// Verificar que el álbum existe
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		});

		if (!album) {
			throw createAlbumError(`No se encontró el álbum con ID: ${albumId}`, AlbumErrorCode.NOT_FOUND);
		}

		// Verificar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createAlbumError(`No se encontró la imagen con ID: ${imageId}`, AlbumErrorCode.INVALID_DATA);
		}

		// Añadir imagen al álbum
		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					connect: { id: imageId },
				},
				updatedAt: new Date(),
			},
		});

		// Notificar cambio
		await notifyAlbumChange('items:add', { id: albumId });

		logger.info(`✅ Imagen ${imageId} añadida al álbum ${albumId}`);
	} catch (error) {
		logger.error('❌ Error al añadir imagen al álbum', { error, albumId, imageId });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(`Error al añadir imagen al álbum: ${error.message}`, AlbumErrorCode.OPERATION_FAILED, error);
	}
};

/**
 * Elimina una imagen de un álbum
 */
export const removeImageFromAlbumService = async (albumId: string, imageId: string): Promise<void> => {
	try {
		logger.info(`➖ Eliminando imagen ${imageId} del álbum ${albumId}`);

		// Verificar que el álbum existe
		const album = await prisma.album.findUnique({
			where: { id: albumId },
		});

		if (!album) {
			throw createAlbumError(`No se encontró el álbum con ID: ${albumId}`, AlbumErrorCode.NOT_FOUND);
		}

		// Eliminar imagen del álbum
		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
				updatedAt: new Date(),
			},
		});

		// Notificar cambio
		await notifyAlbumChange('items:remove', { id: albumId });

		logger.info(`✅ Imagen ${imageId} eliminada del álbum ${albumId}`);
	} catch (error) {
		logger.error('❌ Error al eliminar imagen del álbum', { error, albumId, imageId });

		if (error.name === 'AlbumServiceError') {
			throw error;
		}

		throw createAlbumError(
			`Error al eliminar imagen del álbum: ${error.message}`,
			AlbumErrorCode.OPERATION_FAILED,
			error
		);
	}
};
