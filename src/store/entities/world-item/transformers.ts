/**
 * @file Transformadores para la entidad WorldItem
 * @module store/entities/world-item/transformers
 */

import type { CreateWorldItemData, ParsedWorldItemVisualConfig, UpdateWorldItemData, WorldItem, WorldItemFilters } from '../../../types/entities/world-item';
import { generateWorldItemId, parseWorldItemStats } from './utils';

/**
 * Transforma los datos para crear un objeto del mundo en una entidad completa
 * @param data Datos para crear el objeto
 * @returns Objeto del mundo
 */
export const createWorldItemFromData = (data: CreateWorldItemData): WorldItem => {
  const now = new Date();

  return {
    id: generateWorldItemId(),
    name: data.name,
    emoji: data.emoji || '🏺',
    color: data.color || '#6b7280',
    description: data.description || null,
    shortcut: data.shortcut || null,
    type: data.type || 'misc',
    rarity: data.rarity || 'common',
    properties: data.properties || '{}',
    requirements: data.requirements || '{}',
    origin: data.origin || 'unknown',
    stats: data.stats || '{}',
    sortBy: data.sortBy || 'name_asc',
    filters: data.filters || '{}',
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
    category: data.category || null,
    createdAt: now,
    updatedAt: now,

    // Contadores de relaciones
    imagesCount: 0,
    notesCount: 0,
    conceptsCount: 0,
    promptsCount: 0,

    // Estado UI
    isSelected: false,
    isExpanded: false,
    isEditing: false,
    isHighlighted: false
  };
};

/**
 * Aplica actualizaciones parciales a un objeto del mundo
 * @param item Objeto del mundo original
 * @param updates Actualizaciones a aplicar
 * @returns Objeto actualizado
 */
export const updateWorldItem = (item: WorldItem, updates: Partial<WorldItem> | UpdateWorldItemData): WorldItem => {
  return {
    ...item,
    ...updates,
    updatedAt: new Date()
  };
};

/**
 * Analiza la configuración visual desde formato JSON
 * @param configJson Configuración visual en formato JSON
 * @returns Configuración analizada
 */
export const parseVisualConfig = (configJson: string): ParsedWorldItemVisualConfig => {
  try {
    const parsed = JSON.parse(configJson);

    return {
      view: parsed.view || 'grid',
      sortBy: parsed.sortBy || 'name_asc',
      filters: parsed.filters || {},
      lastViewedWorldItemId: parsed.lastViewedWorldItemId || null,
      expandedWorldItemIds: parsed.expandedWorldItemIds || [],
      selectedWorldItemIds: parsed.selectedWorldItemIds || []
    };
  } catch (error) {
    return {
      view: 'grid',
      sortBy: 'name_asc',
      filters: {},
      lastViewedWorldItemId: null,
      expandedWorldItemIds: [],
      selectedWorldItemIds: []
    };
  }
};

/**
 * Convierte la configuración visual a formato JSON
 * @param config Configuración visual
 * @returns Configuración en formato JSON
 */
export const stringifyVisualConfig = (config: ParsedWorldItemVisualConfig): string => {
  try {
    return JSON.stringify(config);
  } catch (error) {
    return '{}';
  }
};

/**
 * Procesa un objeto para su visualización, añadiendo propiedades derivadas
 * @param item Objeto del mundo
 * @returns Objeto del mundo procesado
 */
export const processWorldItem = (item: WorldItem): WorldItem => {
  const stats = parseWorldItemStats(item.stats);
  const level = stats.level || 0;
  const value = stats.value || 0;

  // Clases CSS según rareza
  const rarityClass = `rarity-${item.rarity.toLowerCase()}`;

  // Formato de valores para visualización
  const displayLevel = level ? `Nivel ${level}` : '';
  const displayValue = value ? `${value} monedas` : '';

  // Formatear nombre de rareza
  const displayRarity = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);

  return {
    ...item,
    displayRarity,
    displayValue,
    displayLevel,
    rarityClass
  };
};

/**
 * Procesa una lista de objetos del mundo para su visualización
 * @param items Lista de objetos del mundo
 * @returns Lista procesada
 */
export const processWorldItems = (items: WorldItem[]): WorldItem[] => {
  return items.map(processWorldItem);
};

/**
 * Convierte filtros de entidad UI a formato para API
 * @param filters Filtros UI
 * @returns Filtros para API
 */
export const convertFiltersToApiParams = (filters: WorldItemFilters): Record<string, string> => {
  const params: Record<string, string> = {};

  // Convertir arrays a strings separados por comas
  if (filters.types && filters.types.length > 0) {
    params.types = filters.types.join(',');
  }

  if (filters.categories && filters.categories.length > 0) {
    params.categories = filters.categories.join(',');
  }

  if (filters.rarities && filters.rarities.length > 0) {
    params.rarities = filters.rarities.join(',');
  }

  // Convertir booleanos y números
  if (filters.onlyFavorites) {
    params.isFavorite = 'true';
  }

  if (typeof filters.minLevel === 'number') {
    params.minLevel = filters.minLevel.toString();
  }

  if (typeof filters.maxLevel === 'number') {
    params.maxLevel = filters.maxLevel.toString();
  }

  if (typeof filters.minValue === 'number') {
    params.minValue = filters.minValue.toString();
  }

  if (typeof filters.maxValue === 'number') {
    params.maxValue = filters.maxValue.toString();
  }

  // Filtros de relaciones
  if (filters.hasImages) {
    params.hasImages = 'true';
  }

  if (filters.hasNotes) {
    params.hasNotes = 'true';
  }

  if (filters.hasConcepts) {
    params.hasConcepts = 'true';
  }

  if (filters.hasPrompts) {
    params.hasPrompts = 'true';
  }

  return params;
};