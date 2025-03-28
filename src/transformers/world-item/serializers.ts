/**
 * @file Serializadores para la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import {
	type ParsedWorldItemVisualConfig,
	type WorldItem,
	type WorldItemBase,
	type WorldItemFilters,
	type WorldItemProperty,
	type WorldItemRequirement,
	type WorldItemStats,
	type WorldItemVisualConfig,
	RarityLevel,
} from '../../types/entities/world-item';

/**
 * Serializa las propiedades de un objeto del mundo a formato JSON string
 * @param properties Array de propiedades
 * @returns JSON string de propiedades
 */
export function serializeWorldItemProperties(properties: WorldItemProperty[]): string {
	try {
		return JSON.stringify(properties);
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
 * @param requirements Objeto de requisitos
 * @returns JSON string de requisitos
 */
export function serializeWorldItemRequirements(requirements: Record<string, WorldItemRequirement>): string {
	try {
		return JSON.stringify(requirements);
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
 * @param stats Objeto de estadísticas
 * @returns JSON string de estadísticas
 */
export function serializeWorldItemStats(stats: WorldItemStats): string {
	try {
		return JSON.stringify(stats);
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
 * @param filters Objeto de filtros
 * @returns JSON string de filtros
 */
export function serializeWorldItemFilters(filters: WorldItemFilters): string {
	try {
		return JSON.stringify(filters);
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
export function deserializeWorldItemFilters(filtersJson: string | null): WorldItemFilters {
	if (!filtersJson || filtersJson === 'empty_array' || filtersJson === '{}') return {};

	try {
		return JSON.parse(filtersJson) as WorldItemFilters;
	} catch (error) {
		console.error('Error al deserializar los filtros de objeto del mundo:', error);
		return {};
	}
}

/**
 * Parsea todos los campos JSON de un objeto del mundo base a sus valores tipados
 * @param worldItem Objeto del mundo base
 * @returns Objeto del mundo con campos parseados
 */
export function parseJsonFields(worldItem: WorldItemBase): WorldItem {
	// Campos básicos
	const parsedItem: WorldItem = {
		...worldItem,
		propertiesArray: deserializeWorldItemProperties(worldItem.properties),
		requirementsObject: deserializeWorldItemRequirements(worldItem.requirements),
		statsObject: deserializeWorldItemStats(worldItem.stats),
		filtersObject: deserializeWorldItemFilters(worldItem.filters),
	};

	// Campos derivados
	parsedItem.displayRarity = getRarityDisplay(worldItem.rarity);
	parsedItem.displayValue = getValueDisplay(parsedItem.statsObject);
	parsedItem.displayLevel = getLevelDisplay(parsedItem.statsObject);
	parsedItem.rarityClass = getRarityClass(worldItem.rarity);

	return parsedItem;
}

/**
 * Obtiene la visualización de la rareza
 * @param rarity String de rareza
 * @returns Visualización formateada
 */
function getRarityDisplay(rarity: string): string {
	const rarityMap: Record<string, string> = {
		[RarityLevel.COMMON]: 'Común',
		[RarityLevel.UNCOMMON]: 'Poco común',
		[RarityLevel.RARE]: 'Raro',
		[RarityLevel.EPIC]: 'Épico',
		[RarityLevel.LEGENDARY]: 'Legendario',
		[RarityLevel.MYTHIC]: 'Mítico',
		[RarityLevel.UNIQUE]: 'Único',
		[RarityLevel.ARTIFACT]: 'Artefacto',
	};

	return rarityMap[rarity] || rarity;
}

/**
 * Obtiene la visualización del valor
 * @param stats Estadísticas del objeto
 * @returns Visualización formateada
 */
function getValueDisplay(stats: WorldItemStats): string {
	if (!stats.value && stats.value !== 0) return 'N/A';
	return `${stats.value} monedas`;
}

/**
 * Obtiene la visualización del nivel
 * @param stats Estadísticas del objeto
 * @returns Visualización formateada
 */
function getLevelDisplay(stats: WorldItemStats): string {
	if (!stats.level && stats.level !== 0) return 'N/A';
	return `Nivel ${stats.level}`;
}

/**
 * Obtiene la clase CSS para la rareza
 * @param rarity String de rareza
 * @returns Clase CSS
 */
function getRarityClass(rarity: string): string {
	const rarityClassMap: Record<string, string> = {
		[RarityLevel.COMMON]: 'rarity-common',
		[RarityLevel.UNCOMMON]: 'rarity-uncommon',
		[RarityLevel.RARE]: 'rarity-rare',
		[RarityLevel.EPIC]: 'rarity-epic',
		[RarityLevel.LEGENDARY]: 'rarity-legendary',
		[RarityLevel.MYTHIC]: 'rarity-mythic',
		[RarityLevel.UNIQUE]: 'rarity-unique',
		[RarityLevel.ARTIFACT]: 'rarity-artifact',
	};

	return rarityClassMap[rarity] || 'rarity-common';
}

/**
 * Parsea la configuración visual de objetos del mundo
 * @param config Configuración visual
 * @returns Configuración visual parseada
 */
export function parseVisualConfig(config: WorldItemVisualConfig): ParsedWorldItemVisualConfig {
	return {
		...config,
		filtersObject: deserializeWorldItemFilters(config.filters),
	};
}
