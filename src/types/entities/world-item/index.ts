/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

// Exportar desde archivos individuales
export * from './base';
export * from './enums';
export * from './extended';
export * from './stats-types';
export * from './types';

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

// Exportar tipos principales explícitamente
export type {
    CreateWorldItemData,
    UpdateWorldItemData,
    WorldItemBase,
    WorldItemCount,
    WorldItemFilter,
    WorldItemFilters,
    WorldItemValidated,
    WorldItemWithFiles,
    WorldItemWithRelations,
    WorldItemWithStats
} from './types';

// Exportar tipos estadísticos explícitamente
export type {
    WorldItemAttributes,
    WorldItemDistribution,
    WorldItemEffect,
    WorldItemProperty,
    WorldItemRequirement,
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

