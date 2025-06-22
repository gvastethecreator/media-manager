/**
 * @file Exportaciones principales de tipos para la entidad Collection.
 * @module types/entities/collection
 * @description
 *   Centraliza la exportación del tipo canónico **`CollectionWithStats`**.
 *
 *   - `CollectionBase`: Tipo base de Prisma.
 *   - `CollectionStatistics`: Interfaz para las estadísticas de conteo.
 *   - `CollectionWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/collection/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos ---
export type { CollectionBase, CollectionStatistics, CollectionWithStats } from './base';

// --- Esquemas de Validación (si existen) ---
// export { CollectionCreateSchema, CollectionUpdateSchema } from './schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos.
 * Usar `CollectionWithStats` y otros tipos canónicos desde `base.ts`.
 */
// export * from './types';
// export * from './enums';
