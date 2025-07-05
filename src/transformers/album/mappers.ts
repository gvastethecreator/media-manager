/**
 * @file Mappers para la entidad Album.
 * @module transformers/album/mappers
 * @description Contiene funciones para transformar datos de la entidad Album.
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 
 */

import type { Album, AlbumStatistics, AlbumWithStats, CreateAlbumInput } from '@/types/entities/album';

/**
 * Estructura para datos de creación de álbum compatible con Drizzle
 */
type DrizzleCreateAlbumData = {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isFavorite?: boolean;
	featuredImage?: string | null;
};

/**
 * Estructura para filtros de álbum compatible con Drizzle
 */
type DrizzleAlbumFilters = {
	AND?: DrizzleAlbumFilters[];
	OR?: DrizzleAlbumFilters[];
	name?: { contains?: string };
	category?: { in?: string[] };
	isFavorite?: boolean;
	createdAt?: { gte?: Date; lte?: Date };
};

type DrizzleFindManyArgs = {
	where?: DrizzleAlbumFilters;
	take?: number;
	skip?: number;
	orderBy?: { [key: string]: 'asc' | 'desc' };
};

/**
 * Representa la estructura del objeto de agregación de conteos para un Album.
 */
type AlbumCounts = {
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
};

/**
 * Convierte un objeto Album y sus conteos a un objeto canónico AlbumWithStats.
 *
 * @param album El objeto Album.
 * @param counts Los conteos de las relaciones del álbum.
 * @returns Un objeto AlbumWithStats.
 */
export function toAlbumWithStats(album: Album, counts: AlbumCounts['_count']): AlbumWithStats {
	const stats: AlbumStatistics = {
		imageCount: counts.images,
		videoCount: counts.videos,
		collectionCount: counts.collections,
		tagCount: counts.tags,
		characterCount: counts.characters,
		placeCount: counts.places,
		worldItemCount: counts.worldItems,
		conceptCount: counts.concepts,
		promptCount: counts.prompts,
		noteCount: counts.notes,
		wildcardCount: counts.wildcards,
		propertyCount: counts.properties,
		groupCount: counts.groups,
	};

	return {
		...album,
		stats,
	};
}

/**
 * Mapea datos de creación de álbum a formato compatible con Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación de álbum
 * @returns Objeto formateado para Drizzle
 */
export function mapCreateAlbumDataToDrizzle(data: CreateAlbumInput): DrizzleCreateAlbumData {
	return {
		name: data.name,
		description: data.description || null,
		emoji: data.emoji || null,
		color: data.color || null,
		category: data.category || null,
		isFavorite: data.isFavorite || false,
		featuredImage: data.featuredImage || null,
	};
}

/**
 * Mapea filtros de álbum a formato compatible con Drizzle para consultas
 * ✅ MIGRADO A DRIZZLE
 * @param filters Filtros de álbum
 * @returns Objeto de condiciones para Drizzle
 */
export function mapAlbumFiltersToDrizzle(filters: {
	searchQuery?: string;
	categories?: string[];
	isFavorite?: boolean;
	startDate?: Date | string;
	endDate?: Date | string;
	limit?: number;
	offset?: number;
}): DrizzleFindManyArgs {
	const where: DrizzleAlbumFilters = {};

	// Filtrar por búsqueda en nombre
	if (filters.searchQuery) {
		where.name = {
			contains: filters.searchQuery,
		};
	}

	// Filtrar por categorías
	if (filters.categories && filters.categories.length > 0) {
		where.category = { in: filters.categories };
	}

	// Filtrar por favoritos
	if (typeof filters.isFavorite === 'boolean') {
		where.isFavorite = filters.isFavorite;
	}

	// Filtrar por fechas
	if (filters.startDate || filters.endDate) {
		where.createdAt = {};

		if (filters.startDate) {
			where.createdAt.gte = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate;
		}

		if (filters.endDate) {
			where.createdAt.lte = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate;
		}
	}

	return {
		where,
		take: filters.limit || 20,
		skip: filters.offset || 0,
		orderBy: {
			createdAt: 'desc',
		},
	};
}
