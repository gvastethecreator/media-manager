/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

// ⚠️ Evitamos importar tipos de Prisma para mantener el código desacoplado
import { serverLogger } from '@/lib/logger/server-logger';
import type {
	CollectionCreateInput,
	CollectionFilters,
	CollectionSearchOptions,
	CollectionUpdateInput,
} from '@/types/entities/collection';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('CollectionMapper');

/**
 * 🔄 Mapea un `CollectionCreateInput` a un objeto compatible con Prisma.
 */
export function mapCreateCollectionDataToPrisma(input: CollectionCreateInput): Record<string, any> {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = input;

               const prismaData: Record<string, any> = {
                       ...rest,
			images: imageIds ? { connect: imageIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
			groups: groupIds ? { connect: groupIds.map((id) => ({ id })) } : undefined,
			properties: propertyIds ? { connect: propertyIds.map((id) => ({ id })) } : undefined,
			wildcards: wildcardIds ? { connect: wildcardIds.map((id) => ({ id })) } : undefined,
               };

               return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de colección', { error, input });
		throw new TransformerError('Error al mapear datos de creación de colección.');
	}
}

/**
 * 🔄 Mapea un `CollectionUpdateInput` a un objeto compatible con Prisma.
 */
export function mapUpdateCollectionDataToPrisma(input: CollectionUpdateInput): Record<string, any> {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = input;

               const prismaData: Record<string, any> = {
                       ...rest,
			images: imageIds ? { set: imageIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
			groups: groupIds ? { set: groupIds.map((id) => ({ id })) } : undefined,
			properties: propertyIds ? { set: propertyIds.map((id) => ({ id })) } : undefined,
			wildcards: wildcardIds ? { set: wildcardIds.map((id) => ({ id })) } : undefined,
               };

               return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de colección', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de colección.');
	}
}

/**
 * 🔄 Mapea `CollectionSearchOptions` a un objeto de búsqueda compatible con Prisma.
 */
export function mapCollectionSearchOptionsToPrisma(options: CollectionSearchOptions): Record<string, any> {
	const { filters, skip, take, orderBy, include } = options;

	return {
               where: filters ? mapCollectionFiltersToPrisma(filters) : undefined,
               skip,
               take,
               orderBy,
		include: include
			? {
					images: include.images || false,
					tags: include.tags || false,
					groups: include.groups || false,
					properties: include.properties || false,
					wildcards: include.wildcards || false,
				}
			: undefined,
	};
}

/**
 * 🔄 Mapea `CollectionFilters` a un objeto `where` compatible con Prisma.
 */
function mapCollectionFiltersToPrisma(filters: CollectionFilters): Record<string, any> {
       const where: Record<string, any> = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}
	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}
	if (filters.category?.length) {
		where.category = { in: filters.category };
	}
	if (filters.rarity?.length) {
		where.rarity = { in: filters.rarity };
	}
	if (filters.tagIds?.length) {
		where.tags = { some: { id: { in: filters.tagIds } } };
	}
	if (filters.imageCount) {
		where.images = {
			...(where.images || {}),
			...(filters.imageCount.min !== undefined || filters.imageCount.max !== undefined
				? {
						_count: {
							...(filters.imageCount.min !== undefined ? { gte: filters.imageCount.min } : {}),
							...(filters.imageCount.max !== undefined ? { lte: filters.imageCount.max } : {}),
						},
					}
				: {}),
		};
	}
	if (filters.dateRange) {
		if (filters.dateRange.start || filters.dateRange.end) {
			where.createdAt = {
				...(filters.dateRange.start ? { gte: filters.dateRange.start } : {}),
				...(filters.dateRange.end ? { lte: filters.dateRange.end } : {}),
			};
		}
	}

	return where;
}
