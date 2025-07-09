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
	featuredImage?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	totalSize?: number;
	filters?: string | null;
	shortcut?: string | null;
	category?: string | null;
	metadata?: string | null;
	lastImageAddedAt?: Date | null;
	lastVideoAddedAt?: Date | null;
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
		featuredImage: data.featuredImage || null,
		isPublic: data.isPublic || false,
		isFavorite: data.isFavorite || false,
		totalImages: data.totalImages || 0,
		totalVideos: data.totalVideos || 0,
		totalSize: data.totalSize || 0,
		filters: data.filters || null,
		shortcut: data.shortcut || null,
		category: data.category || null,
		metadata: data.metadata || null,
		lastImageAddedAt: data.lastImageAddedAt || null,
		lastVideoAddedAt: data.lastVideoAddedAt || null,
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
