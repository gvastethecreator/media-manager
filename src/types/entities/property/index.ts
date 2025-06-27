/**
 * @file Exportaciones principales de tipos para la entidad Property.
 * @module types/entities/property
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Property.
 *   El tipo canónico para usar en la aplicación es **`PropertyWithStats`**.
 *
 *   - `PropertyBase`: Tipo base de Prisma.
 *   - `PropertyWithStats`: Tipo enriquecido con estadísticas calculadas.
 *   - `PrismaPropertyWithCounts`: Tipo de Prisma que incluye los conteos de relaciones.
 *
 * @see /src/types/entities/property/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos (NUEVO) ---
export { PROPERTY_COUNTS_RELATIONS, propertyCounts } from './base';
export type {
	PrismaPropertyWithCounts,
	PropertyBase,
	PropertyStatistics,
	PropertyWithStats,
} from './base';

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
