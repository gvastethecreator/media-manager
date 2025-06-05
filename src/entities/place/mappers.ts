/**
 * @file Mappers para la entidad Place
 * @module entities/place/mappers
 */

import { logger } from '@/lib/logger';
import type {
	CreatePlaceData,
	PlaceComplete,
	PlaceSearchOptions,
	PlaceWithRelations,
} from '@/types/entities/place/types';
import type { Prisma } from '@prisma/client';
import {
	serializePlaceDangers,
	serializePlaceFilters,
	serializePlaceResources,
	serializePlaceStats,
} from './serializers';

/**
 * 🌍 Mapea datos de creación de lugar a formato Prisma
 */
export function mapCreatePlaceDataToPrisma(data: CreatePlaceData): Prisma.PlaceCreateInput {
	try {
		const createData: Prisma.PlaceCreateInput = {
			name: data.name,
			emoji: data.emoji || '🌍',
			color: data.color || '#808080',
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || null,
			region: data.region,
			type: data.type,
			climate: data.climate,
			population: data.population,
			government: data.government,
			dangers: typeof data.dangers === 'string' ? data.dangers : serializePlaceDangers(data.dangers || null),
			resources: typeof data.resources === 'string' ? data.resources : serializePlaceResources(data.resources || null),
			lore: data.lore,
			history: data.history,
			stats: typeof data.stats === 'string' ? data.stats : serializePlaceStats(data.stats || null),
			sortBy: data.sortBy,
			filters: typeof data.filters === 'string' ? data.filters : serializePlaceFilters(data.filters || null),
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
		};

		// Agregar relaciones si existen
		if (data.groupIds?.length) {
			createData.groups = {
				connect: data.groupIds.map((id) => ({ id })),
			};
		}

		if (data.propertyIds?.length) {
			createData.properties = {
				connect: data.propertyIds.map((id) => ({ id })),
			};
		}

		if (data.wildcardIds?.length) {
			createData.wildcards = {
				connect: data.wildcardIds.map((id) => ({ id })),
			};
		}

		return createData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de lugar:', error);
		throw error;
	}
}

/**
 * 🌍 Mapea datos de actualización de lugar a formato Prisma
 */
export function mapUpdatePlaceDataToPrisma(data: Partial<PlaceComplete>): Prisma.PlaceUpdateInput {
	try {
		const updateData: Prisma.PlaceUpdateInput = {};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.region !== undefined) updateData.region = data.region;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.climate !== undefined) updateData.climate = data.climate;
		if (data.population !== undefined) updateData.population = data.population;
		if (data.government !== undefined) updateData.government = data.government;
		if (data.dangers !== undefined) {
			updateData.dangers = typeof data.dangers === 'string' ? data.dangers : serializePlaceDangers(data.dangers);
		}
		if (data.resources !== undefined) {
			updateData.resources =
				typeof data.resources === 'string' ? data.resources : serializePlaceResources(data.resources);
		}
		if (data.lore !== undefined) updateData.lore = data.lore;
		if (data.history !== undefined) updateData.history = data.history;
		if (data.stats !== undefined) {
			updateData.stats = typeof data.stats === 'string' ? data.stats : serializePlaceStats(data.stats);
		}
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
		if (data.filters !== undefined) {
			updateData.filters = typeof data.filters === 'string' ? data.filters : serializePlaceFilters(data.filters);
		}
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		return updateData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de lugar:', error);
		throw error;
	}
}

/**
 * 🔍 Mapea opciones de búsqueda a formato Prisma
 */
export function mapPlaceSearchOptionsToPrisma(options: PlaceSearchOptions): Prisma.PlaceFindManyArgs {
	try {
		const prismaOptions: Prisma.PlaceFindManyArgs = {
			take: options.take,
			skip: options.skip,
			orderBy: options.orderBy,
			where: options.where,
			include: {
				images: options.include?.images,
				videos: options.include?.videos,
				albums: options.include?.albums,
				collections: options.include?.collections,
				tags: options.include?.tags,
				characters: options.include?.characters,
				worldItems: options.include?.worldItems,
				concepts: options.include?.concepts,
				prompts: options.include?.prompts,
				notes: options.include?.notes,
				wildcards: options.include?.wildcards,
				properties: options.include?.properties,
				groups: options.include?.groups,
				_count: options.include?._count,
			},
		};

		return prismaOptions;
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de lugar:', error);
		throw error;
	}
}

/**
 * 🔗 Mapea un lugar a su versión relacionada
 */
export function mapPlaceToRelatedPlace(place: PlaceWithRelations) {
	try {
		return {
			id: place.id,
			name: place.name,
			emoji: place.emoji,
			color: place.color,
			type: place.type,
			region: place.region,
			population: place.population,
			dangerLevel: place.dangerLevel,
		};
	} catch (error) {
		logger.error('Error mapeando lugar a versión relacionada:', error);
		throw error;
	}
}
