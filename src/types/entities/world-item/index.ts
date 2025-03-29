/**
 * @file Exportaciones principales de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

export * from './base';
export * from './enums';
export * from './extended';
export * from './world-item-types';

// Alias común para el tipo principal
export type { WorldItemWithRelations as WorldItem } from './world-item-types';

// Reexportar enums explícitamente para evitar problemas de importación
export {
    RarityLevel,
    WorldItemCategory,
    WorldItemSortCriteria,
    WorldItemType,
    WorldItemViewMode
} from './enums';

// Reexportar tipos explícitamente
export type {
    CreateWorldItemData,
    UpdateWorldItemData,
    WorldItemBase,
    WorldItemWithRelations
} from './base';

export type {
    ParsedWorldItem,
    ParsedWorldItemVisualConfig,
    ParsedWorldItemWithRelations,
    WorldItemFilters,
    WorldItemVisualConfig,
    WorldItemVisualConfigUpdateData
} from './extended';

