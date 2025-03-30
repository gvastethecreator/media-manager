/**
 * @file Serializadores para la entidad WorldItem
 * @module entities/world-item/serializers
 */

import { logger } from '@/lib/logger';
import { WorldItemBase } from '@/types/entities/world-item/base';
import {
    WorldItemAttributesSchema,
    WorldItemEffectsSchema,
    WorldItemPropertiesSchema,
    WorldItemRequirementsSchema,
    WorldItemSchema,
    WorldItemStatsSchema
} from '@/types/entities/world-item/schema';
import { WorldItemStats } from '@/types/entities/world-item/stats-types';
import { WorldItemWithRelations, WorldItemWithStats } from '@/types/entities/world-item/types';

/**
 * Serializa los atributos de un objeto del mundo
 */
export function serializeWorldItemAttributes(attributes: { items: Array<{ name: string; value: number; maxValue?: number }> } | null): string {
  if (!attributes) return '{}';
  try {
    return JSON.stringify(attributes);
  } catch (error) {
    logger.error('Error serializando atributos de objeto del mundo:', error);
    return '{}';
  }
}

/**
 * Deserializa los atributos de un objeto del mundo
 */
export function deserializeWorldItemAttributes(attributesJson: string | null): { items: Array<{ name: string; value: number; maxValue?: number }> } {
  if (!attributesJson) return { items: [] };
  try {
    const parsed = JSON.parse(attributesJson);
    return WorldItemAttributesSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando atributos de objeto del mundo:', error);
    return { items: [] };
  }
}

/**
 * Serializa los efectos de un objeto del mundo
 */
export function serializeWorldItemEffects(effects: { items: Array<{ name: string; description: string; duration?: string; cooldown?: string }> } | null): string {
  if (!effects) return '{}';
  try {
    return JSON.stringify(effects);
  } catch (error) {
    logger.error('Error serializando efectos de objeto del mundo:', error);
    return '{}';
  }
}

/**
 * Deserializa los efectos de un objeto del mundo
 */
export function deserializeWorldItemEffects(effectsJson: string | null): { items: Array<{ name: string; description: string; duration?: string; cooldown?: string }> } {
  if (!effectsJson) return { items: [] };
  try {
    const parsed = JSON.parse(effectsJson);
    return WorldItemEffectsSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando efectos de objeto del mundo:', error);
    return { items: [] };
  }
}

/**
 * Serializa los requisitos de un objeto del mundo
 */
export function serializeWorldItemRequirements(requirements: { items: Array<{ name: string; value: number; description?: string }> } | null): string {
  if (!requirements) return '{}';
  try {
    return JSON.stringify(requirements);
  } catch (error) {
    logger.error('Error serializando requisitos de objeto del mundo:', error);
    return '{}';
  }
}

/**
 * Deserializa los requisitos de un objeto del mundo
 */
export function deserializeWorldItemRequirements(requirementsJson: string | null): { items: Array<{ name: string; value: number; description?: string }> } {
  if (!requirementsJson) return { items: [] };
  try {
    const parsed = JSON.parse(requirementsJson);
    return WorldItemRequirementsSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando requisitos de objeto del mundo:', error);
    return { items: [] };
  }
}

/**
 * Serializa las estadísticas de un objeto del mundo
 */
export function serializeWorldItemStats(stats: { items: Array<{ name: string; value: number; modifier?: string }> } | null): string {
  if (!stats) return '{}';
  try {
    return JSON.stringify(stats);
  } catch (error) {
    logger.error('Error serializando estadísticas de objeto del mundo:', error);
    return '{}';
  }
}

/**
 * Deserializa las estadísticas de un objeto del mundo
 */
export function deserializeWorldItemStats(statsJson: string | null): { items: Array<{ name: string; value: number; modifier?: string }> } {
  if (!statsJson) return { items: [] };
  try {
    const parsed = JSON.parse(statsJson);
    return WorldItemStatsSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando estadísticas de objeto del mundo:', error);
    return { items: [] };
  }
}

/**
 * Serializa las propiedades de un objeto del mundo
 */
export function serializeWorldItemProperties(properties: { items: Array<{ name: string; value: string | number | boolean; description?: string }> } | null): string {
  if (!properties) return '{}';
  try {
    return JSON.stringify(properties);
  } catch (error) {
    logger.error('Error serializando propiedades de objeto del mundo:', error);
    return '{}';
  }
}

/**
 * Deserializa las propiedades de un objeto del mundo
 */
export function deserializeWorldItemProperties(propertiesJson: string | null): { items: Array<{ name: string; value: string | number | boolean; description?: string }> } {
  if (!propertiesJson) return { items: [] };
  try {
    const parsed = JSON.parse(propertiesJson);
    return WorldItemPropertiesSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando propiedades de objeto del mundo:', error);
    return { items: [] };
  }
}

/**
 * Extiende un objeto del mundo con campos deserializados
 */
export function extendWorldItem(worldItem: WorldItemBase): WorldItemWithRelations {
  try {
    return {
      ...worldItem,
      _count: {
        images: 0,
        videos: 0,
        albums: 0,
        collections: 0,
        tags: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0,
        groups: 0
      }
    };
  } catch (error) {
    logger.error('Error extendiendo objeto del mundo:', error);
    throw error;
  }
}

/**
 * Enriquece un objeto del mundo con estadísticas
 */
export function extendWorldItemWithStats(worldItem: WorldItemBase): WorldItemWithStats {
  try {
    // Parse JSON fields
    const attributes = deserializeWorldItemAttributes(worldItem.attributes);
    const effects = deserializeWorldItemEffects(worldItem.effects);
    const requirements = deserializeWorldItemRequirements(worldItem.requirements);
    const stats = deserializeWorldItemStats(worldItem.stats);

    // Create a processed stats object
    const processedStats: WorldItemStats = {
      attributeCount: attributes.items.length,
      effectCount: effects.items.length,
      requirementCount: requirements.items.length,
      statCount: stats.items.length,
      averageAttributeValue: calculateAverageValue(attributes.items.map(a => a.value)),
      totalEffects: effects.items.length,
      highestRequirement: calculateHighestValue(requirements.items.map(r => r.value)),
      primaryStats: stats.items.map(s => s.name),
      combinedValue: calculateAverageValue(stats.items.map(s => s.value))
    };

    return {
      ...worldItem,
      _count: {
        images: 0,
        videos: 0,
        albums: 0,
        collections: 0,
        tags: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0,
        groups: 0
      },
      totalEntities: 0,
      lastUpdated: worldItem.updatedAt,
      totalSize: 0,
      processedStats
    };
  } catch (error) {
    logger.error('Error extendiendo objeto del mundo con estadísticas:', error);
    throw error;
  }
}

/**
 * Valida un objeto del mundo usando el esquema definido
 */
export function validateWorldItem(worldItem: WorldItemBase): boolean {
  try {
    WorldItemSchema.parse(worldItem);
    return true;
  } catch (error) {
    logger.error('Error validando objeto del mundo:', error);
    return false;
  }
}

/**
 * Calcula el valor promedio de un array de números
 * @private
 */
function calculateAverageValue(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Calcula el valor más alto de un array de números
 * @private
 */
function calculateHighestValue(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}