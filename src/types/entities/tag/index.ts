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

// --- Tipos Canónicos (NUEVO) ---
export { TAG_COUNTS_RELATIONS, tagCounts } from './base';
export type {
    PrismaTagWithCounts,
    TagBase,
    TagStatistics,
    TagWithStats
} from './base';

// --- Esquemas de Validación ---
export {
    RelatedTagSchema,
    TagFiltersSchema,
    TagImageRelationSchema,
    TagSchema
} from './schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos. Usar `TagWithStats` y otros tipos canónicos desde `base.ts`.
 * @see /src/types/entities/tag/base.ts
 */
/*
export type {
    // Alias para retrocompatibilidad
    CreateTagData,
    PrismaTagWithCounts,
    RelatedTag,
    // Tipos principales
    Tag,
    // Tipos base
    TagBase,
    // Inputs para operaciones
    TagCreateInput,
    // Configuración y filtros
    TagFilters,
    TagImageRelationResponse,
    TagSearchOptions,
    TagSearchResult,
    // Estructuras auxiliares
    TagTransformerOptions,
    TagUpdateInput,
    TagValidated,
    // Tipo principal para uso en la aplicación
    TagWithStats,
    UpdateTagData
} from './types';

export {
    // Enums
    TagCategory,
    TagRarity,
    // Schema de validación
    TagSchema,
    TagSortCriteria,
    TagViewMode
} from './types';
*/
