/**
 * @file Exportaciones principales de tipos para la entidad Property.
 * @module types/entities/property
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Property.
 *   El tipo canónico para usar en la aplicación es **`PropertyWithStats`**.
 *
 *   - `PropertyBase`: Tipo base de Drizzle.
 *   - `PropertyWithStats`: Tipo enriquecido con estadísticas calculadas.
 *
 * @see /src/types/entities/property/base.ts
 * @updated 2025-01-27
 */

export type {
	PropertyBase,
	PropertyCreateInput,
	PropertyStatistics,
	PropertyUpdateInput,
	PropertyWithStats,
} from './base';
// --- Tipos Canónicos (NUEVO) ---
export { PROPERTY_COUNTS_RELATIONS, propertyCounts } from './base';

// --- Esquemas de Validación ---
// Asumiendo que `schema.ts` contiene esquemas relevantes como PropertySchema.
// Si no es así, esta línea se puede ajustar.
export * from './schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos. Usar `PropertyWithStats` y otros tipos canónicos desde `base.ts`.
 * @see /src/types/entities/property/base.ts
 */
// export * from './types';

// --- Tipos Complete ---
export type { PropertyComplete, PropertyPreview } from './types';
