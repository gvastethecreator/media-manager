/**
 * @file Exportaciones de tipos para la entidad Place
 * @module types/entities/place
 * @description Centralizador de exportaciones para todos los tipos relacionados con la entidad Place.
 *              Unifica los tipos base generados y los tipos legacy para una migración progresiva.
 */

// --- 🏗️ Tipos Base y Estadísticas (Nuevo Patrón) ---
// Estos son los tipos canónicos que se deben usar en toda la aplicación nueva.
export type {
	PlaceBase,
	PlaceCreateInput,
	PlacePreview,
	PlaceStatistics,
	PlaceUpdateInput,
	PlaceWithStats,
} from './base';

// --- 📚 Tipos Adicionales ---
export type { PlaceFilters, PlaceSearchOptions } from './types';

// --- 💀 Tipos Legacy (Obsoletos) ---
// @deprecated Estos tipos se mantienen por retrocompatibilidad y serán eliminados.
//             No usar en nuevo código. Refactorizar el código existente para usar PlaceWithStats.
// export type {
// 	PlaceComplete,
// 	PlaceDanger,
// 	PlaceListItem,
// 	PlaceResource,
// 	PlaceSearchOptions,
// 	PlaceStats,
// } from './types';

// --- Tipos Complete ---
export type { PlaceComplete } from './types';
// --- 🎨 Enums (Se Mueven a su Propio Archivo) ---
// TODO: Mover estos enums a un archivo `enums.ts` dedicado.
export {
	PlaceCategory,
	PlaceSortCriteria,
	PlaceType,
	PlaceViewMode,
} from './types';
