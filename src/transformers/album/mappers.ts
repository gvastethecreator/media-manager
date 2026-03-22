/**
 * @file Mappers para la entidad Album.
 * @module transformers/album/mappers
 * @description Contiene funciones para transformar datos de la entidad Album.
 * ✅ MIGRADO A DRIZZLE - Julio 2025

 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { AlbumCreateInput, AlbumStatistics, AlbumWithStats } from '../../types/entities/album/index';

/**
 * Tipo para datos de álbum que vienen de Drizzle con relaciones
 */
interface DrizzleAlbumWithRelations {
	category: string | null;
	characters?: { id: string }[];
	collections?: { id: string }[];
	color: string | null;
	concepts?: { id: string }[];
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	filters: string | null;
	groups?: { id: string }[];
	id: string;
	images?: { id: string }[];

	isFavorite: boolean;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	metadata: Record<string, any> | null;
	name: string;
	notes?: { id: string }[];
	places?: { id: string }[];
	prompts?: { id: string }[];
	properties?: { id: string }[];
	shortcut: string | null;
	tags?: { id: string }[];
	totalImages: number;
	totalSize: number;
	totalVideos: number;
	updatedAt: Date;
	videos?: { id: string }[];
	wildcards?: { id: string }[];
	worldItems?: { id: string }[];
}

/**
 * Estructura para datos de creación de álbum compatible con Drizzle
 */
interface DrizzleCreateAlbumData {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	filters?: string | null;

	isFavorite?: boolean;
	lastImageAddedAt?: Date | null;
	lastVideoAddedAt?: Date | null;
	metadata?: string | null;
	name: string;
	shortcut?: string | null;
	totalImages?: number;
	totalSize?: number;
	totalVideos?: number;
}

/**
 * Estructura para filtros de álbum compatible con Drizzle
 */
interface DrizzleAlbumFilters {
	AND?: DrizzleAlbumFilters[];
	category?: { in?: string[] };
	createdAt?: { gte?: Date; lte?: Date };
	isFavorite?: boolean;
	name?: { contains?: string };
	OR?: DrizzleAlbumFilters[];
}

interface DrizzleFindManyArgs {
	orderBy?: { [key: string]: 'asc' | 'desc' };
	skip?: number;
	take?: number;
	where?: DrizzleAlbumFilters;
}

/**
 * Mapea datos de creación de álbum a formato compatible con Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación de álbum
 * @returns Objeto formateado para Drizzle
 */
export function mapCreateAlbumDataToDrizzle(data: AlbumCreateInput): DrizzleCreateAlbumData {
	return {
		name: data.name,
		description: data.description ?? null,
		emoji: data.emoji ?? null,
		color: data.color ?? null,
		featuredImage: data.featuredImage ?? null,

		isFavorite: data.isFavorite ?? false,
		totalImages: 0,
		totalVideos: 0,
		totalSize: 0,
		filters: data.filters ?? null,
		shortcut: data.shortcut ?? null,
		category: data.category ?? null,
		metadata: null,
		lastImageAddedAt: null,
		lastVideoAddedAt: null,
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

/**
 * Transforma datos de álbum de Drizzle a AlbumWithStats
 * ✅ MIGRADO A DRIZZLE
 * @param drizzleAlbum Datos de álbum de Drizzle con relaciones
 * @returns Álbum con estadísticas calculadas
 */
export function toAlbumWithStats(drizzleAlbum: DrizzleAlbumWithRelations): AlbumWithStats {
	// Calcular estadísticas basadas en las relaciones disponibles
	// Si las relaciones no están cargadas, usar los valores de los campos directos
	const stats: AlbumStatistics = {
		...createDefaultEntityStats(),
		imageCount: drizzleAlbum.images?.length ?? drizzleAlbum.totalImages ?? 0,
		videoCount: drizzleAlbum.videos?.length ?? drizzleAlbum.totalVideos ?? 0,
		collectionCount: drizzleAlbum.collections?.length ?? 0,
		tagCount: drizzleAlbum.tags?.length ?? 0,
		characterCount: drizzleAlbum.characters?.length ?? 0,
		placeCount: drizzleAlbum.places?.length ?? 0,
		worldItemCount: drizzleAlbum.worldItems?.length ?? 0,
		conceptCount: drizzleAlbum.concepts?.length ?? 0,
		promptCount: drizzleAlbum.prompts?.length ?? 0,
		noteCount: drizzleAlbum.notes?.length ?? 0,
		wildcardCount: drizzleAlbum.wildcards?.length ?? 0,
		propertyCount: drizzleAlbum.properties?.length ?? 0,
		groupCount: drizzleAlbum.groups?.length ?? 0,
		// Propiedades adicionales de AlbumStatistics
		isDirectory: false,
		isFile: true,
	} as AlbumStatistics;

	// Crear el objeto AlbumWithStats
	const albumWithStats: AlbumWithStats = {
		id: drizzleAlbum.id,
		name: drizzleAlbum.name,
		description: drizzleAlbum.description,
		emoji: drizzleAlbum.emoji,
		color: drizzleAlbum.color,
		featuredImage: drizzleAlbum.featuredImage,

		isFavorite: drizzleAlbum.isFavorite,
		totalImages: drizzleAlbum.totalImages,
		totalVideos: drizzleAlbum.totalVideos,
		totalSize: drizzleAlbum.totalSize,
		filters: drizzleAlbum.filters,
		shortcut: drizzleAlbum.shortcut,
		category: drizzleAlbum.category,
		metadata: drizzleAlbum.metadata,
		lastImageAddedAt: drizzleAlbum.lastImageAddedAt,
		lastVideoAddedAt: drizzleAlbum.lastVideoAddedAt,
		createdAt: drizzleAlbum.createdAt,
		updatedAt: drizzleAlbum.updatedAt,
		entityType: 'album' as const,
		stats,
	};

	return albumWithStats;
}
