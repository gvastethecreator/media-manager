/**
 * @file Mappers para la entidad Favorite.
 * @module transformers/favorite/mappers
 * @description Contiene funciones para transformar datos de Favorite entre tipos base y enriquecidos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { FavoriteBase, FavoriteStatistics, FavoriteWithStats, FavoriteEntityType } from '@/types/entities/favorite';

/**
 * 📊 Calcula las estadísticas de un favorito.
 *
 * @param favorite - El favorito base desde Drizzle
 * @returns Las estadísticas calculadas del favorito
 */
function calculateFavoriteStats(favorite: FavoriteBase): FavoriteStatistics {
	const now = new Date();
	const createdAt = new Date(favorite.createdAt);
	const daysSinceFavorited = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
	
	// Mapeo de tipos de entidad a nombres legibles
	const entityTypeNames: Record<FavoriteEntityType, string> = {
		image: 'Imagen',
		video: 'Video',
		album: 'Álbum',
		collection: 'Colección',
		folder: 'Carpeta',
		character: 'Personaje',
		place: 'Lugar',
		worldItem: 'Elemento del Mundo',
		concept: 'Concepto',
		prompt: 'Prompt',
		note: 'Nota',
		document: 'Documento',
		file: 'Archivo',
		tag: 'Etiqueta',
		group: 'Grupo',
	};

	return {
		entityTypeName: entityTypeNames[favorite.entityType],
		formattedCreatedAt: createdAt.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		daysSinceFavorited,
		isRecent: daysSinceFavorited <= 7,
		isOld: daysSinceFavorited > 30,
	};
}

/**
 * ⭐ Transforma un favorito base en un favorito con estadísticas.
 * Esta es la función principal de transformación para la entidad Favorite.
 *
 * @param favorite - El favorito base desde Drizzle
 * @returns Un favorito enriquecido con estadísticas calculadas
 */
export function toFavoriteWithStats(favorite: FavoriteBase): FavoriteWithStats {
	const stats = calculateFavoriteStats(favorite);

	return {
		...favorite,
		stats,
	};
}

/**
 * ⭐ Transforma una lista de favoritos base en favoritos con estadísticas.
 *
 * @param favorites - Lista de favoritos base desde Drizzle
 * @returns Lista de favoritos enriquecidos con estadísticas
 */
export function toFavoriteWithStatsList(favorites: FavoriteBase[]): FavoriteWithStats[] {
	return favorites.map(toFavoriteWithStats);
}

/**
 * 📊 Agrupa favoritos por tipo de entidad.
 *
 * @param favorites - Lista de favoritos con estadísticas
 * @returns Objeto con favoritos agrupados por tipo de entidad
 */
export function groupFavoritesByType(favorites: FavoriteWithStats[]): Record<FavoriteEntityType, FavoriteWithStats[]> {
	const grouped = {} as Record<FavoriteEntityType, FavoriteWithStats[]>;

	// Inicializar grupos vacíos
	Object.values(FavoriteEntityType).forEach(type => {
		grouped[type] = [];
	});

	// Agrupar favoritos
	favorites.forEach(favorite => {
		if (grouped[favorite.entityType]) {
			grouped[favorite.entityType].push(favorite);
		}
	});

	return grouped;
}

/**
 * 📊 Obtiene estadísticas generales de favoritos.
 *
 * @param favorites - Lista de favoritos con estadísticas
 * @returns Resumen estadístico de los favoritos
 */
export function getFavoritesSummary(favorites: FavoriteWithStats[]) {
	const byType = Object.fromEntries(
		Object.values(FavoriteEntityType).map(type => [
			type,
			favorites.filter(f => f.entityType === type).length
		])
	);

	const recentFavorites = favorites.filter(f => f.stats.isRecent);
	const oldFavorites = favorites.filter(f => f.stats.isOld);

	return {
		total: favorites.length,
		byType,
		recentCount: recentFavorites.length,
		oldCount: oldFavorites.length,
		mostRecentDate: favorites.reduce((latest, f) => 
			f.createdAt > latest ? f.createdAt : latest, 
			new Date(0)
		),
		oldestDate: favorites.reduce((oldest, f) => 
			f.createdAt < oldest ? f.createdAt : oldest, 
			new Date()
		),
	};
}
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
 * ✅ MIGRADO A DRIZZLE
 * @param favorites Lista de favoritos base
 * @returns Lista de favoritos extendidos
 */
export function toFavoritesExtended(favorites: FavoriteBase[]): FavoriteExtended[] {
	return favorites.map(toFavoriteExtended);
}

/**
 * Mapea filtros de favoritos a formato para consulta Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param filters Filtros de favoritos
 * @returns Objeto de consulta para Drizzle
 */
export function mapFavoriteFiltersToDrizzle(filters: FavoriteFilters): DrizzleFavoriteFindManyArgs {
	const drizzleQuery: DrizzleFavoriteFindManyArgs = {
		where: {},
		take: filters.limit || 20,
		skip: filters.offset || 0,
		orderBy: {
			[filters.sort || 'createdAt']: filters.order || 'desc',
		},
	};

	if (filters.entityType && filters.entityType.length > 0) {
		drizzleQuery.where!.entityType = { in: filters.entityType };
	}

	if (filters.userId) {
		drizzleQuery.where!.userId = filters.userId;
	}

	return drizzleQuery;
}

/**
 * Transforma datos de creación a formato para Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación
 * @returns Datos formateados para Drizzle
 */
export function mapCreateFavoriteDataToDrizzle(data: FavoriteCreateInput): DrizzleFavoriteCreateInput {
	return {
		entityId: data.entityId,
		entityType: data.entityType,
		userId: data.userId,
	};
}

/**
 * Transforma datos de actualización a formato para Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de actualización
 * @returns Datos formateados para Drizzle
 */
export function mapUpdateFavoriteDataToDrizzle(data: FavoriteUpdateInput): DrizzleFavoriteUpdateInput {
	const { id, ...updateData } = data;
	return updateData;
}

/**
 * Agrupa favoritos por tipo de entidad
 * ✅ MIGRADO A DRIZZLE
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

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapFavoriteFiltersToDrizzle
 */
export const mapFavoriteFiltersToPrisma = mapFavoriteFiltersToDrizzle;

/**
 * @deprecated Usar mapCreateFavoriteDataToDrizzle
 */
export const mapCreateFavoriteDataToPrisma = mapCreateFavoriteDataToDrizzle;

/**
 * @deprecated Usar mapUpdateFavoriteDataToDrizzle
 */
export const mapUpdateFavoriteDataToPrisma = mapUpdateFavoriteDataToDrizzle;
