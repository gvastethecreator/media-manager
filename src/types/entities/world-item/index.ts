/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

// Exportar tipos de Input desde base.ts para evitar conflictos
export type {
	WorldItemCreateInput,
	WorldItemUpdateInput,
} from './base';
// Exportar enumeraciones y constantes
export * from './enums';
// Exportar enumeraciones explícitamente para mejor claridad
export {
	WORLD_ITEM_SORT_PROPERTY_MAP,
	WorldItemCategory,
	WorldItemRarity,
	WorldItemRelationshipType,
	WorldItemSize,
	WorldItemSortCriteria,
	WorldItemType,
	WorldItemViewMode,
} from './enums';
// Exportar tipos extendidos explícitamente
// 🎯 Alias principal para el tipo WorldItem
export type {
	ParsedWorldItem,
	ParsedWorldItemVisualConfig,
	ParsedWorldItemWithRelations,
	WorldItemExtended,
	WorldItemExtended as WorldItem,
	WorldItemVisualConfig,
} from './extended';
export * from './extended';

// Exportar tipos estadísticos explícitamente
export type {
	WorldItemAttributes,
	WorldItemDistribution,
	WorldItemStats,
	WorldItemStatsOverview,
} from './stats-types';
export * from './stats-types';
// Exportar tipos específicos para evitar conflictos
export type {
	WorldItemAttribute,
	WorldItemBase,
	WorldItemComplete,
	WorldItemCounts,
	WorldItemDeserialized,
	WorldItemDeserializedFields,
	WorldItemEffect,
	WorldItemFilter,
	WorldItemFilters,
	WorldItemProperty,
	WorldItemRelations,
	WorldItemRequirement,
	WorldItemSearchOptions,
	WorldItemStat,
	WorldItemTags,
	WorldItemUI,
} from './types';
