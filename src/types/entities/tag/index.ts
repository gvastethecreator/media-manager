/**
 * @file Exportaciones principales de tipos para la entidad Tag
 * @module types/entities/tag
 */

// Exportar los tipos principales
export type {
    RelatedTag, TagBase, TagComplete, TagCounts, TagCreateInput, TagFilters, TagImageRelationResponse, TagRelations, TagSearchOptions,
    TagSearchResult,
    TagTransformerOptions, TagUpdateInput, TagValidated
} from './types';

// Exportar los enums
export {
    TagCategory,
    TagRarity,
    TagSortCriteria,
    TagViewMode
} from './types';

// Exportar el esquema de validación
export { TagSchema } from './types';

// Exportar esquemas adicionales de validación (si existen)
export * from './schema';

