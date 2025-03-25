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
export {
    type CreateWorldItemData, type UpdateWorldItemData, type WorldItemBase,
    type WorldItemWithRelations
} from './base';

export {
    type ParsedWorldItem, type ParsedWorldItemVisualConfig, type ParsedWorldItemWithRelations, type WorldItem,
    type WorldItemFilters, type WorldItemVisualConfig, type WorldItemVisualConfigUpdateData
} from './extended';
