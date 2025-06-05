/**
 * @file Mappers para la entidad WorldItem
 * @module entities/world-item/mappers
 */

import { logger } from '@/lib/logger';
import type { CreateWorldItemData, UpdateWorldItemData, WorldItemFilters } from '@/types/entities/world-item/types';
import type { Prisma } from '@prisma/client';

/**
 * Mapea los datos de creación de un objeto del mundo al formato de Prisma
 */
export function mapCreateWorldItemDataToPrisma(data: CreateWorldItemData): Prisma.WorldItemCreateInput {
	try {
		const {
			name,
			description,
			emoji,
			color,
			type,
			rarity,
			size,
			category,
			shortcut,
			isFavorite,
			origin,
			attributes,
			effects,
			requirements,
			stats,
			properties,
			sortBy,
			filters,
			featuredImage,
		} = data;

		const prismaData: Prisma.WorldItemCreateInput = {
			name,
			description: description ?? null,
			emoji: emoji ?? '🔮',
			color: color ?? '#6D28D9',
			type: type ?? 'item',
			rarity: rarity ?? 'common',
			size: size ?? 'medium',
			category: category ?? null,
			shortcut: shortcut ?? null,
			isFavorite: isFavorite ?? false,
			origin: origin ?? 'unknown',
			attributes: attributes ?? '{}',
			effects: effects ?? '{}',
			requirements: requirements ?? '{}',
			stats: stats ?? '{}',
			properties: properties ?? '{}',
			sortBy: sortBy ?? 'name:asc',
			filters: filters ?? '{}',
			featuredImage: featuredImage ?? null,
		};

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de objeto del mundo:', error);
		throw error;
	}
}

/**
 * Mapea los datos de actualización de un objeto del mundo al formato de Prisma
 */
export function mapUpdateWorldItemDataToPrisma(data: UpdateWorldItemData): Prisma.WorldItemUpdateInput {
	try {
		const {
			name,
			description,
			emoji,
			color,
			type,
			rarity,
			size,
			category,
			shortcut,
			isFavorite,
			origin,
			attributes,
			effects,
			requirements,
			stats,
			properties,
			sortBy,
			filters,
			featuredImage,
		} = data;

		const prismaData: Prisma.WorldItemUpdateInput = {};

		// Solo incluir campos que están presentes
		if (name !== undefined) prismaData.name = name;
		if (description !== undefined) prismaData.description = description;
		if (emoji !== undefined) prismaData.emoji = emoji;
		if (color !== undefined) prismaData.color = color;
		if (type !== undefined) prismaData.type = type;
		if (rarity !== undefined) prismaData.rarity = rarity;
		if (size !== undefined) prismaData.size = size;
		if (category !== undefined) prismaData.category = category;
		if (shortcut !== undefined) prismaData.shortcut = shortcut;
		if (isFavorite !== undefined) prismaData.isFavorite = isFavorite;
		if (origin !== undefined) prismaData.origin = origin;
		if (attributes !== undefined) prismaData.attributes = attributes;
		if (effects !== undefined) prismaData.effects = effects;
		if (requirements !== undefined) prismaData.requirements = requirements;
		if (stats !== undefined) prismaData.stats = stats;
		if (properties !== undefined) prismaData.properties = properties;
		if (sortBy !== undefined) prismaData.sortBy = sortBy;
		if (filters !== undefined) prismaData.filters = filters;
		if (featuredImage !== undefined) prismaData.featuredImage = featuredImage;

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de objeto del mundo:', error);
		throw error;
	}
}

/**
 * Mapea los filtros de objeto del mundo al formato de Prisma
 */
export function mapWorldItemFiltersToPrisma(filters?: WorldItemFilters): Prisma.WorldItemWhereInput {
	if (!filters) return {};

	const prismaFilters: Prisma.WorldItemWhereInput = {};
	const {
		query,
		types,
		categories,
		rarities,
		minLevel,
		maxLevel,
		minValue,
		maxValue,
		isFavorite,
		hasImages,
		hasFiles,
	} = filters;

	if (query) {
		prismaFilters.OR = [
			{ name: { contains: query, mode: 'insensitive' } },
			{ description: { contains: query, mode: 'insensitive' } },
			{ attributes: { contains: query, mode: 'insensitive' } },
			{ effects: { contains: query, mode: 'insensitive' } },
		];
	}

	if (types?.length) {
		prismaFilters.type = { in: types };
	}

	if (categories?.length) {
		prismaFilters.category = { in: categories };
	}

	if (rarities?.length) {
		prismaFilters.rarity = { in: rarities };
	}

	if (isFavorite !== undefined) {
		prismaFilters.isFavorite = isFavorite;
	}

	if (hasImages) {
		prismaFilters.images = { some: {} };
	}

	// Nota: minLevel, maxLevel, minValue, maxValue y hasFiles requieren una implementación
	// más compleja que depende de la estructura específica de los datos

	return prismaFilters;
}

/**
 * Mapea las opciones de búsqueda de objetos del mundo al formato de Prisma
 */
export function mapWorldItemSearchOptionsToPrisma(options: {
	take?: number;
	skip?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: WorldItemFilters;
	include?: Record<string, boolean>;
}): Prisma.WorldItemFindManyArgs {
	try {
		const { take = 10, skip = 0, orderBy = { name: 'asc' }, filters, include } = options;

		const prismaOptions: Prisma.WorldItemFindManyArgs = {
			take,
			skip,
			orderBy,
			where: mapWorldItemFiltersToPrisma(filters),
			include: {
				_count: true,
				...(include?.images && { images: true }),
				...(include?.videos && { videos: true }),
				...(include?.albums && { albums: true }),
				...(include?.collections && { collections: true }),
				...(include?.tags && { tags: true }),
				...(include?.characters && { characters: true }),
				...(include?.places && { places: true }),
				...(include?.concepts && { concepts: true }),
				...(include?.prompts && { prompts: true }),
				...(include?.notes && { notes: true }),
				...(include?.wildcards && { wildcards: true }),
				...(include?.properties && { properties: true }),
				...(include?.groups && { groups: true }),
			},
		};

		return prismaOptions;
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de objetos del mundo:', error);
		throw error;
	}
}
