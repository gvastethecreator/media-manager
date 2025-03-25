'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
    groupFavoritesByType,
    mapCreateFavoriteDataToPrisma,
    toFavoriteExtended
} from '@/transformers/favorite';
import { transformImageToFileItem } from '@/transformers/favorite/serializers';
import {
    FavoriteAction,
    FavoriteBase,
    FavoriteCreateInput,
    FavoriteEntityType,
    FavoriteErrorCode,
    FavoriteEventType,
    FavoriteWithImage
} from '@/types/entities/favorite';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const favoriteLogger = serverLogger.withContext('FavoriteActions');
const REVALIDATE_PATHS = ['/settings', '/favorites', '/images/[id]'] as const;

// Utilitarias funcionales
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	favoriteLogger.info('🔄 Rutas revalidadas');
};

// Función creadora de errores (enfoque funcional)
const createFavoriteError = (
	message: string,
	code: FavoriteErrorCode = FavoriteErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'FavoriteError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * Notifica sobre cambios en los favoritos
 */
const notifyFavoriteChange = async (
	entityId: string,
	entityType: string,
	action: FavoriteAction
): Promise<void> => {
	try {
		// Emitir eventos usando el sistema del servidor
		await emit({
			type: FavoriteEventType.MODIFIED,
			entityId,
			data: { action, entityType },
		});
		statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE);
		await revalidateAllPaths();
	} catch (error) {
		favoriteLogger.error('❌ Error al notificar cambio de favorito:', { entityId, entityType, action, error });
	}
};

/**
 * Agrega una entidad a favoritos
 */
