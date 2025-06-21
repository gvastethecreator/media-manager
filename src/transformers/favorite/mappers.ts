/**
 * @file Mappers para la entidad Favorite
 * @module transformers/favorite/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    FAVORITE_ENTITY_COLORS,
    FAVORITE_ENTITY_DISPLAY_NAMES,
    FAVORITE_ENTITY_EMOJIS,
    type FavoriteBase,
    type FavoriteCreateInput,
    type FavoriteExtended,
    type FavoriteFilters,
    type FavoriteUpdateInput,
} from '@/types/entities/favorite';
import type { Prisma } from '@prisma/client';

const mappersLogger = serverLogger.withContext('Favorite:Mappers');

/**
 * Convierte un favorito base en un favorito extendido para UI
 * @param favorite Favorito base
 * @returns Favorito extendido con propiedades para UI
 */
export function toFavoriteExtended(favorite: FavoriteBase): FavoriteExtended {
	try {
		const entityType = favorite.entityType.toLowerCase();

		return {
			...favorite,
			entityIcon: FAVORITE_ENTITY_EMOJIS[entityType] || FAVORITE_ENTITY_EMOJIS.default,
			entityColor: FAVORITE_ENTITY_COLORS[entityType] || FAVORITE_ENTITY_COLORS.default,
		};
	} catch (error) {
		mappersLogger.error('Error convirtiendo a favorito extendido:', error);
		return favorite as FavoriteExtended;
	}
}

/**
 * Convierte una lista de favoritos base en favoritos extendidos
 * @param favorites Lista de favoritos base
 * @returns Lista de favoritos extendidos
 */
export function toFavoritesExtended(favorites: FavoriteBase[]): FavoriteExtended[] {
	return favorites.map(toFavoriteExtended);
}

/**
 * Mapea filtros de favoritos a formato para consulta Prisma
 * @param filters Filtros de favoritos
 * @returns Objeto de consulta para Prisma
 */
export function mapFavoriteFiltersToPrisma(filters: FavoriteFilters): Prisma.FavoriteFindManyArgs {
	const prismaQuery: Prisma.FavoriteFindManyArgs = {
		where: {},
		take: filters.limit || 20,
		skip: filters.offset || 0,
		orderBy: {
			[filters.sort || 'createdAt']: filters.order || 'desc',
		},
	};

	if (filters.entityType && filters.entityType.length > 0) {
		prismaQuery.where.entityType = { in: filters.entityType };
	}

	if (filters.userId) {
		prismaQuery.where.userId = filters.userId;
	}

	return prismaQuery;
}

/**
 * Transforma datos de creación a formato para Prisma
 * @param data Datos de creación
 * @returns Datos formateados para Prisma
 */
export function mapCreateFavoriteDataToPrisma(data: FavoriteCreateInput): Prisma.FavoriteCreateInput {
	return {
		entityId: data.entityId,
		entityType: data.entityType,
		userId: data.userId,
	};
}

/**
 * Transforma datos de actualización a formato para Prisma
 * @param data Datos de actualización
 * @returns Datos formateados para Prisma
 */
export function mapUpdateFavoriteDataToPrisma(data: FavoriteUpdateInput): Prisma.FavoriteUpdateInput {
	const { id, ...updateData } = data;
	return updateData;
}

/**
 * Agrupa favoritos por tipo de entidad
 * @param favorites Lista de favoritos extendidos
 * @returns Objeto agrupado por tipo con metadatos
 */
export function groupFavoritesByType(favorites: FavoriteExtended[]) {
	const groupedByType: Record<string, FavoriteExtended[]> = {};

	// Agrupar por tipo de entidad
	for (const favorite of favorites) {
		const type = favorite.entityType.toLowerCase();
		if (!groupedByType[type]) {
			groupedByType[type] = [];
		}
		groupedByType[type].push(favorite);
	}

	// Convertir a formato para UI
	return Object.entries(groupedByType).map(([type, items]) => ({
		type,
		displayName: FAVORITE_ENTITY_DISPLAY_NAMES[type] || FAVORITE_ENTITY_DISPLAY_NAMES.default,
		icon: FAVORITE_ENTITY_EMOJIS[type] || FAVORITE_ENTITY_EMOJIS.default,
		color: FAVORITE_ENTITY_COLORS[type] || FAVORITE_ENTITY_COLORS.default,
		count: items.length,
		items,
	}));
}
