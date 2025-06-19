/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

import type { Prisma } from '@prisma/client';
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
 * 🔄 Mapea un `CollectionCreateInput` a un `Prisma.CollectionCreateInput`.
 */
export function mapCreateCollectionDataToPrisma(input: CollectionCreateInput): Prisma.CollectionCreateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = input;

		return {
			...rest,
			images: imageIds ? { connect: imageIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { connect: tagIds.map((id) => ({ id })) } : undefined,
			groups: groupIds ? { connect: groupIds.map((id) => ({ id })) } : undefined,
			properties: propertyIds ? { connect: propertyIds.map((id) => ({ id })) } : undefined,
			wildcards: wildcardIds ? { connect: wildcardIds.map((id) => ({ id })) } : undefined,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de colección', { error, input });
		throw new TransformerError('Error al mapear datos de creación de colección.');
	}
}

/**
 * 🔄 Mapea un `CollectionUpdateInput` a un `Prisma.CollectionUpdateInput`.
 */
export function mapUpdateCollectionDataToPrisma(input: CollectionUpdateInput): Prisma.CollectionUpdateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = input;

		return {
			...rest,
			images: imageIds ? { set: imageIds.map((id) => ({ id })) } : undefined,
			tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
			groups: groupIds ? { set: groupIds.map((id) => ({ id })) } : undefined,
			properties: propertyIds ? { set: propertyIds.map((id) => ({ id })) } : undefined,
			wildcards: wildcardIds ? { set: wildcardIds.map((id) => ({ id })) } : undefined,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización de colección', { error, input });
		throw new TransformerError('Error al mapear datos de actualización de colección.');
	}
}

/**
 * 🔄 Mapea `CollectionSearchOptions` a `Prisma.CollectionFindManyArgs`.
 */
export function mapCollectionSearchOptionsToPrisma(options: CollectionSearchOptions): Prisma.CollectionFindManyArgs {
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
 * 🔄 Mapea `CollectionFilters` a `Prisma.CollectionWhereInput`.
 */
function mapCollectionFiltersToPrisma(filters: CollectionFilters): Prisma.CollectionWhereInput {
	const where: Prisma.CollectionWhereInput = {};

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
