/**
 * @file Serializadores para la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import type {
	ParsedWorldItemVisualConfig,
	WorldItemBase,
	WorldItemExtended,
	WorldItemFilters,
	WorldItemProperty,
	WorldItemRequirement,
	WorldItemStats,
	WorldItemVisualConfig,
	WorldItemWithRelations
} from '../../types/entities/world-item';

/**
 * Serializa las propiedades de un objeto del mundo a formato JSON string
 * @param properties Array de propiedades o string JSON
 * @returns String JSON
 */
export function serializeWorldItemProperties(properties: WorldItemProperty[] | string): string {
	if (typeof properties === 'string') {
		return properties;
	}

	try {
		return JSON.stringify(properties || []);
	} catch (error) {
		console.error('Error al serializar las propiedades del objeto:', error);
		return JSON.stringify([]);
	}
}

/**
 * Deserializa las propiedades de un objeto del mundo desde JSON string
 * @param propertiesJson JSON string de propiedades
 * @returns Array de propiedades
 */
export function deserializeWorldItemProperties(propertiesJson: string | null): WorldItemProperty[] {
	if (!propertiesJson || propertiesJson === 'empty_array') return [];

	try {
		return JSON.parse(propertiesJson) as WorldItemProperty[];
	} catch (error) {
		console.error('Error al deserializar las propiedades del objeto:', error);
		return [];
	}
}

/**
 * Serializa los requisitos de un objeto del mundo a formato JSON string
 * @param requirements Objeto de requisitos o string JSON
 * @returns String JSON
 */
export function serializeWorldItemRequirements(requirements: Record<string, WorldItemRequirement> | string): string {
	if (typeof requirements === 'string') {
		return requirements;
	}

	try {
		return JSON.stringify(requirements || {});
	} catch (error) {
		console.error('Error al serializar los requisitos del objeto:', error);
		return JSON.stringify({});
	}
}

/**
 * Deserializa los requisitos de un objeto del mundo desde JSON string
 * @param requirementsJson JSON string de requisitos
 * @returns Objeto de requisitos
 */
export function deserializeWorldItemRequirements(
	requirementsJson: string | null
): Record<string, WorldItemRequirement> {
	if (!requirementsJson || requirementsJson === '{}') return {};

	try {
		return JSON.parse(requirementsJson) as Record<string, WorldItemRequirement>;
	} catch (error) {
		console.error('Error al deserializar los requisitos del objeto:', error);
		return {};
	}
}

/**
 * Serializa las estadísticas de un objeto del mundo a formato JSON string
 * @param stats Objeto de estadísticas o string JSON
 * @returns String JSON
 */
export function serializeWorldItemStats(stats: WorldItemStats | string): string {
	if (typeof stats === 'string') {
		return stats;
	}

	try {
		return JSON.stringify(stats || {});
	} catch (error) {
		console.error('Error al serializar las estadísticas del objeto:', error);
		return JSON.stringify({});
	}
}

/**
 * Deserializa las estadísticas de un objeto del mundo desde JSON string
 * @param statsJson JSON string de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializeWorldItemStats(statsJson: string | null): WorldItemStats {
	if (!statsJson || statsJson === '{}') return {};

	try {
		return JSON.parse(statsJson) as WorldItemStats;
	} catch (error) {
		console.error('Error al deserializar las estadísticas del objeto:', error);
		return {};
	}
}

/**
 * Serializa los filtros de objeto del mundo a formato JSON string
 * @param filters Objeto de filtros o string JSON
 * @returns String JSON
 */
export function serializeWorldItemFilters(filters: WorldItemFilters | Record<string, any> | string): string {
	if (typeof filters === 'string') {
		return filters;
	}

	try {
		return JSON.stringify(filters || {});
	} catch (error) {
		console.error('Error al serializar los filtros de objeto del mundo:', error);
		return JSON.stringify({});
	}
}

/**
 * Deserializa los filtros de objeto del mundo desde JSON string
 * @param filtersJson JSON string de filtros
 * @returns Objeto de filtros
 */
export function deserializeWorldItemFilters(filtersJson: string | null): Record<string, any> {
	if (!filtersJson || filtersJson === 'empty_array' || filtersJson === '{}') return {};

	try {
		return JSON.parse(filtersJson) as Record<string, any>;
	} catch (error) {
		console.error('Error al deserializar los filtros de objeto del mundo:', error);
		return {};
	}
}

/**
 * Serializa un array de atributos a formato JSON string
 * @param attributes Array de atributos o string JSON
 * @returns String JSON
 */
