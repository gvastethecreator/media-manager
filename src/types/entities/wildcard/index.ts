/**
 * @file Exportaciones de tipos para la entidad Wildcard.
 * @module types/entities/wildcard
 * @description Centraliza la exportación de tipos canónicos, esquemas de validación y
 *              tipos legacy para una migración progresiva.
 */

// --- 🏗️ Tipos Base y Estadísticas (Nuevo Patrón) ---
// Tipos canónicos que deben usarse en toda la aplicación nueva.
export type {
    PrismaWildcardWithCounts,
    WildcardBase,
    WildcardCreateInput,
    WildcardPreview,
    WildcardStatistics,
    WildcardUpdateInput,
    WildcardWithStats
} from './base';

// --- 🛡️ Esquemas de Validación (Zod) ---
// Esquemas para validación de datos en runtime.
export {
    CreateWildcardSchema,
    UpdateWildcardSchema,
    WildcardFiltersSchema,
    WildcardRelationsSchema,
    WildcardSchema,
    WildcardStatsSchema
} from './schema';

// --- 💀 Tipos Legacy (Obsoletos) ---
// @deprecated Estos tipos se mantienen por retrocompatibilidad y serán eliminados.
//             No usar en código nuevo. Refactorizar para usar WildcardWithStats.
export type {
    WildcardComplete,
    WildcardSearchOptions
} from './types';

// --- 🎨 Enums y Constantes (a Mover) ---
// TODO: Mover a un archivo `enums.ts` dedicado.
export {
    WILDCARD_SORT_PROPERTY_MAP,
    WildcardSortCriteria,
    WildcardViewMode
} from './types';

