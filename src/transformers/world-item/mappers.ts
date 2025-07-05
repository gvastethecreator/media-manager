/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
	WorldItemComplete,
	WorldItemCreateInput,
	WorldItemFilters,
	WorldItemSearchOptions,
	WorldItemStatistics,
	WorldItemUpdateInput,
	WorldItemWithStats,
} from '@/types/entities/world-item';
import {
	serializeAttributes,
	serializeEffects,
	serializeFilters,
	serializeProperties,
	serializeRequirements,
	serializeStats,
	serializeTags,
} from './serializers';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleWorldItemCreateInput = {
	name: string;
	description?: string | null;
	type: string;
	category: string;
	rarity: string;
	value?: number | null;
	weight?: number | null;
	featuredImage?: string | null;
	attributes: string;
	effects: string;
	requirements: string;
	stats: string;
	properties: string;
	filters: string;
	tags: string;
	isFavorite?: boolean;
	// Las relaciones se manejan por separado en Drizzle
};

type DrizzleWorldItemUpdateInput = Partial<DrizzleWorldItemCreateInput>;

type DrizzleWorldItemWhereInput = {
	OR?: Array<{ name?: { contains?: string }; description?: { contains?: string } }>;
	type?: { in?: string[] };
	category?: { in?: string[] };
	rarity?: { in?: string[] };
	isFavorite?: boolean;
	images?: { some?: {} } | { none?: {} };
};

type DrizzleWorldItemFindManyArgs = {
	where?: DrizzleWorldItemWhereInput;
	orderBy?: { [key: string]: 'asc' | 'desc' };
	take?: number;
	skip?: number;
};

type DrizzleWorldItemOrderByInput = {
	[key: string]: 'asc' | 'desc';
};

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

function connectRelations(input: Partial<WorldItemCreateInput>, operation: 'connect' | 'set'): Record<string, any> {
	const relations: any = {};
	for (const key in relationMap) {
		if (key in input && Array.isArray((input as any)[key])) {
			const prismaKey = relationMap[key];
			const ids = (input as any)[key];
			if (ids.length > 0) {
				// En Drizzle, las relaciones se manejan de forma diferente
				// Esto se maneja en el servicio, no en el mapper
				relations[`${prismaKey}Ids`] = ids;
			}
		}
	}
	return relations;
}

