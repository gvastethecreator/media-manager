/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

// Exportar tipos canónicos desde types.ts
export type {
    WorldItemAttribute, WorldItemBase, WorldItemComplete,
    WorldItemCounts, WorldItemCreateInput, WorldItemDeserialized,
    WorldItemDeserializedFields, WorldItemEffect, WorldItemFilter,
    WorldItemFilters, WorldItemProperty, WorldItemRelations, WorldItemRequirement, WorldItemSearchOptions, WorldItemStat, WorldItemTags,
    WorldItemUI, WorldItemUpdateInput
} from './types';

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
    WorldItemViewMode
} from './enums';

// Exportar tipos estadísticos explícitamente
export * from './stats-types';
export type {
    WorldItemAttributes,
    WorldItemDistribution,
    WorldItemStats,
    WorldItemStatsOverview
} from './stats-types';

// Exportar tipos extendidos explícitamente
// 🎯 Alias principal para el tipo WorldItem
export type {
    ParsedWorldItem,
    ParsedWorldItemVisualConfig,
    ParsedWorldItemWithRelations, WorldItemExtended as WorldItem, WorldItemExtended, WorldItemVisualConfig
} from './extended';