export function serializeWorldItemAttributes(attributes: string[] | string): string {
	if (typeof attributes === 'string') {
		return attributes;
	}

	try {
		if (!attributes || attributes.length === 0) {
			return 'empty_array';
		}
		return JSON.stringify(attributes);
	} catch (error) {
		console.error('Error al serializar los atributos del objeto:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un array de atributos desde JSON string
 * @param attributesJson JSON string de atributos
 * @returns Array de atributos
 */
export function deserializeWorldItemAttributes(attributesJson: string | null): string[] {
	if (!attributesJson || attributesJson === 'empty_array') return [];

	try {
		const parsed = JSON.parse(attributesJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error al deserializar los atributos del objeto:', error);
		return [];
	}
}

/**
 * Serializa un array de efectos a formato JSON string
 * @param effects Array de efectos o string JSON
 * @returns String JSON
 */
export function serializeWorldItemEffects(effects: string[] | string): string {
	if (typeof effects === 'string') {
		return effects;
	}

	try {
		if (!effects || effects.length === 0) {
			return 'empty_array';
		}
		return JSON.stringify(effects);
	} catch (error) {
		console.error('Error al serializar los efectos del objeto:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un array de efectos desde JSON string
 * @param effectsJson JSON string de efectos
 * @returns Array de efectos
 */
export function deserializeWorldItemEffects(effectsJson: string | null): string[] {
	if (!effectsJson || effectsJson === 'empty_array') return [];

	try {
		const parsed = JSON.parse(effectsJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error al deserializar los efectos del objeto:', error);
		return [];
	}
}

/**
 * Serializa un array de tags a formato JSON string
 * @param tags Array de tags o string JSON
 * @returns String JSON
 */
export function serializeWorldItemTags(tags: string[] | string): string {
	if (typeof tags === 'string') {
		return tags;
	}

	try {
		if (!tags || tags.length === 0) {
			return 'empty_array';
		}
		return JSON.stringify(tags);
	} catch (error) {
		console.error('Error al serializar los tags del objeto:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un array de tags desde JSON string
 * @param tagsJson JSON string de tags
 * @returns Array de tags
 */
export function deserializeWorldItemTags(tagsJson: string | null): string[] {
	if (!tagsJson || tagsJson === 'empty_array') return [];

	try {
		const parsed = JSON.parse(tagsJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error al deserializar los tags del objeto:', error);
		return [];
	}
}

/**
 * Transforma un objeto WorldItem base a formato extendido con campos deserializados
 * @param worldItem Objeto del mundo base
 * @returns Objeto WorldItemExtended con campos deserializados
 */
export function toExtendedWorldItem(worldItem: WorldItemBase): WorldItemExtended {
	const {
		attributes,
		effects,
		requirements,
		stats,
		filters,
		tags,
		...rest
	} = worldItem;

	return {
		...rest,
		// Deserializar campos JSON
		attributes: deserializeWorldItemAttributes(attributes),
		effects: deserializeWorldItemEffects(effects),
		requirements: deserializeWorldItemRequirements(requirements),
		stats: deserializeWorldItemStats(stats),
		filters: deserializeWorldItemFilters(filters),
		tags: tags ? deserializeWorldItemTags(tags) : [],

		// Mantener relaciones y contadores si existen
		images: ('images' in worldItem) ? (worldItem as WorldItemWithRelations).images || [] : [],
		videos: ('videos' in worldItem) ? (worldItem as WorldItemWithRelations).videos || [] : [],
		albums: ('albums' in worldItem) ? (worldItem as WorldItemWithRelations).albums || [] : [],
		collections: ('collections' in worldItem) ? (worldItem as WorldItemWithRelations).collections || [] : [],
		tagEntities: ('tagEntities' in worldItem) ? (worldItem as WorldItemWithRelations).tagEntities || [] : [],
		characters: ('characters' in worldItem) ? (worldItem as WorldItemWithRelations).characters || [] : [],
		places: ('places' in worldItem) ? (worldItem as WorldItemWithRelations).places || [] : [],
		concepts: ('concepts' in worldItem) ? (worldItem as WorldItemWithRelations).concepts || [] : [],
		prompts: ('prompts' in worldItem) ? (worldItem as WorldItemWithRelations).prompts || [] : [],
		notes: ('notes' in worldItem) ? (worldItem as WorldItemWithRelations).notes || [] : [],
		wildcards: ('wildcards' in worldItem) ? (worldItem as WorldItemWithRelations).wildcards || [] : [],
		properties: ('properties' in worldItem) ? (worldItem as WorldItemWithRelations).properties || [] : [],
		groups: ('groups' in worldItem) ? (worldItem as WorldItemWithRelations).groups || [] : [],
		_count: ('_count' in worldItem) ? (worldItem as WorldItemWithRelations)._count || {} : {},

		// Propiedades derivadas
		displayRarity: getRarityDisplay(worldItem.rarity),
		displayValue: getValueDisplay(deserializeWorldItemStats(stats)),
		displayLevel: getLevelDisplay(deserializeWorldItemStats(stats)),
		rarityClass: getRarityClass(worldItem.rarity),
	};
}

/**
 * Transforma un objeto WorldItemExtended de vuelta a formato básico con campos serializados
 * @param extendedWorldItem Objeto del mundo extendido
 * @returns Objeto parcial WorldItemBase con campos serializados
 */
export function fromExtendedWorldItem(extendedWorldItem: Partial<WorldItemExtended>): Partial<WorldItemBase> {
	const {
		attributes,
		effects,
		requirements,
		stats,
		filters,
		tags,
		// Excluir relaciones y contadores
		images,
		videos,
		albums,
		collections,
		tagEntities,
		characters,
		places,
		concepts,
		prompts,
		notes,
		wildcards,
		properties,
		groups,
		_count,
		// Excluir propiedades derivadas
		displayRarity,
		displayValue,
		displayLevel,
		rarityClass,
		...rest
	} = extendedWorldItem;

	return {
		...rest,
		// Serializar campos de vuelta a JSON
		...(attributes !== undefined && { attributes: serializeWorldItemAttributes(attributes) }),
		...(effects !== undefined && { effects: serializeWorldItemEffects(effects) }),
		...(requirements !== undefined && { requirements: serializeWorldItemRequirements(requirements as Record<string, WorldItemRequirement>) }),
		...(stats !== undefined && { stats: serializeWorldItemStats(stats as WorldItemStats) }),
		...(filters !== undefined && { filters: serializeWorldItemFilters(filters) }),
		...(tags !== undefined && { tags: serializeWorldItemTags(tags) }),
	};
}

/**
 * Obtiene la representación visual de la rareza
 * @param rarity Nivel de rareza
 * @returns Texto formateado para mostrar
 */
function getRarityDisplay(rarity: string): string {
	const rarityMap: Record<string, string> = {
		common: 'Común',
		uncommon: 'Poco común',
		rare: 'Raro',
		veryrare: 'Muy raro',
		epic: 'Épico',
		legendary: 'Legendario',
		mythic: 'Mítico',
		unique: 'Único',
		artifact: 'Artefacto',
	};

	return rarityMap[rarity.toLowerCase()] || rarity;
}

/**
 * Obtiene la representación visual del valor
 * @param stats Estadísticas del objeto
 * @returns Texto formateado para mostrar
 */
function getValueDisplay(stats: WorldItemStats): string {
	if (!stats.value) return 'Sin valor';
	return `${stats.value} monedas`;
}

/**
 * Obtiene la representación visual del nivel
 * @param stats Estadísticas del objeto
 * @returns Texto formateado para mostrar
 */
function getLevelDisplay(stats: WorldItemStats): string {
	if (!stats.level) return 'Sin nivel';
	return `Nivel ${stats.level}`;
}

/**
 * Obtiene la clase CSS para la rareza
 * @param rarity Nivel de rareza
 * @returns Nombre de clase CSS
 */
function getRarityClass(rarity: string): string {
	const rarityClassMap: Record<string, string> = {
		common: 'rarity-common',
		uncommon: 'rarity-uncommon',
		rare: 'rarity-rare',
		veryrare: 'rarity-veryrare',
		epic: 'rarity-epic',
		legendary: 'rarity-legendary',
		mythic: 'rarity-mythic',
		unique: 'rarity-unique',
		artifact: 'rarity-artifact',
	};

	return rarityClassMap[rarity.toLowerCase()] || 'rarity-default';
}

/**
 * Parsea la configuración visual
 * @param config Configuración visual
 * @returns Configuración visual parseada
 */
export function parseVisualConfig(config: WorldItemVisualConfig): ParsedWorldItemVisualConfig {
	return {
		view: config.view || 'grid',
		sortBy: config.sortBy || 'name:asc',
		filters: config.filters ? deserializeWorldItemFilters(config.filters) : {},
		lastViewedWorldItemId: config.lastViewedWorldItemId || null,
		expandedWorldItemIds: config.expandedWorldItemIds || [],
		selectedWorldItemIds: config.selectedWorldItemIds || [],
	};
}
