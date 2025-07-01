/**
 * @file Funciones para mapear datos de la entidad Concept a formatos de Prisma.
 * @module transformers/concept/mappers
 * @description Estas funciones se encargan de transformar la entrada de la aplicación
 * (ej. desde formularios o actions) a los tipos que Prisma espera para las operaciones de BD.
 */

import type { ConceptCreateInput, ConceptSearchOptions, ConceptUpdateInput } from '@/types/entities/concept';
import type { Prisma } from '@prisma/client';

/**
 * Mapea la entrada de creación de un concepto al formato de Prisma.
 * @param input - Los datos para crear el concepto, incluyendo IDs de relaciones.
 * @returns Datos listos para `prisma.concept.create()`.
 */
export function toCreateData(input: ConceptCreateInput): Prisma.ConceptCreateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		placeIds,
		worldItemIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input;

	return {
		...rest,
		emoji: input.emoji || '💡',
		color: input.color || '#3b82f6',
		category: input.category || 'general',
		images: imageIds ? { connect: imageIds.map((id) => ({ id })) } : undefined,
		videos: videoIds ? { connect: videoIds.map((id) => ({ id })) } : undefined,
		albums: albumIds ? { connect: albumIds.map((id) => ({ id })) } : undefined,
		collections: collectionIds ? { connect: collectionIds.map((id) => ({ id })) } : undefined,
		tagEntities: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
		characters: characterIds ? { connect: characterIds.map((id) => ({ id })) } : undefined,
		places: placeIds ? { connect: placeIds.map((id) => ({ id })) } : undefined,
		worldItems: worldItemIds ? { connect: worldItemIds.map((id) => ({ id })) } : undefined,
		prompts: promptIds ? { connect: promptIds.map((id) => ({ id })) } : undefined,
		notes: noteIds ? { connect: noteIds.map((id) => ({ id })) } : undefined,
		wildcards: wildcardIds ? { connect: wildcardIds.map((id) => ({ id })) } : undefined,
		properties: propertyIds ? { connect: propertyIds.map((id) => ({ id })) } : undefined,
		groups: groupIds ? { connect: groupIds.map((id) => ({ id })) } : undefined,
	};
}

/**
 * Mapea la entrada de actualización de un concepto al formato de Prisma.
 * @param input - Los datos para actualizar el concepto. Puede ser parcial.
 * @returns Datos listos para `prisma.concept.update()`.
 */
export function toUpdateData(input: ConceptUpdateInput): Prisma.ConceptUpdateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		placeIds,
		worldItemIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input;

	const data: Prisma.ConceptUpdateInput = { ...rest };

	if (imageIds !== undefined) data.images = { set: imageIds?.map((id) => ({ id })) ?? [] };
	if (videoIds !== undefined) data.videos = { set: videoIds?.map((id) => ({ id })) ?? [] };
	if (albumIds !== undefined) data.albums = { set: albumIds?.map((id) => ({ id })) ?? [] };
	if (collectionIds !== undefined) data.collections = { set: collectionIds?.map((id) => ({ id })) ?? [] };
	if (tagIds !== undefined) data.tagEntities = { set: tagIds?.map((id) => ({ id })) ?? [] };
	if (characterIds !== undefined) data.characters = { set: characterIds?.map((id) => ({ id })) ?? [] };
	if (placeIds !== undefined) data.places = { set: placeIds?.map((id) => ({ id })) ?? [] };
	if (worldItemIds !== undefined) data.worldItems = { set: worldItemIds?.map((id) => ({ id })) ?? [] };
	if (promptIds !== undefined) data.prompts = { set: promptIds?.map((id) => ({ id })) ?? [] };
	if (noteIds !== undefined) data.notes = { set: noteIds?.map((id) => ({ id })) ?? [] };
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
export function createOrderBy(options: ConceptSearchOptions = {}): Prisma.ConceptOrderByWithRelationInput | undefined {
	if (options.orderBy) {
		return options.orderBy as Prisma.ConceptOrderByWithRelationInput;
	}
	return { updatedAt: 'desc' };
}

/**
 * Crea la cláusula `where` para las consultas de Prisma a partir de los filtros.
 * @param filters - Los filtros de búsqueda de la aplicación.
 * @returns El objeto `where` para Prisma.
 */
export function createFilter(filters: ConceptSearchOptions['filters'] = {}): Prisma.ConceptWhereInput {
	const conditions: Prisma.ConceptWhereInput[] = [];

	if (filters?.search) {
		const search = filters.search.trim();
		conditions.push({
			OR: [
				{ name: { contains: search } },
				{ description: { contains: search } },
				{ content: { contains: search } },
			],
		});
	}

	if (filters?.category) {
		const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
		conditions.push({ category: { in: categories } });
	}

	if (filters?.onlyFavorites) {
		conditions.push({ isFavorite: true });
	}

	if (filters?.tags && filters.tags.length > 0) {
		conditions.push({ tagEntities: { some: { id: { in: filters.tags } } } });
	}

	return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Mapea las opciones de búsqueda de la aplicación a los argumentos de `findMany` de Prisma.
 * @param options - Opciones de búsqueda de la aplicación.
 * @returns Argumentos para `prisma.concept.findMany()`.
 */
export function toSearchOptions(options: ConceptSearchOptions = {}): Prisma.ConceptFindManyArgs {
	return {
		where: createFilter(options.filters),
		orderBy: createOrderBy(options),
		skip: options.skip,
		take: options.take,
		include: options.includeRelations ? { _count: true } : undefined,
	};
}
