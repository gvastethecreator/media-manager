/**
 * @file Enumeraciones para la entidad WorldItem
 * @module types/entities/world-item/enums
 */

/**
 * Tipos de objetos del mundo
 */
export const WorldItemType = {
	WEAPON: 'weapon',
	ARMOR: 'armor',
	ACCESSORY: 'accessory',
	CONSUMABLE: 'consumable',
	MATERIAL: 'material',
	ARTIFACT: 'artifact',
	RELIC: 'relic',
	KEY_ITEM: 'key_item',
	MISC: 'misc',
} as const;

export type WorldItemType = (typeof WorldItemType)[keyof typeof WorldItemType];

/**
 * Rareza de objetos del mundo
 */
export const WorldItemRarity = {
	COMMON: 'common',
	UNCOMMON: 'uncommon',
	RARE: 'rare',
	EPIC: 'epic',
	LEGENDARY: 'legendary',
	MYTHIC: 'mythic',
	UNIQUE: 'unique',
} as const;

export type WorldItemRarity = (typeof WorldItemRarity)[keyof typeof WorldItemRarity];

/**
 * Niveles de rareza numéricos
 */
export const RarityLevel = {
	COMMON: 1,
	UNCOMMON: 3,
	RARE: 5,
	EPIC: 7,
	LEGENDARY: 9,
	MYTHIC: 10,
} as const;

export type RarityLevel = (typeof RarityLevel)[keyof typeof RarityLevel];

/**
 * Tamaño de objetos del mundo
 */
export const WorldItemSize = {
	TINY: 'tiny',
	SMALL: 'small',
	MEDIUM: 'medium',
	LARGE: 'large',
	HUGE: 'huge',
	GARGANTUAN: 'gargantuan',
} as const;

export type WorldItemSize = (typeof WorldItemSize)[keyof typeof WorldItemSize];

/**
 * Categorías de objetos del mundo
 */
export const WorldItemCategory = {
	EQUIPMENT: 'equipment',
	QUEST: 'quest',
	CRAFTING: 'crafting',
	LORE: 'lore',
	COLLECTIBLE: 'collectible',
	UTILITY: 'utility',
	MAGICAL: 'magical',
	TECHNOLOGICAL: 'technological',
	GENERAL: 'general',
} as const;

export type WorldItemCategory = (typeof WorldItemCategory)[keyof typeof WorldItemCategory];

/**
 * Criterios de ordenación para objetos del mundo
 */
export const WorldItemSortCriteria = {
	NAME_ASC: 'name:asc',
	NAME_DESC: 'name:desc',
	TYPE_ASC: 'type:asc',
	TYPE_DESC: 'type:desc',
	RARITY_ASC: 'rarity:asc',
	RARITY_DESC: 'rarity:desc',
	CREATED_ASC: 'created:asc',
	CREATED_DESC: 'created:desc',
	UPDATED_ASC: 'updated:asc',
	UPDATED_DESC: 'updated:desc',
} as const;

export type WorldItemSortCriteria = (typeof WorldItemSortCriteria)[keyof typeof WorldItemSortCriteria];

/**
 * Modos de visualización para objetos del mundo
 */
export const WorldItemViewMode = {
	GRID: 'grid',
	LIST: 'list',
	TABLE: 'table',
	CARD: 'card',
	DETAIL: 'detail',
} as const;

export type WorldItemViewMode = (typeof WorldItemViewMode)[keyof typeof WorldItemViewMode];

/**
 * Tipos de relaciones entre objetos del mundo y otras entidades
 */
export const WorldItemRelationshipType = {
	CONTAINS: 'contains',
	PART_OF: 'part_of',
	CRAFTS_INTO: 'crafts_into',
	CRAFTED_FROM: 'crafted_from',
	UPGRADES_TO: 'upgrades_to',
	UPGRADED_FROM: 'upgraded_from',
	RELATED: 'related',
} as const;

export type WorldItemRelationshipType = (typeof WorldItemRelationshipType)[keyof typeof WorldItemRelationshipType];

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
