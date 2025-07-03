/**
 * @file Funciones para mapear y transformar datos de la entidad Place.
 * @module transformers/place/mappers
 * @description Contiene funciones para:
 *              1. Transformar la entrada de la app (forms, actions) a tipos de Drizzle (create/update).
 *              2. Transformar los datos de Drizzle a tipos enriquecidos de la app (PlaceWithStats).
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { safeJsonParse } from '@/lib/utils/json';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import { PlaceCreateInput, PlaceUpdateInput, PlaceWithStats, PrismaPlaceWithCounts } from '@/types/entities/place/base';
import type { PlaceSearchOptions } from '@/types/entities/place/types';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleCreatePlaceData = {
	name: string;
	description?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: string | null;
	government?: string | null;
	lore?: string | null;
	history?: string | null;
	dangers: string; // JSON
	resources: string; // JSON
	stats: string; // JSON
	filters: string; // JSON
	isFavorite?: boolean;
	category?: string | null;
};

type DrizzleUpdatePlaceData = Partial<DrizzleCreatePlaceData>;

type DrizzleOrderBy = {
	[key: string]: 'asc' | 'desc';
};

type DrizzleWhereFilter = {
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	name?: { contains?: string; equals?: string };
	description?: { contains?: string; equals?: string };
	lore?: { contains?: string; equals?: string };
	history?: { contains?: string; equals?: string };
	category?: { equals?: string };
	type?: { equals?: string };
	region?: { equals?: string };
	isFavorite?: boolean;
};

type DrizzleFindManyArgs = {
	where?: DrizzleWhereFilter;
	orderBy?: DrizzleOrderBy;
	skip?: number;
	take?: number;
};

/**
 * 🗺️ Transforma un objeto Place de Drizzle a un objeto PlaceWithStats enriquecido.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param place - El objeto de la base de datos, incluyendo los `_count` de relaciones.
 * @returns Un objeto PlaceWithStats con campos JSON parseados y estadísticas calculadas.
 */
export function toPlaceWithStats(place: PrismaPlaceWithCounts): PlaceWithStats {
	const { _count, ...rest } = place;

	// Campos que contribuyen a la puntuación de completitud
	const completenessFields = [
		rest.description,
		rest.region,
		rest.type,
		rest.climate,
		rest.population,
		rest.government,
		rest.lore,
		rest.history,
	];

	// Métricas de popularidad basadas en conteos
	const popularity =
		(_count?.images ?? 0) +
		(_count?.notes ?? 0) +
		(_count?.characters ?? 0) +
		(_count?.collections ?? 0) +
		(_count?.tags ?? 0);

	const stats: PlaceWithStats = {
		...rest,
		dangers: safeJsonParse(rest.dangers, []),
		resources: safeJsonParse(rest.resources, []),
		stats: safeJsonParse(rest.stats, null),
		filters: safeJsonParse(rest.filters, null),
		_stats: {
			popularity,
			completenessScore: calculateCompleteness(completenessFields),
			// TODO: Implementar lógica real para estas métricas
			spatialRelevance: 0,
			geoContextLevel: 0,
		},
		_count,
	};

	return stats;
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
		dangers: JSON.stringify(input.dangers || []),
		resources: JSON.stringify(input.resources || []),
		stats: input.stats ? JSON.stringify(input.stats) : '{}',
		filters: input.filters ? JSON.stringify(input.filters) : '{}',
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

	if (input.dangers !== undefined) data.dangers = JSON.stringify(input.dangers);
	if (input.resources !== undefined) data.resources = JSON.stringify(input.resources);
	if (input.stats !== undefined) data.stats = JSON.stringify(input.stats);
	if (input.filters !== undefined) data.filters = JSON.stringify(input.filters);

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
			{ lore: { contains: search } },
			{ history: { contains: search } },
		];
	}

	if (filters?.category) where.category = { equals: filters.category };
	if (filters?.type) where.type = { equals: filters.type };
	if (filters?.region) where.region = { equals: filters.region };
	if (filters?.isFavorite) where.isFavorite = true;

	// Las relaciones se manejan con joins separados en Drizzle
	return where;
}

/**
 * Mapea las opciones de búsqueda de la aplicación a los argumentos de consulta de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Opciones de búsqueda de la aplicación.
 * @returns Argumentos para consultas de Drizzle.
 */
export function toSearchOptionsForDrizzle(options: PlaceSearchOptions = {}): DrizzleFindManyArgs {
	return {
		where: createFilterForDrizzle(options.filters),
		orderBy: createOrderByForDrizzle(options),
		skip: options.skip,
		take: options.take,
		// Los counts se manejan por separado en Drizzle
	};
}

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar toCreateDataForDrizzle
 */
export const toCreateData = toCreateDataForDrizzle;

/**
 * @deprecated Usar toUpdateDataForDrizzle
 */
export const toUpdateData = toUpdateDataForDrizzle;

/**
 * @deprecated Usar createOrderByForDrizzle
 */
export const createOrderBy = createOrderByForDrizzle;

/**
 * @deprecated Usar createFilterForDrizzle
 */
export const createFilter = createFilterForDrizzle;

/**
 * @deprecated Usar toSearchOptionsForDrizzle
 */
export const toSearchOptions = toSearchOptionsForDrizzle;