/**
 * 🗺️ Mapea un WorldItemCreateInput a un Drizzle WorldItemCreateInput.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateWorldItemDataToDrizzle(input: WorldItemCreateInput): DrizzleWorldItemCreateInput {
	try {
		const { attributes, effects, requirements, stats, properties, filters, tags, ...rest } = input;

		const baseData = rest as Omit<
			WorldItemCreateInput,
			| 'attributes'
			| 'effects'
			| 'requirements'
			| 'stats'
			| 'properties'
			| 'filters'
			| 'tags'
			| keyof ReturnType<typeof connectRelations>
		>;

		const drizzleData: DrizzleWorldItemCreateInput = {
			...baseData,
			name: baseData.name || 'Nuevo Item',
			type: baseData.type || 'item',
			category: baseData.category || 'misc',
			rarity: baseData.rarity || 'common',
			attributes: serializeAttributes(attributes || []),
			effects: serializeEffects(effects || []),
			requirements: serializeRequirements(requirements || []),
			stats: serializeStats(stats || []),
			properties: serializeProperties(properties || []),
			filters: serializeFilters(filters || []),
			tags: serializeTags(tags || []),
			// Las relaciones se manejan por separado en Drizzle
		};

		return drizzleData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de WorldItem', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para crear el WorldItem.');
	}
}

/**
 * 🔄 Mapea un WorldItemUpdateInput a un Drizzle WorldItemUpdateInput.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateWorldItemDataToDrizzle(input: WorldItemUpdateInput): DrizzleWorldItemUpdateInput {
	try {
		const { attributes, effects, requirements, stats, properties, filters, tags, ...rest } = input;

		const baseData = rest as Omit<
			WorldItemUpdateInput,
			| 'attributes'
			| 'effects'
			| 'requirements'
			| 'stats'
			| 'properties'
			| 'filters'
			| 'tags'
			| keyof ReturnType<typeof connectRelations>
		>;

		const drizzleData: DrizzleWorldItemUpdateInput = { ...baseData };

		if (attributes) drizzleData.attributes = serializeAttributes(attributes);
		if (effects) drizzleData.effects = serializeEffects(effects);
		if (requirements) drizzleData.requirements = serializeRequirements(requirements);
		if (stats) drizzleData.stats = serializeStats(stats);
		if (properties) drizzleData.properties = serializeProperties(properties);
		if (filters) drizzleData.filters = serializeFilters(filters);
		if (tags) drizzleData.tags = serializeTags(tags);

		// Las relaciones se manejan por separado en Drizzle
		// Object.assign(drizzleData, connectRelations(input, 'set'));

		return drizzleData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de WorldItem', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para actualizar el WorldItem.');
	}
}

/**
 * 🔄 Mapea `WorldItemSearchOptions` a `Drizzle WorldItemFindManyArgs`.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapWorldItemSearchOptionsToDrizzle(options: WorldItemSearchOptions): DrizzleWorldItemFindManyArgs {
	const { filters, ...rest } = options;
	const orderBy = mapSortByToDrizzle(options.sortBy);
	return {
		...rest,
		where: filters ? mapWorldItemFiltersToDrizzle(filters) : undefined,
		orderBy,
	};
}

function mapWorldItemFiltersToDrizzle(filters: WorldItemFilters): DrizzleWorldItemWhereInput {
	const where: DrizzleWorldItemWhereInput = {};
	if (filters.query) {
		where.OR = [{ name: { contains: filters.query } }, { description: { contains: filters.query } }];
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

function mapSortByToDrizzle(sortBy?: string): DrizzleWorldItemOrderByInput {
	if (!sortBy) return { updatedAt: 'desc' };

	const [field, order = 'desc'] = sortBy.split(':');
	const validOrders = ['asc', 'desc'];
	const sortOrder = validOrders.includes(order) ? order : 'desc';

	// Mapear campos de UI a campos de Drizzle si es necesario
	const fieldMap: Record<string, string> = {
		name: 'name',
		updatedAt: 'updatedAt',
		createdAt: 'createdAt',
		rarity: 'rarity',
	};

	const drizzleField = fieldMap[field] || 'updatedAt';

	return { [drizzleField]: sortOrder };
}

/**
 * 📊 Enriquece un WorldItem con sus estadísticas siguiendo el patrón EntityWithStats
 * ✅ MIGRADO A DRIZZLE
 * @param worldItem El WorldItem completo a enriquecer
 * @returns El WorldItem con estadísticas calculadas
 */
