/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 * @description Exportaciones centralizadas para WorldItem
 * @updated 2025-06-20
 */

// Exportar todos los tipos canónicos
export * from './types';

// Exportar enumeraciones y constantes
export * from './enums';

// Exportar tipos estadísticos
export * from './stats-types';

// Re-exportación explícita para compatibilidad con código existente
// Tipo principal para WorldItem (alias)
export type { WorldItemDeserialized as WorldItem } from './types';

// Configuración visual (para compatibilidad)
export interface WorldItemVisualConfig {
  view: string;
  sortBy: string;
  filters: string;
  lastViewedId: string | null;
  expandedIds: string[];
  selectedIds: string[];
}

export interface ParsedWorldItemVisualConfig {
  view: string;
  sortBy: string;
  filters: Record<string, unknown>;
  lastViewedId: string | null;
  expandedIds: string[];
  selectedIds: string[];
}

// Exportar tipos extendidos explícitamente
// 🎯 Alias principal para el tipo WorldItem
export type {
    ParsedWorldItem,
    ParsedWorldItemWithRelations, WorldItemExtended , WorldItemVisualConfig
} from './extended';

