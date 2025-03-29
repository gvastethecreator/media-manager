/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 */

// Exportar desde archivo base
export * from './types';
export * from './world-item-extended-types';
export * from './world-item-stats-types';

// Exportar desde enumeraciones
export {
  WorldItemCategory,
  WorldItemRarity,
  WorldItemRelationshipType,
  WorldItemSize,
  WorldItemSortCriteria,
  WorldItemType,
  WorldItemViewMode
} from './enums';

// Exportar desde definiciones extendidas
export type {
  ParsedWorldItem,
  ParsedWorldItemWithRelations,
  WorldItemFilters
} from './extended';

// Exportar tipo principal
export type { WorldItem } from './extended';

