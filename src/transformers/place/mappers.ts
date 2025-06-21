/**
 * @file Funciones para mapear datos de la entidad Place a formatos de Prisma.
 * @module transformers/place/mappers
 * @description Estas funciones se encargan de transformar la entrada de la aplicación
 * (ej. desde formularios o actions) a los tipos que Prisma espera para las operaciones de BD.
 */

import type { PlaceCreateInput, PlaceSearchOptions, PlaceUpdateInput } from '@/types/entities/place';
import type { Prisma } from '@prisma/client';

/**
 * Mapea la entrada de creación de un lugar al formato de Prisma.
 * @param input - Los datos para crear el lugar, incluyendo IDs de relaciones.
 * @returns Datos listos para `prisma.place.create()`.
 */
export function toCreateData(input: PlaceCreateInput): Prisma.PlaceCreateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		worldItemIds,
		conceptIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		dangers,
		resources,
		stats,
		filters,
		...rest
	} = input;

	return {
		...rest,
		dangers: JSON.stringify(dangers || []),
		resources: JSON.stringify(resources || []),
		stats: stats ? JSON.stringify(stats) : '{}',
		filters: filters ? JSON.stringify(filters) : '{}',
		images: imageIds ? { connect: imageIds.map(id => ({ id })) } : undefined,
		videos: videoIds ? { connect: videoIds.map(id => ({ id })) } : undefined,
		albums: albumIds ? { connect: albumIds.map(id => ({ id })) } : undefined,
		collections: collectionIds ? { connect: collectionIds.map(id => ({ id })) } : undefined,
		tags: tagIds ? { connect: tagIds.map(id => ({ id })) } : undefined,
		characters: characterIds ? { connect: characterIds.map(id => ({ id })) } : undefined,
		worldItems: worldItemIds ? { connect: worldItemIds.map(id => ({ id })) } : undefined,
		concepts: conceptIds ? { connect: conceptIds.map(id => ({ id })) } : undefined,
		prompts: promptIds ? { connect: promptIds.map(id => ({ id })) } : undefined,
		notes: noteIds ? { connect: noteIds.map(id => ({ id })) } : undefined,
		wildcards: wildcardIds ? { connect: wildcardIds.map(id => ({ id })) } : undefined,
		properties: propertyIds ? { connect: propertyIds.map(id => ({ id })) } : undefined,
		groups: groupIds ? { connect: groupIds.map(id => ({ id })) } : undefined,
	};
}

/**
 * Mapea la entrada de actualización de un lugar al formato de Prisma.
 * @param input - Los datos para actualizar el lugar. Puede ser parcial.
 * @returns Datos listos para `prisma.place.update()`.
 */
export function toUpdateData(input: PlaceUpdateInput): Prisma.PlaceUpdateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		worldItemIds,
		conceptIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		dangers,
		resources,
		stats,
		filters,
		...rest
	} = input;

	const data: Prisma.PlaceUpdateInput = { ...rest };

	if (dangers !== undefined) data.dangers = JSON.stringify(dangers);
	if (resources !== undefined) data.resources = JSON.stringify(resources);
	if (stats !== undefined) data.stats = JSON.stringify(stats);
	if (filters !== undefined) data.filters = JSON.stringify(filters);

	if (imageIds !== undefined) data.images = { set: imageIds?.map(id => ({ id })) ?? [] };
	if (videoIds !== undefined) data.videos = { set: videoIds?.map(id => ({ id })) ?? [] };
	if (albumIds !== undefined) data.albums = { set: albumIds?.map(id => ({ id })) ?? [] };
	if (collectionIds !== undefined) data.collections = { set: collectionIds?.map(id => ({ id })) ?? [] };
	if (tagIds !== undefined) data.tags = { set: tagIds?.map(id => ({ id })) ?? [] };
	if (characterIds !== undefined) data.characters = { set: characterIds?.map(id => ({ id })) ?? [] };
	if (worldItemIds !== undefined) data.worldItems = { set: worldItemIds?.map(id => ({ id })) ?? [] };
	if (conceptIds !== undefined) data.concepts = { set: conceptIds?.map(id => ({ id })) ?? [] };
	if (promptIds !== undefined) data.prompts = { set: promptIds?.map(id => ({ id })) ?? [] };
	if (noteIds !== undefined) data.notes = { set: noteIds?.map(id => ({ id })) ?? [] };
	if (wildcardIds !== undefined) data.wildcards = { set: wildcardIds?.map(id => ({ id })) ?? [] };
	if (propertyIds !== undefined) data.properties = { set: propertyIds?.map(id => ({ id })) ?? [] };
	if (groupIds !== undefined) data.groups = { set: groupIds?.map(id => ({ id })) ?? [] };

	return data;
}

/**
 * Crea la cláusula `orderBy` para las consultas de Prisma.
 * @param options - Opciones de búsqueda que contienen el `orderBy`.
 * @returns El objeto `orderBy` para Prisma.
 */
export function createOrderBy(
	options: PlaceSearchOptions = {}
): Prisma.PlaceOrderByWithRelationInput | undefined {
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
			{ name: { contains: search, mode: 'insensitive' } },
			{ description: { contains: search, mode: 'insensitive' } },
			{ lore: { contains: search, mode: 'insensitive' } },
			{ history: { contains: search, mode: 'insensitive' } },
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
		include: options.includeRelations ? { _count: true } : undefined,
	};
}
