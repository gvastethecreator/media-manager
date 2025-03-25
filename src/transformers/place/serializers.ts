/**
 * @file Serializadores para la entidad Place
 * @module transformers/place/serializers
 */

import type {
    ParsedPlaceVisualConfig,
    Place,
    PlaceBase,
    PlaceDanger,
    PlaceFilters,
    PlaceResource,
    PlaceStats,
    PlaceVisualConfig
} from '../../types/entities/place';

/**
 * Serializa los peligros de un lugar a formato JSON string
 * @param dangers Array de peligros
 * @returns JSON string de peligros
 */
export function serializePlaceDangers(dangers: PlaceDanger[]): string {
  try {
    return JSON.stringify(dangers);
  } catch (error) {
    console.error('Error al serializar los peligros del lugar:', error);
    return JSON.stringify([]);
  }
}

/**
 * Deserializa los peligros de un lugar desde JSON string
 * @param dangersJson JSON string de peligros
 * @returns Array de peligros
 */
export function deserializePlaceDangers(dangersJson: string | null): PlaceDanger[] {
  if (!dangersJson) return [];

  try {
    return JSON.parse(dangersJson) as PlaceDanger[];
  } catch (error) {
    console.error('Error al deserializar los peligros del lugar:', error);
    return [];
  }
}

/**
 * Serializa los recursos de un lugar a formato JSON string
 * @param resources Array de recursos
 * @returns JSON string de recursos
 */
export function serializePlaceResources(resources: PlaceResource[]): string {
  try {
    return JSON.stringify(resources);
  } catch (error) {
    console.error('Error al serializar los recursos del lugar:', error);
    return JSON.stringify([]);
  }
}

/**
 * Deserializa los recursos de un lugar desde JSON string
 * @param resourcesJson JSON string de recursos
 * @returns Array de recursos
 */
export function deserializePlaceResources(resourcesJson: string | null): PlaceResource[] {
  if (!resourcesJson) return [];

  try {
    return JSON.parse(resourcesJson) as PlaceResource[];
  } catch (error) {
    console.error('Error al deserializar los recursos del lugar:', error);
    return [];
  }
}

/**
 * Serializa las estadísticas de un lugar a formato JSON string
 * @param stats Objeto de estadísticas
 * @returns JSON string de estadísticas
 */
export function serializePlaceStats(stats: PlaceStats): string {
  try {
    return JSON.stringify(stats);
  } catch (error) {
    console.error('Error al serializar las estadísticas del lugar:', error);
    return JSON.stringify({});
  }
}

/**
 * Deserializa las estadísticas de un lugar desde JSON string
 * @param statsJson JSON string de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializePlaceStats(statsJson: string | null): PlaceStats {
  if (!statsJson) return {};

  try {
    return JSON.parse(statsJson) as PlaceStats;
  } catch (error) {
    console.error('Error al deserializar las estadísticas del lugar:', error);
    return {};
  }
}

/**
 * Serializa los filtros de un lugar a formato JSON string
 * @param filters Objeto de filtros
 * @returns JSON string de filtros
 */
export function serializePlaceFilters(filters: PlaceFilters): string {
  try {
    return JSON.stringify(filters);
  } catch (error) {
    console.error('Error al serializar los filtros del lugar:', error);
    return JSON.stringify({});
  }
}

/**
 * Deserializa los filtros de un lugar desde JSON string
 * @param filtersJson JSON string de filtros
 * @returns Objeto de filtros
 */
export function deserializePlaceFilters(filtersJson: string | null): PlaceFilters {
  if (!filtersJson) return {};

  try {
    return JSON.parse(filtersJson) as PlaceFilters;
  } catch (error) {
    console.error('Error al deserializar los filtros del lugar:', error);
    return {};
  }
}

/**
 * Parsea los campos JSON de un lugar
 * @param place Objeto base del lugar
 * @returns Lugar con campos JSON parseados
 */
export function parseJsonFields(place: PlaceBase & { _count?: { images?: number; notes?: number; concepts?: number; prompts?: number } }): Place {
  return {
    ...place,
    dangersArray: deserializePlaceDangers(place.dangers),
    resourcesArray: deserializePlaceResources(place.resources),
    statsObject: deserializePlaceStats(place.stats),
    filtersObject: deserializePlaceFilters(place.filters),
    // Inicializar propiedades UI
    isSelected: false,
    isExpanded: false,
    isEditing: false,
    isHighlighted: false,
    // Inicializar conteos
    imagesCount: place._count?.images || 0,
    notesCount: place._count?.notes || 0,
    conceptsCount: place._count?.concepts || 0,
    promptsCount: place._count?.prompts || 0,
    // Datos derivados
    dangerLevel: getDangerLevel(place.dangers),
    displayPopulation: formatPopulation(place.population),
    displaySize: getDisplaySize(place.stats),
    regionPath: getRegionPath(place.region),
  };
}

/**
 * Obtiene el nivel de peligro más alto de un lugar
 * @param dangersJson JSON string de peligros
 * @returns Nivel de peligro más alto
 */
function getDangerLevel(dangersJson: string | null): string {
  const dangers = deserializePlaceDangers(dangersJson);
  if (!dangers.length) return 'unknown';

  // Ordenar por nivel de peligro y tomar el más alto
  const dangerLevels = ['safe', 'low', 'moderate', 'high', 'extreme', 'deadly', 'unknown'];
  let highestLevel = 'unknown';

  dangers.forEach(danger => {
    if (danger.level && dangerLevels.indexOf(danger.level) > dangerLevels.indexOf(highestLevel)) {
      highestLevel = danger.level;
    }
  });

  return highestLevel;
}

/**
 * Formatea la población para mostrar
 * @param population Número de población
 * @returns Población formateada
 */
function formatPopulation(population: number | null): string {
  if (population === null) return 'Desconocida';

  if (population < 1000) return String(population);
  if (population < 1000000) return `${(population / 1000).toFixed(1)}k`;
  return `${(population / 1000000).toFixed(1)}M`;
}

/**
 * Obtiene el tamaño para mostrar desde estadísticas
 * @param statsJson JSON string de estadísticas
 * @returns Tamaño formateado
 */
function getDisplaySize(statsJson: string | null): string {
  const stats = deserializePlaceStats(statsJson);
  return stats.size || 'Desconocido';
}

/**
 * Obtiene la ruta de regiones
 * @param region Cadena de región
 * @returns Array de rutas de región
 */
function getRegionPath(region: string | null): string[] {
  if (!region) return [];
  return region.split('/').filter(Boolean);
}

/**
 * Parsea la configuración visual de lugares
 * @param config Configuración visual de lugares
 * @returns Configuración visual parseada
 */
export function parseVisualConfig(config: PlaceVisualConfig): ParsedPlaceVisualConfig {
  return {
    ...config,
    filtersObject: deserializePlaceFilters(config.filters),
  };
}