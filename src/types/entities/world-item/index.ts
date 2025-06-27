/**
 * @file Índice de tipos para la entidad WorldItem
 * @module types/entities/world-item
 * @description Exportaciones centralizadas para WorldItem
 * @updated 2025-06-20
 */

// Exportar tipos base
export * from './base';
// Exportar enumeraciones y constantes
export * from './enums';
// Exportar tipos extendidos (excepto los ya exportados)
export type {
	ParsedWorldItemWithRelations,
	WorldItemExtended,
} from './extended';
// Exportar esquemas
export * from './schema';
// Exportar tipos de stats (estos son los que usaremos para WorldItemEffect, WorldItemProperty, WorldItemRequirement)
export type {
	WorldItemEffect,
	WorldItemProperty,
	WorldItemRequirement,
	WorldItemStats,
} from './stats-types';
// Exportar tipos canónicos desde types.ts (excepto los conflictivos)
export type {
	WorldItemComplete,
	WorldItemCreateInput,
	WorldItemFilters,
	WorldItemRelations,
	WorldItemSearchOptions,
	WorldItemUpdateInput,
} from './types';
