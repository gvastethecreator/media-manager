/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    WorldItemCreateInput,
    WorldItemFilters,
    WorldItemSearchOptions,
    WorldItemUpdateInput
} from '@/types/entities/world-item';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import {
    serializeAttributes,
    serializeEffects,
    serializeFilters,
    serializeProperties,
    serializeRequirements,
    serializeStats,
    serializeTags,
} from './serializers';

// Logger específico para este módulo
const logger = serverLogger.withContext('WorldItemMappers');

const relationMap: Record<string, string> = {
    imageIds: 'images',
    videoIds: 'videos',
    albumIds: 'albums',
    collectionIds: 'collections',
    tagIds: 'tags',
    characterIds: 'characters',
    placeIds: 'places',
    conceptIds: 'concepts',
    promptIds: 'prompts',
    noteIds: 'notes',
    wildcardIds: 'wildcards',
    propertyIds: 'properties',
    groupIds: 'groups',
};

function connectRelations(input: Partial<WorldItemCreateInput>, operation: 'connect' | 'set'): Prisma.WorldItemUpdateInput['images'] {
    const relations: any = {};
    for (const key in relationMap) {
        if (key in input && Array.isArray((input as any)[key])) {
            const prismaKey = relationMap[key];
            const ids = (input as any)[key];
            if (ids.length > 0) {
                relations[prismaKey] = { [operation]: ids.map((id: string) => ({ id })) };
            } else {
                relations[prismaKey] = { [operation]: [] };
            }
        }
    }
    return relations;
}

/**
 * �� Mapea un WorldItemCreateInput a un Prisma.WorldItemCreateInput.
 */
export function mapCreateWorldItemDataToPrisma(input: WorldItemCreateInput): Prisma.WorldItemCreateInput {
	try {
		const {
			attributes, effects, requirements, stats, properties, filters, tags,
			...rest
		} = input;

		const baseData = rest as Omit<WorldItemCreateInput, 'attributes' | 'effects' | 'requirements' | 'stats' | 'properties' | 'filters' | 'tags' | keyof ReturnType<typeof connectRelations>>;

		const prismaData: Prisma.WorldItemCreateInput = {
			...baseData,
			attributes: serializeAttributes(attributes || []),
			effects: serializeEffects(effects || []),
			requirements: serializeRequirements(requirements || []),
			stats: serializeStats(stats || []),
			properties: serializeProperties(properties || []),
			filters: serializeFilters(filters || []),
			tags: serializeTags(tags || []),
            ...connectRelations(input, 'connect'),
		};

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de WorldItem', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para crear el WorldItem.');
	}
}

/**
 * 🔄 Mapea un WorldItemUpdateInput a un Prisma.WorldItemUpdateInput.
 */
export function mapUpdateWorldItemDataToPrisma(input: WorldItemUpdateInput): Prisma.WorldItemUpdateInput {
	try {
        const {
			attributes, effects, requirements, stats, properties, filters, tags,
			...rest
		} = input;

        const baseData = rest as Omit<WorldItemUpdateInput, 'attributes' | 'effects' | 'requirements' | 'stats' | 'properties' | 'filters' | 'tags' | keyof ReturnType<typeof connectRelations>>;

		const prismaData: Prisma.WorldItemUpdateInput = { ...baseData };

		if (attributes) prismaData.attributes = serializeAttributes(attributes);
		if (effects) prismaData.effects = serializeEffects(effects);
		if (requirements) prismaData.requirements = serializeRequirements(requirements);
		if (stats) prismaData.stats = serializeStats(stats);
		if (properties) prismaData.properties = serializeProperties(properties);
		if (filters) prismaData.filters = serializeFilters(filters);
		if (tags) prismaData.tags = serializeTags(tags);

        Object.assign(prismaData, connectRelations(input, 'set'));

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de WorldItem', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para actualizar el WorldItem.');
	}
}

/**
 * 🔄 Mapea `WorldItemSearchOptions` a `Prisma.WorldItemFindManyArgs`.
 */
export function mapWorldItemSearchOptionsToPrisma(options: WorldItemSearchOptions): Prisma.WorldItemFindManyArgs {
	const { filters, ...rest } = options;
	const orderBy = mapSortByToPrisma(options.sortBy);
	return {
		...rest,
		where: filters ? mapWorldItemFiltersToPrisma(filters) : undefined,
		orderBy,
	};
}

function mapWorldItemFiltersToPrisma(filters: WorldItemFilters): Prisma.WorldItemWhereInput {
	const where: Prisma.WorldItemWhereInput = {};
	if (filters.query) {
		where.OR = [
			{ name: { contains: filters.query, mode: 'insensitive' } },
			{ description: { contains: filters.query, mode: 'insensitive' } },
		];
	}
	if (filters.type?.length) where.type = { in: filters.type };
	if (filters.category?.length) where.category = { in: filters.category };
	if (filters.rarity?.length) where.rarity = { in: filters.rarity };
	if (filters.isFavorite !== undefined) where.isFavorite = filters.isFavorite;
	if (filters.hasImage !== undefined) {
		where.images = filters.hasImage ? { some: {} } : { none: {} };
	}
	return where;
}

function mapSortByToPrisma(sortBy?: string): Prisma.WorldItemOrderByWithRelationInput {
	if (!sortBy) return { updatedAt: 'desc' };

	const [field, order = 'desc'] = sortBy.split(':');
	const validOrders = ['asc', 'desc'];
	const sortOrder = validOrders.includes(order) ? order : 'desc';

	// Mapear campos de UI a campos de Prisma si es necesario
	const fieldMap: Record<string, string> = {
		name: 'name',
		updatedAt: 'updatedAt',
		createdAt: 'createdAt',
		rarity: 'rarity',
	};

	const prismaField = fieldMap[field] || 'updatedAt';

	return { [prismaField]: sortOrder };
}
