/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

// Exportar enumeraciones y constantes
export * from './enums';
export * from './extended';
export * from './stats-types';

// Exportar tipos específicos para evitar conflictos
export type {
    WorldItemAttribute, WorldItemBase, WorldItemComplete, WorldItemCounts, WorldItemDeserialized,
    WorldItemDeserializedFields, WorldItemEffect, WorldItemFilter, WorldItemFilters, WorldItemProperty, WorldItemRelations, WorldItemRequirement, WorldItemSearchOptions, WorldItemStat, WorldItemTags, WorldItemUI
} from './types';

// Exportar tipos de Input desde base.ts para evitar conflictos
export type {
    WorldItemCreateInput,
    WorldItemUpdateInput
} from './base';

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
export type {
    WorldItemAttributes,
    WorldItemDistribution,
    WorldItemStats,
    WorldItemStatsOverview
} from './stats-types';

// Exportar tipos extendidos explícitamente
export type {
    ParsedWorldItem,
    ParsedWorldItemVisualConfig,
    ParsedWorldItemWithRelations,
    WorldItemExtended,
    WorldItemVisualConfig
} from './extended';

// 🎯 Alias principal para el tipo WorldItem
export type { WorldItemExtended as WorldItem } from './extended';

