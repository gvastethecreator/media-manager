/**
 * @file Enumeraciones y constantes para la entidad WorldItem
 * @module types/entities/world-item/enums
 */

/**
 * Tipos de objetos del mundo
 */
export enum WorldItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  POTION = 'potion',
  SCROLL = 'scroll',
  ARTIFACT = 'artifact',
  RELIC = 'relic',
  TECHNOLOGY = 'technology',
  BOOK = 'book',
  KEY = 'key',
  CURRENCY = 'currency',
  TOOL = 'tool',
  CONTAINER = 'container',
  CLOTHING = 'clothing',
  FOOD = 'food',
  CRAFTING = 'crafting',
  QUEST = 'quest',
  MISC = 'misc'
}

/**
 * Categorías de objetos del mundo
 */
export enum WorldItemCategory {
  COMBAT = 'combat',
  MAGIC = 'magic',
  TECHNOLOGY = 'technology',
  UTILITY = 'utility',
  DECORATION = 'decoration',
  SURVIVAL = 'survival',
  TRANSPORTATION = 'transportation',
  QUEST = 'quest',
  LORE = 'lore',
  OTHER = 'other'
}

/**
 * Niveles de rareza para objetos
 */
export enum RarityLevel {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  UNIQUE = 'unique',
  ARTIFACT = 'artifact'
}

/**
 * Criterios de ordenación para objetos del mundo
 */
export enum WorldItemSortCriteria {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  CREATED_ASC = 'created_asc',
  CREATED_DESC = 'created_desc',
  UPDATED_ASC = 'updated_asc',
  UPDATED_DESC = 'updated_desc',
  TYPE_ASC = 'type_asc',
  TYPE_DESC = 'type_desc',
  RARITY_ASC = 'rarity_asc',
  RARITY_DESC = 'rarity_desc'
}

/**
 * Modos de visualización para objetos del mundo
 */
export enum WorldItemViewMode {
  LIST = 'list',
  GRID = 'grid',
  TABLE = 'table',
  CARDS = 'cards'
}

/**
 * Estructura de una propiedad de objeto
 */
export interface WorldItemProperty {
  name: string;
  value: string | number;
  description?: string;
  icon?: string;
}

/**
 * Estructura para requisitos de uso
 */
export interface WorldItemRequirement {
  type: string; // skill, stat, level, item, quest, etc.
  name: string;
  value: string | number;
  description?: string;
}

/**
 * Estructura para las estadísticas de un objeto
 */
export interface WorldItemStats {
  damage?: number;
  defense?: number;
  durability?: number;
  weight?: number;
  value?: number;
  level?: number;
  power?: number;
  range?: number;
  accuracy?: number;
  speed?: number;
  effects?: Array<{
    name: string;
    description: string;
    duration?: number;
    potency?: number;
  }>;
  customStats?: Record<string, string | number>;
}

/**
 * Nombres de propiedades para ordenación
 */
export const WORLD_ITEM_SORT_PROPERTY_MAP: Record<WorldItemSortCriteria, string> = {
  [WorldItemSortCriteria.NAME_ASC]: 'name',
  [WorldItemSortCriteria.NAME_DESC]: 'name',
  [WorldItemSortCriteria.CREATED_ASC]: 'createdAt',
  [WorldItemSortCriteria.CREATED_DESC]: 'createdAt',
  [WorldItemSortCriteria.UPDATED_ASC]: 'updatedAt',
  [WorldItemSortCriteria.UPDATED_DESC]: 'updatedAt',
  [WorldItemSortCriteria.TYPE_ASC]: 'type',
  [WorldItemSortCriteria.TYPE_DESC]: 'type',
  [WorldItemSortCriteria.RARITY_ASC]: 'rarity',
  [WorldItemSortCriteria.RARITY_DESC]: 'rarity'
};