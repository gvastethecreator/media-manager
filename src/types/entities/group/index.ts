/**
 * @file Exportaciones principales de tipos para la entidad Group.
 * @module types/entities/group
 * @description
 *   Centraliza la exportación del tipo canónico **`GroupWithStats`**.
 *
 *   - `GroupBase`: Tipo base de Prisma.
 *   - `GroupStatistics`: Interfaz para las estadísticas de conteo.
 *   - `GroupWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/group/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos ---
export type { GroupBase, GroupStatistics, GroupWithStats, GroupSortKey } from './base';

// --- Esquemas de Validación ---
export { CreateGroupSchema, UpdateGroupSchema } from './schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos.
 * Usar `GroupWithStats` y otros tipos canónicos desde `base.ts`.
 */
// export * from './types';

export { GroupViewMode } from './base';

