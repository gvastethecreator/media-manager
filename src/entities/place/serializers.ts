/**
 * @file Serializadores para la entidad Place
 * @module entities/place/serializers
 */

import { logger } from '@/lib/logger';
import { PlaceDangerSchema, PlaceFiltersSchema, PlaceResourceSchema, PlaceSchema } from '@/types/entities/place/schema';
import type { PlaceComplete, PlaceDanger, PlaceExtendedComplete, PlaceFilters, PlaceResource, PlaceStats, PlaceWithRelations } from '@/types/entities/place/types';
import { deserializeJsonField, serializeJsonField } from '@/utils/transformers/common';

/**
 * 🏰 Serializa los peligros de un lugar
 */
export function serializePlaceDangers(dangers: PlaceDanger[] | null): string {
  try {
    if (!dangers) return '';
    return serializeJsonField(dangers);
  } catch (error) {
    logger.error('Error serializando peligros del lugar:', error);
    return '';
  }
}

/**
 * 🏰 Deserializa los peligros de un lugar
 */
export function deserializePlaceDangers(dangers: string | null): PlaceDanger[] | null {
  try {
    if (!dangers) return null;
    const parsed = deserializeJsonField<PlaceDanger[]>(dangers, null);
    if (!parsed) return null;
    return parsed.map(danger => PlaceDangerSchema.parse(danger));
  } catch (error) {
    logger.error('Error deserializando peligros del lugar:', error);
    return null;
  }
}

/**
 * 🌟 Serializa los recursos de un lugar
 */
export function serializePlaceResources(resources: PlaceResource[] | null): string {
  try {
    if (!resources) return '';
    return serializeJsonField(resources);
  } catch (error) {
    logger.error('Error serializando recursos del lugar:', error);
    return '';
  }
}

/**
 * 🌟 Deserializa los recursos de un lugar
 */
export function deserializePlaceResources(resources: string | null): PlaceResource[] | null {
  try {
    if (!resources) return null;
    const parsed = deserializeJsonField<PlaceResource[]>(resources, null);
    if (!parsed) return null;
    return parsed.map(resource => PlaceResourceSchema.parse(resource));
  } catch (error) {
    logger.error('Error deserializando recursos del lugar:', error);
    return null;
  }
}

/**
 * 📊 Serializa las estadísticas de un lugar
 */
export function serializePlaceStats(stats: PlaceStats | null): string {
  try {
    if (!stats) return '';
    return serializeJsonField(stats);
  } catch (error) {
    logger.error('Error serializando estadísticas del lugar:', error);
    return '';
  }
}

/**
 * 📊 Deserializa las estadísticas de un lugar
 */
export function deserializePlaceStats(stats: string | null): PlaceStats | null {
  try {
    if (!stats) return null;
    return deserializeJsonField<PlaceStats>(stats, {});
  } catch (error) {
    logger.error('Error deserializando estadísticas del lugar:', error);
    return null;
  }
}

/**
 * 🔍 Serializa los filtros de un lugar
 */
export function serializePlaceFilters(filters: PlaceFilters | null): string {
  try {
    if (!filters) return '';
    return serializeJsonField(filters);
  } catch (error) {
    logger.error('Error serializando filtros del lugar:', error);
    return '';
  }
}

/**
 * 🔍 Deserializa los filtros de un lugar
 */
export function deserializePlaceFilters(filters: string | null): PlaceFilters | null {
  try {
    if (!filters) return null;
    const parsed = deserializeJsonField<PlaceFilters>(filters, null);
    if (!parsed) return null;
    return PlaceFiltersSchema.parse(parsed);
  } catch (error) {
    logger.error('Error deserializando filtros del lugar:', error);
    return null;
  }
}

/**
 * 🌍 Extiende un lugar con sus campos deserializados
 */
export function extendPlace(place: PlaceComplete): PlaceWithRelations {
  try {
    return {
      ...place,
      dangersArray: deserializePlaceDangers(place.dangers as string),
      resourcesArray: deserializePlaceResources(place.resources as string),
      statsObject: deserializePlaceStats(place.stats as string),
      filtersObject: deserializePlaceFilters(place.filters as string)
    };
  } catch (error) {
    logger.error('Error extendiendo lugar:', error);
    return place;
  }
}

/**
 * 🌍 Extiende un lugar con todos sus campos y relaciones
 */
export function extendPlaceComplete(place: PlaceComplete): PlaceExtendedComplete {
  try {
    const extended = extendPlace(place);
    return {
      ...extended,
      isSelected: false,
      isExpanded: false,
      isEditing: false,
      isHighlighted: false,
      dangerLevel: calculateDangerLevel(extended.dangersArray),
      displayPopulation: formatPopulation(extended.population),
      displaySize: calculateSize(extended),
      regionPath: extended.region ? extended.region.split('/') : [],
      recentImages: []
    };
  } catch (error) {
    logger.error('Error extendiendo lugar completo:', error);
    return place as PlaceExtendedComplete;
  }
}

/**
 * ✅ Valida un lugar usando el esquema Zod
 */
export function validatePlace(place: unknown): PlaceComplete {
  return PlaceSchema.parse(place);
}

// Funciones auxiliares

function calculateDangerLevel(dangers: PlaceDanger[] | null): string {
  if (!dangers || dangers.length === 0) return 'safe';
  const maxLevel = Math.max(...dangers.map(d => d.level || 0));
  if (maxLevel >= 8) return 'extreme';
  if (maxLevel >= 6) return 'high';
  if (maxLevel >= 4) return 'moderate';
  if (maxLevel >= 2) return 'low';
  return 'minimal';
}

function formatPopulation(population: number | undefined): string {
  if (!population) return 'Unknown';
  if (population >= 1000000) return `${(population / 1000000).toFixed(1)}M`;
  if (population >= 1000) return `${(population / 1000).toFixed(1)}K`;
  return population.toString();
}

function calculateSize(place: PlaceComplete): string {
  // Implementar lógica de cálculo de tamaño basada en tipo y otros factores
  return 'medium'; // Placeholder
}