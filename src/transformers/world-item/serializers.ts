/**
 * @file Serializadores para la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import type { JSONString } from '@/utils/types/utility-types';
import type {
    ParsedWorldItem,
    ParsedWorldItemVisualConfig,
    WorldItemBase,
    WorldItemEffect,
    WorldItemExtended,
    WorldItemFilters,
    WorldItemProperty,
    WorldItemRequirement,
    WorldItemStats,
    WorldItemVisualConfig,
    WorldItemWithRelations,
} from '../../types/entities/world-item';

const EMPTY_ARRAY = 'empty_array';
const EMPTY_OBJECT = '{}';

/**
 * Serializa las propiedades de un objeto del mundo a formato JSON string
 */
export function serializeWorldItemProperties(properties: WorldItemProperty[] | string): JSONString<WorldItemProperty[]> {
    if (typeof properties === 'string') {
        return properties as JSONString<WorldItemProperty[]>;
    }

    try {
        if (!properties?.length) return EMPTY_ARRAY as JSONString<WorldItemProperty[]>;
        return JSON.stringify(properties) as JSONString<WorldItemProperty[]>;
    } catch (error) {
        console.error('Error al serializar las propiedades:', error);
        return EMPTY_ARRAY as JSONString<WorldItemProperty[]>;
    }
}

/**
 * Deserializa las propiedades de un objeto del mundo desde JSON string
 */
