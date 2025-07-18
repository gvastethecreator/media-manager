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
	WorldItemUpdateInput,
	WorldItemWithStats,
} from '@/types/entities/world-item';
import type { WorldItemStatistics } from '@/types/entities/world-item/base';
// Las funciones de serialización ya no se usan en este archivo

// Tipos de datos para Drizzle
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
	images?: { some?: Record<string, never> } | { none?: Record<string, never> };
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

// Las relaciones se manejan directamente en el servicio de Drizzle

/**
 * 🗺️ Mapea un WorldItemCreateInput a un Drizzle WorldItemCreateInput.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateWorldItemDataToDrizzle(input: WorldItemCreateInput): DrizzleWorldItemCreateInput {
	try {
		const drizzleData: DrizzleWorldItemCreateInput = {
			...input,
			name: input.name || 'Nuevo Item',
			type: input.type || 'item',
			category: input.category || 'misc',
			rarity: input.rarity || 'common',
			attributes: input.attributes || '{}',
			effects: input.effects || '{}',
			requirements: input.requirements || '{}',
			stats: '{}', // Campo adicional para Drizzle
			properties: input.properties || '{}',
			filters: '{}', // Campo adicional para Drizzle
			tags: '[]', // Campo adicional para Drizzle
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
		const drizzleData: DrizzleWorldItemUpdateInput = { ...input };

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
	const validOrders = ['asc', 'desc'] as const;
	const sortOrder = (validOrders.includes(order as any) ? order : 'desc') as 'asc' | 'desc';

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
			: [];

	const effects =
		typeof worldItem.effects === 'string' ? (JSON.parse(worldItem.effects || '[]') as any[]) : [];

	const requirements =
		typeof worldItem.requirements === 'string'
			? (JSON.parse(worldItem.requirements || '[]') as any[])
			: [];

	// No hay campo stats en WorldItemComplete, usar array vacío
	const statsData: any[] = [];

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
		entityType: 'world-item' as const,
		_stats: stats,
	};
}