export function toWorldItemWithStats(worldItem: WorldItemComplete): WorldItemWithStats {
	const { _count, ...rest } = worldItem;

	// Calcular puntuación de rareza
	const rarityScores: Record<string, number> = {
		common: 10,
		uncommon: 25,
		rare: 40,
		epic: 60,
		legendary: 80,
		mythic: 90,
		unique: 95,
		artifact: 100,
	};

	// Calcular tier del item basado en rareza
	const getTier = (rarity: string): WorldItemStatistics['itemTier'] => {
		const rarityLower = rarity.toLowerCase();
		if (['mythic', 'artifact'].includes(rarityLower)) return 'artifact';
		if (rarityLower === 'legendary') return 'legendary';
		if (rarityLower === 'epic') return 'epic';
		if (rarityLower === 'rare') return 'rare';
		if (rarityLower === 'uncommon') return 'uncommon';
		return 'common';
	};

	// Deserializar campos JSON si es necesario
	const attributes =
		typeof worldItem.attributes === 'string'
			? (JSON.parse(worldItem.attributes || '[]') as any[])
			: worldItem.attributes || [];

	const effects =
		typeof worldItem.effects === 'string' ? (JSON.parse(worldItem.effects || '[]') as any[]) : worldItem.effects || [];

	const requirements =
		typeof worldItem.requirements === 'string'
			? (JSON.parse(worldItem.requirements || '[]') as any[])
			: worldItem.requirements || [];

	const statsData =
		typeof worldItem.stats === 'string' ? (JSON.parse(worldItem.stats || '[]') as any[]) : worldItem.stats || [];

	// Calcular métricas temporales
	const now = new Date();
	const createdAt = new Date(worldItem.createdAt);
	const updatedAt = new Date(worldItem.updatedAt);
	const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
	const daysSinceLastUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

	// Calcular poder basado en stats, efectos y rareza
	const powerLevel = Math.round(
		statsData.length * 10 +
			effects.length * 15 +
			(rarityScores[worldItem.rarity?.toLowerCase() || 'common'] || 10) +
			(worldItem.isFavorite ? 5 : 0)
	);

	// Calcular completitud
	const completenessScore = Math.round(
		(worldItem.description ? 20 : 0) +
			(attributes.length > 0 ? 20 : 0) +
			(effects.length > 0 ? 20 : 0) +
			(requirements.length > 0 ? 10 : 0) +
			(statsData.length > 0 ? 15 : 0) +
			(worldItem.featuredImage ? 15 : 0)
	);

	// Calcular popularidad basada en relaciones
	const totalRelations =
		(_count?.images || 0) +
		(_count?.videos || 0) +
		(_count?.characters || 0) +
		(_count?.places || 0) +
		(_count?.notes || 0) +
		(_count?.concepts || 0);

	const popularityScore = Math.min(
		100,
		Math.round(totalRelations * 2 + (worldItem.isFavorite ? 20 : 0) + (daysSinceLastUpdate < 7 ? 10 : 0))
	);

	const stats: WorldItemStatistics = {
		// Conteos de relaciones
		imageCount: _count?.images || 0,
		videoCount: _count?.videos || 0,
		albumCount: _count?.albums || 0,
		collectionCount: _count?.collections || 0,
		tagCount: _count?.tags || 0,
		characterCount: _count?.characters || 0,
		placeCount: _count?.places || 0,
		conceptCount: _count?.concepts || 0,
		promptCount: _count?.prompts || 0,
		noteCount: _count?.notes || 0,
		wildcardCount: _count?.wildcards || 0,
		propertyCount: _count?.properties || 0,
		groupCount: _count?.groups || 0,

		// Métricas RPG
		powerLevel,
		rarityScore: rarityScores[worldItem.rarity?.toLowerCase() || 'common'] || 10,
		completenessScore,
		popularityScore,

		// Análisis de contenido
		hasDescription: !!worldItem.description,
		hasAttributes: attributes.length > 0,
		hasEffects: effects.length > 0,
		hasRequirements: requirements.length > 0,
		hasStats: statsData.length > 0,
		mediaRichness: (_count?.images || 0) + (_count?.videos || 0),

		// Análisis temporal
		createdThisMonth: daysSinceCreation <= 30,
		updatedThisWeek: daysSinceLastUpdate <= 7,
		daysSinceCreation,
		daysSinceLastUpdate,

		// Metadatos RPG
		totalAttributes: attributes.length,
		totalEffects: effects.length,
		totalRequirements: requirements.length,
		totalStats: statsData.length,
		itemTier: getTier(worldItem.rarity || 'common'),
	};

	return {
		...rest,
		_stats: stats,
	};
}

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapCreateWorldItemDataToDrizzle
 */
export const mapCreateWorldItemDataToPrisma = mapCreateWorldItemDataToDrizzle;

/**
 * @deprecated Usar mapUpdateWorldItemDataToDrizzle
 */
export const mapUpdateWorldItemDataToPrisma = mapUpdateWorldItemDataToDrizzle;

/**
 * @deprecated Usar mapWorldItemSearchOptionsToDrizzle
 */
export const mapWorldItemSearchOptionsToPrisma = mapWorldItemSearchOptionsToDrizzle;