export function deserializeWorldItemProperties(propertiesJson: string | null): WorldItemProperty[] {
    if (!propertiesJson || propertiesJson === EMPTY_ARRAY) return [];

    try {
        const parsed = JSON.parse(propertiesJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error al deserializar las propiedades:', error);
        return [];
    }
}

/**
 * Serializa los filtros de objeto del mundo a formato JSON string
 */
export function serializeWorldItemFilters(filters: WorldItemFilters | Record<string, unknown> | string): JSONString<WorldItemFilters> {
    if (typeof filters === 'string') {
        return filters as JSONString<WorldItemFilters>;
    }

    try {
        return JSON.stringify(filters || {}) as JSONString<WorldItemFilters>;
    } catch (error) {
        console.error('Error al serializar los filtros:', error);
        return EMPTY_OBJECT as JSONString<WorldItemFilters>;
    }
}

/**
 * Deserializa los filtros de objeto del mundo desde JSON string
 */
export function deserializeWorldItemFilters(filtersJson: string | null): WorldItemFilters {
    if (!filtersJson || filtersJson === EMPTY_ARRAY || filtersJson === EMPTY_OBJECT) {
        return {} as WorldItemFilters;
    }

    try {
        return JSON.parse(filtersJson) as WorldItemFilters;
    } catch (error) {
        console.error('Error al deserializar los filtros:', error);
        return {} as WorldItemFilters;
    }
}

/**
 * Serializa los requisitos de un objeto del mundo a formato JSON string
 */
export function serializeWorldItemRequirements(requirements: Record<string, WorldItemRequirement> | string): JSONString<Record<string, WorldItemRequirement>> {
    if (typeof requirements === 'string') {
        return requirements as JSONString<Record<string, WorldItemRequirement>>;
    }

    try {
        return JSON.stringify(requirements || {}) as JSONString<Record<string, WorldItemRequirement>>;
    } catch (error) {
        console.error('Error al serializar los requisitos:', error);
        return EMPTY_OBJECT as JSONString<Record<string, WorldItemRequirement>>;
    }
}

/**
 * Deserializa los requisitos de un objeto del mundo desde JSON string
 */
export function deserializeWorldItemRequirements(requirementsJson: string | null): Record<string, WorldItemRequirement> {
    if (!requirementsJson || requirementsJson === EMPTY_OBJECT) {
        return {};
    }

    try {
        return JSON.parse(requirementsJson) as Record<string, WorldItemRequirement>;
    } catch (error) {
        console.error('Error al deserializar los requisitos:', error);
        return {};
    }
}

/**
 * Serializa las estadísticas de un objeto del mundo a formato JSON string
 */
export function serializeWorldItemStats(stats: WorldItemStats | string): JSONString<WorldItemStats> {
    if (typeof stats === 'string') {
        return stats as JSONString<WorldItemStats>;
    }

    try {
        return JSON.stringify(stats || {}) as JSONString<WorldItemStats>;
    } catch (error) {
        console.error('Error al serializar las estadísticas:', error);
        return EMPTY_OBJECT as JSONString<WorldItemStats>;
    }
}

/**
 * Deserializa las estadísticas de un objeto del mundo desde JSON string
 */
export function deserializeWorldItemStats(statsJson: string | null): WorldItemStats {
    if (!statsJson || statsJson === EMPTY_OBJECT) {
        return {} as WorldItemStats;
    }

    try {
        return JSON.parse(statsJson) as WorldItemStats;
    } catch (error) {
        console.error('Error al deserializar las estadísticas:', error);
        return {} as WorldItemStats;
    }
}

/**
 * Serializa un array de atributos a formato JSON string
 */
export function serializeWorldItemAttributes(attributes: string[] | string): JSONString<string[]> {
    if (typeof attributes === 'string') {
        return attributes as JSONString<string[]>;
    }

    try {
        if (!attributes?.length) return EMPTY_ARRAY as JSONString<string[]>;
        return JSON.stringify(attributes) as JSONString<string[]>;
    } catch (error) {
        console.error('Error al serializar los atributos:', error);
        return EMPTY_ARRAY as JSONString<string[]>;
    }
}

/**
 * Deserializa un array de atributos desde JSON string
 */
export function deserializeWorldItemAttributes(attributesJson: string | null): string[] {
    if (!attributesJson || attributesJson === EMPTY_ARRAY) return [];

    try {
        const parsed = JSON.parse(attributesJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error al deserializar los atributos:', error);
        return [];
    }
}

/**
 * Serializa un array de efectos a formato JSON string
 */
export function serializeWorldItemEffects(effects: WorldItemEffect[] | string): JSONString<WorldItemEffect[]> {
    if (typeof effects === 'string') {
        return effects as JSONString<WorldItemEffect[]>;
    }

    try {
        if (!effects?.length) return EMPTY_ARRAY as JSONString<WorldItemEffect[]>;
        return JSON.stringify(effects) as JSONString<WorldItemEffect[]>;
    } catch (error) {
        console.error('Error al serializar los efectos:', error);
        return EMPTY_ARRAY as JSONString<WorldItemEffect[]>;
    }
}

/**
 * Deserializa un array de efectos desde JSON string
 */
export function deserializeWorldItemEffects(effectsJson: string | null): WorldItemEffect[] {
    if (!effectsJson || effectsJson === EMPTY_ARRAY) return [];

    try {
        const parsed = JSON.parse(effectsJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error al deserializar los efectos:', error);
        return [];
    }
}

/**
 * Serializa un array de tags a formato JSON string
 */
export function serializeWorldItemTags(tags: string[] | string): JSONString<string[]> {
    if (typeof tags === 'string') {
        return tags as JSONString<string[]>;
    }

    try {
        if (!tags?.length) return EMPTY_ARRAY as JSONString<string[]>;
        return JSON.stringify(tags) as JSONString<string[]>;
    } catch (error) {
        console.error('Error al serializar los tags:', error);
        return EMPTY_ARRAY as JSONString<string[]>;
    }
}

/**
 * Deserializa un array de tags desde JSON string
 */
export function deserializeWorldItemTags(tagsJson: string | null): string[] {
    if (!tagsJson || tagsJson === EMPTY_ARRAY) return [];

    try {
        const parsed = JSON.parse(tagsJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error al deserializar los tags:', error);
        return [];
    }
}

/**
 * Transforma un objeto WorldItem base a formato extendido con campos deserializados
 */
export function toExtendedWorldItem(worldItem: WorldItemBase): WorldItemExtended {
    const {
        attributes,
        effects,
        requirements,
        stats,
        filters,
        tags: rawTags,
        ...rest
    } = worldItem;

    // Convertir a tipo base antes de cast
    const asRelations = {
        ...worldItem,
        images: [],
        videos: [],
        albums: [],
        collections: [],
        tags: [],
        characters: [],
        places: [],
        concepts: [],
        prompts: [],
        notes: [],
        wildcards: [],
        properties: [],
        groups: [],
        _count: {},
    } as WorldItemWithRelations;

    // Deserializar campos JSON
    const deserializedTags = deserializeWorldItemTags(rawTags);
    const parsedEffects = deserializeWorldItemEffects(effects);

    return {
        ...rest,
        // Campos deserializados
        attributes: deserializeWorldItemAttributes(attributes),
        effects: parsedEffects,
        requirements: deserializeWorldItemRequirements(requirements),
        stats: deserializeWorldItemStats(stats),
        filters: deserializeWorldItemFilters(filters),
        tags: deserializedTags,

        // Mantener relaciones y contadores
        images: asRelations.images,
        videos: asRelations.videos,
        albums: asRelations.albums,
        collections: asRelations.collections,
        characters: asRelations.characters,
        places: asRelations.places,
        concepts: asRelations.concepts,
        prompts: asRelations.prompts,
        notes: asRelations.notes,
        wildcards: asRelations.wildcards,
        properties: asRelations.properties,
        groups: asRelations.groups,
        _count: asRelations._count,

        // Propiedades derivadas
        displayRarity: getRarityDisplay(worldItem.rarity),
        displayValue: getValueDisplay(deserializeWorldItemStats(stats)),
        displayLevel: getLevelDisplay(deserializeWorldItemStats(stats)),
        rarityClass: getRarityClass(worldItem.rarity),
    };
}

/**
 * Transforma un objeto WorldItemExtended de vuelta a formato básico con campos serializados
 */
export function fromExtendedWorldItem(extendedWorldItem: Partial<WorldItemExtended>): Partial<WorldItemBase> {
    const {
        // Campos a serializar
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
        ...(requirements !== undefined && { requirements: serializeWorldItemRequirements(requirements) }),
        ...(stats !== undefined && { stats: serializeWorldItemStats(stats) }),
        ...(filters !== undefined && { filters: serializeWorldItemFilters(filters) }),
        ...(tags !== undefined && { tags: serializeWorldItemTags(tags) }),
    };
}

/**
 * Obtiene la representación visual de la rareza
 */
function getRarityDisplay(rarity: string): string {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Obtiene la representación visual del valor
 */
function getValueDisplay(stats: WorldItemStats): string {
    if (!stats.value) return 'N/A';
    return `${stats.value} ${stats.currency || 'gold'}`;
}

/**
 * Obtiene la representación visual del nivel
 */
function getLevelDisplay(stats: WorldItemStats): string {
    if (!stats.level) return 'N/A';
    return `Lvl ${stats.level}`;
}

/**
 * Obtiene la clase CSS para la rareza
 */
function getRarityClass(rarity: string): string {
    return `rarity-${rarity.toLowerCase()}`;
}

/**
 * Parsea los campos JSON de un objeto WorldItemBase
 */
export function parseJsonFields(worldItem: WorldItemBase): ParsedWorldItem {
    return {
        ...worldItem,
        propertiesArray: deserializeWorldItemProperties(worldItem.properties),
        requirementsObject: deserializeWorldItemRequirements(worldItem.requirements),
        statsObject: deserializeWorldItemStats(worldItem.stats),
        filtersObject: deserializeWorldItemFilters(worldItem.filters),
        attributesArray: deserializeWorldItemAttributes(worldItem.attributes),
        effectsArray: deserializeWorldItemEffects(worldItem.effects),
    };
}

/**
 * Parsea la configuración visual
 */
export function parseVisualConfig(config: WorldItemVisualConfig): ParsedWorldItemVisualConfig {
    return {
        view: config.view || 'grid',
        sortBy: config.sortBy || 'name_asc',
        filters: config.filters ? deserializeWorldItemFilters(config.filters) : {},
        lastViewedWorldItemId: config.lastViewedWorldItemId || null,
        expandedWorldItemIds: config.expandedWorldItemIds || [],
        selectedWorldItemIds: config.selectedWorldItemIds || [],
    };
}
