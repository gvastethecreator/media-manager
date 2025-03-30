/**
 * @file Enumeraciones para la entidad WorldItem
 * @module types/entities/world-item/enums
 */

/**
 * Tipos de objetos del mundo
 */
export enum WorldItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  ARTIFACT = 'artifact',
  RELIC = 'relic',
  KEY_ITEM = 'key_item',
  MISC = 'misc',
}

/**
 * Rareza de objetos del mundo
 */
export enum WorldItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  UNIQUE = 'unique',
}

/**
 * Niveles de rareza numéricos
 */
export enum RarityLevel {
  COMMON = 1,
  UNCOMMON = 3,
  RARE = 5,
  EPIC = 7,
  LEGENDARY = 9,
  MYTHIC = 10
}

/**
 * Tamaño de objetos del mundo
 */
export enum WorldItemSize {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  HUGE = 'huge',
  GARGANTUAN = 'gargantuan',
}

/**
 * Categorías de objetos del mundo
 */
export enum WorldItemCategory {
  EQUIPMENT = 'equipment',
  QUEST = 'quest',
  CRAFTING = 'crafting',
  LORE = 'lore',
  COLLECTIBLE = 'collectible',
  UTILITY = 'utility',
  MAGICAL = 'magical',
  TECHNOLOGICAL = 'technological',
  GENERAL = 'general',
}

/**
 * Criterios de ordenación para objetos del mundo
 */
export enum WorldItemSortCriteria {
  NAME_ASC = 'name:asc',
  NAME_DESC = 'name:desc',
  TYPE_ASC = 'type:asc',
  TYPE_DESC = 'type:desc',
  RARITY_ASC = 'rarity:asc',
  RARITY_DESC = 'rarity:desc',
  CREATED_ASC = 'created:asc',
  CREATED_DESC = 'created:desc',
  UPDATED_ASC = 'updated:asc',
  UPDATED_DESC = 'updated:desc',
}

/**
 * Modos de visualización para objetos del mundo
 */
export enum WorldItemViewMode {
  GRID = 'grid',
  LIST = 'list',
  TABLE = 'table',
  CARD = 'card',
  DETAIL = 'detail',
}

/**
 * Tipos de relaciones entre objetos del mundo y otras entidades
 */
export enum WorldItemRelationshipType {
  CONTAINS = 'contains',
  PART_OF = 'part_of',
  CRAFTS_INTO = 'crafts_into',
  CRAFTED_FROM = 'crafted_from',
  UPGRADES_TO = 'upgrades_to',
  UPGRADED_FROM = 'upgraded_from',
  RELATED = 'related',
}

/**
 * Mapa de propiedades para ordenación
 */
export const WORLD_ITEM_SORT_PROPERTY_MAP: Record<WorldItemSortCriteria, string> = {
  [WorldItemSortCriteria.NAME_ASC]: 'name',
  [WorldItemSortCriteria.NAME_DESC]: 'name',
  [WorldItemSortCriteria.TYPE_ASC]: 'type',
  [WorldItemSortCriteria.TYPE_DESC]: 'type',
  [WorldItemSortCriteria.RARITY_ASC]: 'rarity',
  [WorldItemSortCriteria.RARITY_DESC]: 'rarity',
  [WorldItemSortCriteria.CREATED_ASC]: 'createdAt',
  [WorldItemSortCriteria.CREATED_DESC]: 'createdAt',
  [WorldItemSortCriteria.UPDATED_ASC]: 'updatedAt',
  [WorldItemSortCriteria.UPDATED_DESC]: 'updatedAt',
};
