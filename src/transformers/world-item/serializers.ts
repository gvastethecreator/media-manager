/**
 * @file Funciones de serialización para la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    WorldItemAttributes,
    WorldItemBase,
    WorldItemEffects,
    WorldItemFilter,
    WorldItemRequirements,
    WorldItemStats,
    WorldItemVisualConfig
} from '@/types/entities/world-item';

const serializersLogger = serverLogger.withContext('WorldItemSerializers');

/**
 * Serializa un array de atributos a formato JSON string
 * @param attributes Atributos del objeto del mundo
 * @returns String JSON con los atributos
 */
export function serializeWorldItemAttributes(attributes: WorldItemAttributes[] | string): string {
	try {
		if (typeof attributes === 'string') return attributes;
		return attributes && attributes.length > 0 ? JSON.stringify(attributes) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar atributos:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un string JSON a array de atributos
 * @param attributesString String JSON con atributos
 * @returns Array de atributos del objeto del mundo
 */
export function deserializeWorldItemAttributes(attributesString?: string | null): WorldItemAttributes[] {
	if (!attributesString) return [];

	try {
		if (attributesString === 'empty_array') return [];
		const parsed = JSON.parse(attributesString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar atributos:', error);
		return [];
	}
}

/**
 * Serializa un array de efectos a formato JSON string
 * @param effects Efectos del objeto del mundo
 * @returns String JSON con los efectos
 */
export function serializeWorldItemEffects(effects: WorldItemEffects[] | string): string {
	try {
		if (typeof effects === 'string') return effects;
		return effects && effects.length > 0 ? JSON.stringify(effects) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar efectos:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un string JSON a array de efectos
 * @param effectsString String JSON con efectos
 * @returns Array de efectos del objeto del mundo
 */
export function deserializeWorldItemEffects(effectsString?: string | null): WorldItemEffects[] {
	if (!effectsString) return [];

	try {
		if (effectsString === 'empty_array') return [];
		const parsed = JSON.parse(effectsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar efectos:', error);
		return [];
	}
}

/**
 * Serializa requisitos a formato JSON string
 * @param requirements Requisitos del objeto del mundo
 * @returns String JSON con los requisitos
 */
export function serializeWorldItemRequirements(requirements: WorldItemRequirements | string): string {
	try {
		if (typeof requirements === 'string') return requirements;
		return requirements ? JSON.stringify(requirements) : '';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar requisitos:', error);
		return '';
	}
}

/**
 * Deserializa un string JSON a objeto de requisitos
 * @param requirementsString String JSON con requisitos
 * @returns Objeto de requisitos del objeto del mundo
 */
export function deserializeWorldItemRequirements(requirementsString?: string | null): WorldItemRequirements | null {
	if (!requirementsString) return null;

	try {
		return JSON.parse(requirementsString);
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar requisitos:', error);
		return null;
	}
}

/**
 * Serializa estadísticas a formato JSON string
 * @param stats Estadísticas del objeto del mundo
 * @returns String JSON con las estadísticas
 */
export function serializeWorldItemStats(stats: WorldItemStats | string): string {
	try {
		if (typeof stats === 'string') return stats;
		return stats ? JSON.stringify(stats) : '';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar estadísticas:', error);
		return '';
	}
}

/**
 * Deserializa un string JSON a objeto de estadísticas
 * @param statsString String JSON con estadísticas
 * @returns Objeto de estadísticas del objeto del mundo
 */
export function deserializeWorldItemStats(statsString?: string | null): WorldItemStats | null {
	if (!statsString) return null;

	try {
		return JSON.parse(statsString);
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar estadísticas:', error);
		return null;
	}
}

/**
 * Serializa filtros a formato JSON string
 * @param filters Filtros del objeto del mundo
 * @returns String JSON con los filtros
 */
export function serializeWorldItemFilters(filters: WorldItemFilter[] | string): string {
	try {
		if (typeof filters === 'string') return filters;
		return filters && filters.length > 0 ? JSON.stringify(filters) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar filtros:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un string JSON a array de filtros
 * @param filtersString String JSON con filtros
 * @returns Array de filtros del objeto del mundo
 */
export function deserializeWorldItemFilters(filtersString?: string | null): WorldItemFilter[] {
	if (!filtersString) return [];

	try {
		if (filtersString === 'empty_array') return [];
		const parsed = JSON.parse(filtersString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar filtros:', error);
		return [];
	}
}

/**
 * Serializa etiquetas a formato JSON string
 * @param tags Etiquetas del objeto del mundo
 * @returns String JSON con las etiquetas
 */
export function serializeWorldItemTags(tags: string[] | string): string {
	try {
		if (typeof tags === 'string') return tags;
		return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al serializar etiquetas:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa un string JSON a array de etiquetas
 * @param tagsString String JSON con etiquetas
 * @returns Array de etiquetas del objeto del mundo
 */
export function deserializeWorldItemTags(tagsString?: string | null): string[] {
	if (!tagsString) return [];

	try {
		if (tagsString === 'empty_array') return [];
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar etiquetas:', error);
		return [];
	}
}

/**
 * Parsea todos los campos JSON de un objeto del mundo
 * @param worldItem Objeto del mundo con campos serializados
 * @returns Objeto del mundo con campos deserializados
 */
export function parseJsonFields(worldItem: WorldItemBase): any {
	try {
		return {
			...worldItem,
			attributes: deserializeWorldItemAttributes(worldItem.attributes),
			effects: deserializeWorldItemEffects(worldItem.effects),
			requirements: deserializeWorldItemRequirements(worldItem.requirements),
			stats: deserializeWorldItemStats(worldItem.stats),
			filters: deserializeWorldItemFilters(worldItem.filters),
		};
	} catch (error) {
		serializersLogger.error('❌ Error al parsear campos JSON:', error);
		return worldItem;
	}
}

/**
 * Parsea una configuración visual de un objeto del mundo
 * @param config Configuración visual potencialmente serializada
 * @returns Configuración visual deserializada
 */
export function parseVisualConfig(config: WorldItemVisualConfig | string): WorldItemVisualConfig {
	if (typeof config !== 'string') {
		return config;
	}

	try {
		return JSON.parse(config);
	} catch (error) {
		serializersLogger.error('❌ Error al parsear configuración visual:', error);
		return {
			showIcon: true,
			showType: true,
			showRarity: true,
			showStats: true,
			animateIcon: false,
			theme: 'default',
		};
	}
}
