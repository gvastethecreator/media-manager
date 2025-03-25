/**
 * @file Mapeadores para la entidad Place
 * @module transformers/place/mappers
 */

import {
    type CreatePlaceData,
    type Place,
    type PlaceBase,
    type PlaceVisualConfig,
    type PlaceVisualConfigUpdateData,
    type UpdatePlaceData,
    PlaceCategory,
    PlaceType
} from '../../types/entities/place';
import {
    parseJsonFields,
    parseVisualConfig,
    serializePlaceFilters
} from './serializers';

/**
 * Genera un color aleatorio para un lugar basado en su nombre y categoría
 * @param name Nombre del lugar
 * @param category Categoría opcional
 * @returns Color hexadecimal
 */
export function generatePlaceColor(name: string, category?: string | null): string {
  // Colores predeterminados por categoría
  const categoryColors: Record<string, string> = {
    [PlaceCategory.SETTLEMENT]: '#3b82f6', // Azul
    [PlaceCategory.LANDSCAPE]: '#10b981', // Verde
    [PlaceCategory.STRUCTURE]: '#6366f1', // Índigo
    [PlaceCategory.BIOME]: '#84cc16', // Lima
    [PlaceCategory.UNDERGROUND]: '#7c3aed', // Violeta
    [PlaceCategory.MYTHICAL]: '#ec4899', // Rosa
    [PlaceCategory.HISTORICAL]: '#f59e0b', // Ámbar
    [PlaceCategory.OTHER]: '#64748b', // Gris azulado
  };

  // Si hay una categoría válida, usar su color
  if (category && categoryColors[category]) {
    return categoryColors[category];
  }

  // Si no hay categoría, generar un color basado en el nombre
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const saturation = 65 + (hash % 20);
  const lightness = 45 + (hash % 10);

  // Convertir HSL a hexadecimal
  return hslToHex(hue, saturation, lightness);
}

/**
 * Genera un emoji para un lugar basado en su tipo y nombre
 * @param name Nombre del lugar
 * @param type Tipo de lugar opcional
 * @returns Emoji representativo
 */
export function generatePlaceEmoji(name: string, type?: string | null): string {
  // Emojis por tipo de lugar
  const typeEmojis: Record<string, string> = {
    [PlaceType.CITY]: '🏙️',
    [PlaceType.TOWN]: '🏘️',
    [PlaceType.VILLAGE]: '🏡',
    [PlaceType.RUIN]: '🏚️',
    [PlaceType.CASTLE]: '🏰',
    [PlaceType.FORTRESS]: '🗿',
    [PlaceType.DUNGEON]: '🔒',
    [PlaceType.CAVE]: '🕳️',
    [PlaceType.FOREST]: '🌲',
    [PlaceType.MOUNTAIN]: '⛰️',
    [PlaceType.VALLEY]: '🏞️',
    [PlaceType.ISLAND]: '🏝️',
    [PlaceType.LAKE]: '🌊',
    [PlaceType.RIVER]: '🌊',
    [PlaceType.OCEAN]: '🌊',
    [PlaceType.DESERT]: '🏜️',
    [PlaceType.TUNDRA]: '❄️',
    [PlaceType.JUNGLE]: '🌴',
    [PlaceType.SWAMP]: '🦟',
    [PlaceType.OTHER]: '📍',
  };

  // Si hay un tipo válido, usar su emoji
  if (type && typeEmojis[type]) {
    return typeEmojis[type];
  }

  // Si no hay tipo, seleccionar un emoji basado en el nombre
  const commonWords = ['city', 'town', 'village', 'castle', 'forest', 'mountain', 'island', 'lake', 'river', 'desert'];
  const lowerName = name.toLowerCase();

  for (const word of commonWords) {
    if (lowerName.includes(word)) {
      const matchingType = Object.keys(typeEmojis).find(
        type => type.toLowerCase() === word
      );
      if (matchingType) {
        return typeEmojis[matchingType];
      }
    }
  }

  // Emoji por defecto si no hay coincidencias
  return '📍';
}

/**
 * Convierte HSL a color hexadecimal
 * @param h Tono (0-360)
 * @param s Saturación (0-100)
 * @param l Luminosidad (0-100)
 * @returns Color hexadecimal
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Extiende un objeto Place con propiedades adicionales
 * @param place Objeto de lugar base
 * @returns Lugar extendido
 */
export function extendPlace(place: PlaceBase): Place {
  return parseJsonFields(place);
}

/**
 * Extiende una lista de lugares con propiedades adicionales
 * @param places Lista de lugares
 * @returns Lista de lugares extendidos
 */
export function extendPlaces(places: PlaceBase[]): Place[] {
  return places.map(place => extendPlace(place));
}

/**
 * Prepara datos para crear un lugar
 * @param data Datos para crear un lugar
 * @returns Datos preparados para la base de datos
 */
export function prepareCreatePlaceData(data: CreatePlaceData): Record<string, any> {
  const emoji = data.emoji || generatePlaceEmoji(data.name, data.type);
  const color = data.color || generatePlaceColor(data.name, data.category);

  return {
    name: data.name,
    emoji,
    color,
    description: data.description || null,
    shortcut: data.shortcut || null,
    region: data.region || null,
    type: data.type || null,
    climate: data.climate || null,
    population: data.population || null,
    government: data.government || null,
    dangers: data.dangers || null,
    resources: data.resources || null,
    lore: data.lore || null,
    history: data.history || null,
    stats: data.stats || null,
    sortBy: data.sortBy || null,
    filters: data.filters || null,
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
    category: data.category || null,
  };
}

/**
 * Prepara datos para actualizar un lugar
 * @param data Datos para actualizar un lugar
 * @returns Datos preparados para la base de datos
 */
export function prepareUpdatePlaceData(data: UpdatePlaceData): Record<string, any> {
  const updateData: Record<string, any> = {};

  // Copiar solo propiedades definidas
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  return updateData;
}

/**
 * Prepara datos para actualizar configuración visual
 * @param data Datos para actualizar
 * @returns Datos preparados para la base de datos
 */
export function prepareVisualConfigUpdateData(data: PlaceVisualConfigUpdateData): Record<string, any> {
  const updateData: Record<string, any> = {};

  // Mapear y formatear propiedades
  if (data.view !== undefined) updateData.view = data.view;
  if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
  if (data.lastViewedPlaceId !== undefined) updateData.lastViewedPlaceId = data.lastViewedPlaceId;
  if (data.expandedPlaceIds !== undefined) updateData.expandedPlaceIds = data.expandedPlaceIds;
  if (data.selectedPlaceIds !== undefined) updateData.selectedPlaceIds = data.selectedPlaceIds;

  // Serializar filtros si existen
  if (data.filters !== undefined) {
    updateData.filters = serializePlaceFilters(data.filters);
  }

  return updateData;
}

/**
 * Parsea una configuración visual
 * @param config Configuración visual
 * @returns Configuración visual parseada
 */
export function mapVisualConfig(config: PlaceVisualConfig) {
  return parseVisualConfig(config);
}