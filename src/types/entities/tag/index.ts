/**
 * @file Exportaciones principales de tipos para la entidad Tag.
 * @module types/entities/tag
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Tag.
 *   El tipo canónico para usar en la aplicación es **`TagWithStats`**.
 *
 *   - `TagBase`: Tipo base de Drizzle.
 *   - `TagWithStats`: Tipo enriquecido con estadísticas calculadas.
 *
 * @see /src/types/entities/tag/base.ts
 * @updated 2025-01-27
 */

// --- Enums y constantes del store ---
export { TagCategory } from '@/store/entities/tag/types';
export type {
	TagBase,
	TagComplete,
	TagCreateInput,
	TagStatistics,
	TagUpdateInput,
	TagWithCounts,
	TagWithStats,
} from './base';
// --- Tipos Canónicos (NUEVO) ---
export { TAG_COUNTS_RELATIONS } from './base';
// --- Esquemas de Validación ---
export {
	RelatedTagSchema,
	TagFiltersSchema,
	TagImageRelationSchema,
	TagSchema,
} from './schema';
// --- Tipos adicionales ---
export type { TagPreview } from './types';
// --- Enumeraciones ---
export { TagSortCriteria } from './types';
