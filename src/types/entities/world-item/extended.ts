/**
 * @file Tipos extendidos para la entidad WorldItem
 * @module types/entities/world-item/extended
 */

import { WorldItemBase, WorldItemWithRelations } from './base';
import {
    WorldItemProperty,
    WorldItemRequirement,
    WorldItemStats
} from './enums';

/**
 * Filtros para la búsqueda de objetos del mundo
 */
export interface WorldItemFilters {
  searchQuery?: string;
  categories?: string[];
  types?: string[];
  rarities?: string[];
  minLevel?: number;
  maxLevel?: number;
  minValue?: number;
  maxValue?: number;
  onlyFavorites?: boolean;
  hasImages?: boolean;
  hasNotes?: boolean;
  hasConcepts?: boolean;
  hasPrompts?: boolean;
}

/**
 * Datos de objeto del mundo con campos parseados
 */
export interface ParsedWorldItem extends WorldItemBase {
  propertiesArray: WorldItemProperty[];
  requirementsObject: Record<string, WorldItemRequirement>;
  statsObject: WorldItemStats;
  filtersObject: WorldItemFilters;
}

/**
 * Datos completos de objeto del mundo con relaciones y campos parseados
 */
export interface ParsedWorldItemWithRelations extends WorldItemWithRelations, ParsedWorldItem {}

/**
 * Entidad WorldItem extendida con propiedades de UI
 */
export interface WorldItem extends ParsedWorldItemWithRelations {
  // Propiedades de UI
  isSelected?: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  isHighlighted?: boolean;

  // Cache de relaciones
  imagesCount?: number;
  notesCount?: number;
  conceptsCount?: number;
  promptsCount?: number;

  // Datos derivados
  displayRarity?: string;
  displayValue?: string;
  displayLevel?: string;
  rarityClass?: string;
}

/**
 * Datos para actualizar configuración visual del objeto del mundo
 */
export interface WorldItemVisualConfigUpdateData {
  view?: string;
  sortBy?: string;
  filters?: WorldItemFilters;
  lastViewedWorldItemId?: string | null;
  expandedWorldItemIds?: string[];
  selectedWorldItemIds?: string[];
}

/**
 * Configuración visual para la entidad WorldItem
 */
export interface WorldItemVisualConfig {
  id: string;
  userId: string;
  view: string;
  sortBy: string;
  filters: string;
  lastViewedWorldItemId: string | null;
  expandedWorldItemIds: string[];
  selectedWorldItemIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuración visual parseada para la entidad WorldItem
 */
export interface ParsedWorldItemVisualConfig extends Omit<WorldItemVisualConfig, 'filters'> {
  filtersObject: WorldItemFilters;
}