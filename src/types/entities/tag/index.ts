/**
 * @file Exportaciones principales de tipos para la entidad Tag.
 * @module types/entities/tag
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Tag.
 *   El tipo canónico para usar en la aplicación es **`TagWithStats`**.
 *
 *   - `TagBase`: Tipo base de Prisma.
 *   - `TagWithStats`: Tipo enriquecido con estadísticas calculadas.
 *   - `PrismaTagWithCounts`: Tipo de Prisma que incluye los conteos de relaciones.
 *
 * @see /src/types/entities/tag/base.ts
 * @updated 2025-01-27
 */

export type {
    PrismaTagWithCounts,
    TagBase,
    TagStatistics,
    TagWithStats
} from './base';
// --- Tipos Canónicos (NUEVO) ---
export { TAG_COUNTS_RELATIONS, tagCounts } from './base';

// --- Esquemas de Validación ---
export {
    RelatedTagSchema,
    TagFiltersSchema,
    TagImageRelationSchema,
    TagSchema
} from './schema';

// --- Enums y Constantes ---
export {
    TAG_SORT_PROPERTY_MAP,
    TagSortCriteria,
    TagViewMode
} from './types';

