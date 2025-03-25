/**
 * @file Exportaciones para la entidad WorldItem
 * @module types/entities/world-item
 */

export * from './base';
export * from './enums';
export * from './extended';

// Reexportar enums explícitamente para evitar problemas de importación
export {
    RarityLevel, WorldItemCategory, WorldItemSortCriteria, WorldItemType, WorldItemViewMode
} from './enums';

// Reexportar tipos explícitamente
export type {
    CreateWorldItemData, UpdateWorldItemData, WorldItemBase,
    WorldItemWithRelations
} from './base';

export type {
    ParsedWorldItem, ParsedWorldItemVisualConfig, ParsedWorldItemWithRelations, WorldItem,
    WorldItemFilters, WorldItemVisualConfig, WorldItemVisualConfigUpdateData
} from './extended';