export async function addToFavorites(entityId: string, entityType: string): Promise<FavoriteWithImage> {
	try {
		favoriteLogger.info('⭐ Agregando entidad a favoritos:', { entityId, entityType });

		if (entityType === FavoriteEntityType.IMAGE) {
			// Obtener la imagen
			const image = await prisma.image.findUnique({
				where: { id: entityId },
				include: {
					tags: true,
					collections: true,
				},
			});

			if (!image) {
				throw createFavoriteError(
					'No se encontró la imagen',
					FavoriteErrorCode.ENTITY_NOT_FOUND
				);
			}

			// Actualizar el campo isFavorite de la imagen
			const updatedImage = await prisma.image.update({
				where: { id: entityId },
				data: { isFavorite: true },
				include: {
					tags: true,
					collections: true,
				},
			});

			// Crear datos de favorito usando el transformer
			const favoriteData: FavoriteCreateInput = {
				entityId: updatedImage.id,
				entityType: FavoriteEntityType.IMAGE
			};

			// Mapear datos usando el transformer
			const favoriteInputData = mapCreateFavoriteDataToPrisma(favoriteData);

			// Crear la estructura de favorito
			const favorite: FavoriteBase = {
				id: updatedImage.id,
				entityId: updatedImage.id,
				entityType: favoriteInputData.entityType,
				userId: null, // Añadir usuario cuando se implemente autenticación
				createdAt: updatedImage.createdAt,
				updatedAt: updatedImage.updatedAt
			};

			await notifyFavoriteChange(entityId, entityType, FavoriteAction.ADD);

			// Transformar el favorito con la imagen usando el serializer
			return {
				...favorite,
				image: transformImageToFileItem(updatedImage)
			};
		}

		throw createFavoriteError(
			`Tipo de entidad no soportada: ${entityType}`,
			FavoriteErrorCode.INVALID_ENTITY_TYPE
		);
	} catch (error) {
		favoriteLogger.error('❌ Error al agregar a favoritos:', { entityId, entityType, error });

		if (error instanceof Error && error.name === 'FavoriteError') {
			throw error;
		}

		throw createFavoriteError(
			'No se pudo agregar a favoritos',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Elimina una entidad de favoritos
 */
export async function removeFromFavorites(entityId: string, entityType: string): Promise<void> {
	try {
		favoriteLogger.info('🗑️ Eliminando entidad de favoritos:', { entityId, entityType });

		if (entityType === FavoriteEntityType.IMAGE) {
			// Actualizar el campo isFavorite de la imagen
			await prisma.image.update({
				where: { id: entityId },
				data: { isFavorite: false },
			});

			await notifyFavoriteChange(entityId, entityType, FavoriteAction.REMOVE);
			return;
		}

		throw createFavoriteError(
			`Tipo de entidad no soportada: ${entityType}`,
			FavoriteErrorCode.INVALID_ENTITY_TYPE
		);
	} catch (error) {
		favoriteLogger.error('❌ Error al eliminar de favoritos:', { entityId, entityType, error });

		if (error instanceof Error && error.name === 'FavoriteError') {
			throw error;
		}

		throw createFavoriteError(
			'No se pudo eliminar de favoritos',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene todos los favoritos
 */
export async function getFavorites(): Promise<FavoriteWithImage[]> {
	try {
		favoriteLogger.info('📥 Obteniendo lista de favoritos');

		// Actualmente solo soportamos imágenes favoritas
		const favoriteImages = await prisma.image.findMany({
			where: { isFavorite: true },
			include: {
				tags: true,
				collections: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		// Convertir las imágenes a favoritos con imagen usando los transformers
		const favorites: FavoriteBase[] = favoriteImages.map(image => ({
			id: image.id,
			entityId: image.id,
			entityType: FavoriteEntityType.IMAGE,
			userId: null,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt
		}));

		// Transformar a FavoriteWithImage usando el serializer
		const transformedFavorites = favorites.map(favorite => {
			const imageData = favoriteImages.find(img => img.id === favorite.entityId);
			return {
				...favorite,
				image: transformImageToFileItem(imageData || {})
			} as FavoriteWithImage;
		});

		favoriteLogger.info('✅ Favoritos obtenidos:', { count: transformedFavorites.length });
		return transformedFavorites;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener favoritos:', error);
		throw createFavoriteError(
			'No se pudieron obtener los favoritos',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Verifica si una entidad está en favoritos
 */
export async function isFavorited(entityId: string, entityType: string): Promise<boolean> {
	try {
		if (entityType === FavoriteEntityType.IMAGE) {
			const image = await prisma.image.findUnique({
				where: { id: entityId },
				select: { isFavorite: true },
			});

			return image?.isFavorite || false;
		}

		return false;
	} catch (error) {
		favoriteLogger.error('❌ Error al verificar favorito:', { entityId, entityType, error });
		throw createFavoriteError(
			'No se pudo verificar si la entidad está en favoritos',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Alterna el estado de favorito de una entidad
 */
export async function toggleFavorite(entityId: string, entityType: string): Promise<boolean> {
	try {
		favoriteLogger.info('🔄 Alternando estado de favorito:', { entityId, entityType });

		if (entityType === FavoriteEntityType.IMAGE) {
			// Comprobar el estado actual
			const image = await prisma.image.findUnique({
				where: { id: entityId },
				select: { id: true, isFavorite: true },
			});

			if (!image) {
				throw createFavoriteError(
					'No se encontró la imagen',
					FavoriteErrorCode.ENTITY_NOT_FOUND
				);
			}

			// Invertir el estado
			const newState = !image.isFavorite;

			// Actualizar la imagen
			await prisma.image.update({
				where: { id: entityId },
				data: { isFavorite: newState },
			});

			// Notificar cambio
			await notifyFavoriteChange(
				entityId,
				entityType,
				newState ? FavoriteAction.ADD : FavoriteAction.REMOVE
			);

			return newState;
		}

		throw createFavoriteError(
			`Tipo de entidad no soportada: ${entityType}`,
			FavoriteErrorCode.INVALID_ENTITY_TYPE
		);
	} catch (error) {
		favoriteLogger.error('❌ Error al alternar favorito:', { entityId, entityType, error });

		if (error instanceof Error && error.name === 'FavoriteError') {
			throw error;
		}

		throw createFavoriteError(
			'No se pudo alternar el estado de favorito',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene favoritos con estadísticas agrupadas por tipo
 */
export async function getFavoriteStats() {
	try {
		favoriteLogger.info('📊 Obteniendo estadísticas de favoritos');

		// Obtener todos los favoritos
		const favorites = await getFavorites();

		// Convertir a tipo extendido usando transformers
		const extendedFavorites = favorites.map(fav => toFavoriteExtended({
			id: fav.id,
			entityId: fav.entityId,
			entityType: fav.entityType,
			userId: fav.userId,
			createdAt: fav.createdAt,
			updatedAt: fav.updatedAt
		}));

		// Agrupar por tipo usando transformer
		const groupedFavorites = groupFavoritesByType(extendedFavorites);

		// Crear objeto de estadísticas
		const stats = {
			totalCount: favorites.length,
			byType: Object.fromEntries(
				groupedFavorites.map(group => [group.type, group.count])
			),
			byGroups: groupedFavorites,
			recentlyAdded: extendedFavorites
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 5)
		};

		favoriteLogger.info('✅ Estadísticas de favoritos obtenidas');
		return stats;
	} catch (error) {
		favoriteLogger.error('❌ Error al obtener estadísticas de favoritos:', error);
		throw createFavoriteError(
			'No se pudieron obtener las estadísticas de favoritos',
			FavoriteErrorCode.OPERATION_FAILED,
			error
		);
	}
}
