/**
 * @file Funciones para mapear y transformar datos de la entidad Place.
 * @module transformers/place/mappers
 * @description Contiene funciones para:
 *              1. Transformar la entrada de la app (forms, actions) a tipos de Prisma (create/update).
 *              2. Transformar los datos de Prisma a tipos enriquecidos de la app (PlaceWithStats).
 */

import { safeJsonParse } from '@/lib/utils/json';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import { PlaceCreateInput, PlaceUpdateInput, PlaceWithStats, PrismaPlaceWithCounts } from '@/types/entities/place/base';
import type { PlaceSearchOptions } from '@/types/entities/place/types';
import type { Prisma } from '@prisma/client';

/**
 * 🗺️ Transforma un objeto Place de Prisma a un objeto PlaceWithStats enriquecido.
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
 * Mapea la entrada de creación de un lugar al formato de Prisma.
 * @param input - Los datos para crear el lugar, incluyendo IDs de relaciones.
 * @returns Datos listos para `prisma.place.create()`.
 */
export function toCreateData(input: PlaceCreateInput): Prisma.PlaceCreateInput {
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
		images: images ? { connect: images.map((id: string) => ({ id })) } : undefined,
		notes: notes ? { connect: notes.map((id: string) => ({ id })) } : undefined,
		tags: tags ? { connect: tags.map((id: string) => ({ id })) } : undefined,
		characters: characters ? { connect: characters.map((id: string) => ({ id })) } : undefined,
		collections: collections ? { connect: collections.map((id: string) => ({ id })) } : undefined,
		concepts: concepts ? { connect: concepts.map((id: string) => ({ id })) } : undefined,
		prompts: promptIds ? { connect: promptIds.map((id) => ({ id })) } : undefined,
		wildcards: wildcardIds ? { connect: wildcardIds.map((id) => ({ id })) } : undefined,
		properties: propertyIds ? { connect: propertyIds.map((id) => ({ id })) } : undefined,
		groups: groupIds ? { connect: groupIds.map((id) => ({ id })) } : undefined,
	};
}

/**
 * Mapea la entrada de actualización de un lugar al formato de Prisma.
 * @param input - Los datos para actualizar el lugar. Puede ser parcial.
 * @returns Datos listos para `prisma.place.update()`.
 */
export function toUpdateData(input: PlaceUpdateInput): Prisma.PlaceUpdateInput {
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

	const data: Prisma.PlaceUpdateInput = { ...rest };

	if (input.dangers !== undefined) data.dangers = JSON.stringify(input.dangers);
	if (input.resources !== undefined) data.resources = JSON.stringify(input.resources);
	if (input.stats !== undefined) data.stats = JSON.stringify(input.stats);
	if (input.filters !== undefined) data.filters = JSON.stringify(input.filters);

	if (images !== undefined) data.images = { set: images?.map((id: string) => ({ id })) ?? [] };
	if (notes !== undefined) data.notes = { set: notes?.map((id: string) => ({ id })) ?? [] };
	if (tags !== undefined) data.tags = { set: tags?.map((id: string) => ({ id })) ?? [] };
	if (characters !== undefined) data.characters = { set: characters?.map((id: string) => ({ id })) ?? [] };
	if (collections !== undefined) data.collections = { set: collections?.map((id: string) => ({ id })) ?? [] };
	if (concepts !== undefined) data.concepts = { set: concepts?.map((id: string) => ({ id })) ?? [] };
	if (promptIds !== undefined) data.prompts = { set: promptIds?.map((id) => ({ id })) ?? [] };
	if (wildcardIds !== undefined) data.wildcards = { set: wildcardIds?.map((id) => ({ id })) ?? [] };
	if (propertyIds !== undefined) data.properties = { set: propertyIds?.map((id) => ({ id })) ?? [] };
	if (groupIds !== undefined) data.groups = { set: groupIds?.map((id) => ({ id })) ?? [] };

	return data;
}

/**
 * Crea la cláusula `orderBy` para las consultas de Prisma.
 * @param options - Opciones de búsqueda que contienen el `orderBy`.
 * @returns El objeto `orderBy` para Prisma.
 */
export function createOrderBy(options: PlaceSearchOptions = {}): Prisma.PlaceOrderByWithRelationInput | undefined {
	if (options.orderBy) {
		return options.orderBy as Prisma.PlaceOrderByWithRelationInput;
	}
	return { updatedAt: 'desc' };
}

/**
 * Crea la cláusula `where` para las consultas de Prisma a partir de los filtros.
 * @param filters - Los filtros de búsqueda de la aplicación.
 * @returns El objeto `where` para Prisma.
 */
export function createFilter(filters: PlaceSearchOptions['filters'] = {}): Prisma.PlaceWhereInput {
	const where: Prisma.PlaceWhereInput = {};

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

	if (filters?.tags && filters.tags.length > 0) {
		where.tags = { some: { id: { in: filters.tags } } };
	}
	if (filters?.characters && filters.characters.length > 0) {
		where.characters = { some: { id: { in: filters.characters } } };
	}

	return where;
}

/**
 * Mapea las opciones de búsqueda de la aplicación a los argumentos de `findMany` de Prisma.
 * @param options - Opciones de búsqueda de la aplicación.
 * @returns Argumentos para `prisma.place.findMany()`.
 */
export function toSearchOptions(options: PlaceSearchOptions = {}): Prisma.PlaceFindManyArgs {
	return {
		where: createFilter(options.filters),
		orderBy: createOrderBy(options),
		skip: options.skip,
		take: options.take,
		include: {
			_count: {
				select: {
					images: true,
					notes: true,
					tags: true,
					characters: true,
					collections: true,
					concepts: true,
				},
			},
		},
	};
}
