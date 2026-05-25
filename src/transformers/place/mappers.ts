/**
 * @file Funciones para mapear y transformar datos de la entidad Place.
 * @module transformers/place/mappers
 * @description Contiene funciones para:
 *              1. Transformar la entrada de la app (forms, actions) a tipos de Drizzle (create/update).
 *              2. Transformar los datos de Drizzle a tipos enriquecidos de la app (PlaceWithStats).

 */

import { createDefaultEntityStats } from '@/lib/utils';
import { safeJsonParse } from '@/lib/utils/json';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import { normalizeCounts } from '../common/counts';
import { PlaceCreateInput, PlaceStatistics, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place/base';
import type { PlaceSearchOptions } from '@/types/entities/place/types';

// Tipos locales equivalentes a Drizzle
interface DrizzlePlaceWithCounts {
	_count?: {
		images?: number;
		tags?: number;
		notes?: number;
		characters?: number;
		collections?: number;
		concepts?: number;
	};
	category: string | null;
	climate: string | null;
	color: string | null;
	createdAt: Date;
	culture: string | null;
	dangers: string | null;
	description: string | null;
	economy: string | null;
	emoji: string | null;
	featuredImage: string | null;
	geography: string | null;
	government: string | null;
	history: string | null;
	id: string;

	isFavorite: boolean;
	landmarks: string | null;
	location: string | null;
	name: string;
	notes: string | null;
	parentId: string | null;
	population: string | null;
	resources: string | null;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	updatedAt: Date;
}

interface DrizzleCreatePlaceData {
	category?: string | null;
	climate?: string | null;
	color?: string | null;
	culture?: string | null;
	dangers?: string | null; // JSON
	description?: string | null;
	economy?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	geography?: string | null;
	government?: string | null;
	history?: string | null;

	isFavorite?: boolean;
	landmarks?: string | null;
	location?: string | null;
	name: string;
	notes?: string | null;
	parentId?: string | null;
	population?: string | null;
	resources?: string | null; // JSON
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
}

type DrizzleUpdatePlaceData = Partial<DrizzleCreatePlaceData>;

interface DrizzleOrderBy {
	[key: string]: 'asc' | 'desc';
}

interface DrizzleWhereFilter {
	AND?: DrizzleWhereFilter[];
	category?: { equals?: string; in?: string[] };
	description?: { contains?: string; equals?: string };
	history?: { contains?: string; equals?: string };
	isFavorite?: boolean;
	location?: { equals?: string };
	name?: { contains?: string; equals?: string };
	OR?: DrizzleWhereFilter[];
	type?: { equals?: string; in?: string[] };
}

interface DrizzleFindManyArgs {
	orderBy?: DrizzleOrderBy;
	skip?: number;
	take?: number;
	where?: DrizzleWhereFilter;
}

/**
 * 🗺️ Transforma un objeto Place de Drizzle a un objeto PlaceWithStats enriquecido.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param place - El objeto de la base de datos, incluyendo los `_count` de relaciones.
 * @returns Un objeto PlaceWithStats con campos JSON parseados y estadísticas calculadas.
 */
export function toPlaceWithStats(place: DrizzlePlaceWithCounts): PlaceWithStats {
	const { _count, ...rest } = place;

	const counts = normalizeCounts(_count);

	// Campos que contribuyen a la puntuación de completitud
	const completenessFields = [
		rest.description,
		rest.location,
		rest.type,
		rest.climate,
		rest.population,
		rest.government,
		rest.history,
	];

	// Métricas de popularidad basadas en conteos
	const popularity = counts.images + counts.notes + counts.characters + counts.collections + counts.tags;

	const statistics: PlaceStatistics = {
		...createDefaultEntityStats({
			imageCount: counts.images,
			noteCount: counts.notes,
			tagCount: counts.tags,
			collectionCount: counts.collections,
			conceptCount: counts.concepts,
			placeCount: 1,
			totalItems: popularity,
			type: 'place',
		}),
		popularity,
		completenessScore: calculateCompleteness(completenessFields),
		spatialRelevance: 0,
		geoContextLevel: 0,
		isDirectory: false,
		isFile: true,
	} as PlaceStatistics;

	const result: PlaceWithStats = {
		...rest,
		entityType: 'place' as const,
		stats: statistics,
		_count: _count || {},
		parsedDangers: safeJsonParse(rest.dangers, []),
		parsedResources: safeJsonParse(rest.resources, []),
		parsedStats: {},
		metadata: {},
		region: null,
		// Conteos individuales para compatibilidad
		images: counts.images,
		tags: counts.tags,
		notesCount: counts.notes,
		characters: counts.characters,
		collections: counts.collections,
		concepts: counts.concepts,
	};

	return result;
}

/**
 * Mapea la entrada de creación de un lugar al formato de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param input - Los datos para crear el lugar, incluyendo IDs de relaciones.
 * @returns Datos listos para inserción en Drizzle.
 */
export function toCreateDataForDrizzle(input: PlaceCreateInput): DrizzleCreatePlaceData {
	const {
		images,
		notes,
		tags,
		characters,
		collections,
		concepts,
		promptIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input as any; // Usamos 'as any' para manejar las relaciones que no están en el tipo base

	return {
		...rest,
		dangers: null,
		resources: null,
		// Las relaciones se manejan por separado en Drizzle con junction tables
	};
}

/**
 * Mapea la entrada de actualización de un lugar al formato de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param input - Los datos para actualizar el lugar. Puede ser parcial.
 * @returns Datos listos para actualización en Drizzle.
 */
export function toUpdateDataForDrizzle(input: PlaceUpdateInput): DrizzleUpdatePlaceData {
	const {
		images,
		notes,
		tags,
		characters,
		collections,
		concepts,
		promptIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input as any; // Usamos 'as any' para manejar las relaciones que no están en el tipo base

	const data: DrizzleUpdatePlaceData = { ...rest };

	// Las relaciones se manejan por separado en Drizzle con junction tables
	return data;
}

/**
 * Crea la cláusula `orderBy` para las consultas de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Opciones de búsqueda que contienen el `orderBy`.
 * @returns El objeto `orderBy` para Drizzle.
 */
export function createOrderByForDrizzle(options: PlaceSearchOptions = {}): DrizzleOrderBy | undefined {
	if (options.orderBy) {
		return options.orderBy as DrizzleOrderBy;
	}
	return { updatedAt: 'desc' };
}

/**
 * Crea la cláusula `where` para las consultas de Drizzle a partir de los filtros.
 * ✅ MIGRADO A DRIZZLE
 * @param filters - Los filtros de búsqueda de la aplicación.
 * @returns El objeto `where` para Drizzle.
 */
export function createFilterForDrizzle(filters: PlaceSearchOptions['filters'] = {}): DrizzleWhereFilter {
	const where: DrizzleWhereFilter = {};

	if (filters?.search) {
		const search = filters.search.trim();
		where.OR = [
			{ name: { contains: search } },
			{ description: { contains: search } },
			{ history: { contains: search } },
		];
	}

	if (filters?.category) {
		if (Array.isArray(filters.category)) {
			where.category = { in: filters.category };
		} else {
			where.category = { equals: filters.category };
		}
	}

	if (filters?.type) {
		if (Array.isArray(filters.type)) {
			where.type = { in: filters.type };
		} else {
			where.type = { equals: filters.type };
		}
	}

	if (filters?.location) {
		where.location = { equals: filters.location };
	}

	if (filters?.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	return where;
}

/**
 * Convierte las opciones de búsqueda de la aplicación a un formato compatible con Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Las opciones de búsqueda de la aplicación.
 * @returns Un objeto con las opciones de consulta para Drizzle.
 */
export function toSearchOptionsForDrizzle(options: PlaceSearchOptions = {}): DrizzleFindManyArgs {
	const args: DrizzleFindManyArgs = {};

	if (options.filters) {
		args.where = createFilterForDrizzle(options.filters);
	}

	if (options.orderBy) {
		args.orderBy = createOrderByForDrizzle(options);
	}

	if (options.pagination) {
		if (options.pagination.skip !== undefined) {
			args.skip = options.pagination.skip;
		}
		if (options.pagination.take !== undefined) {
			args.take = options.pagination.take;
		}
	}

	return args;
}
