/**
 * @file Exportaciones para la entidad Tag
 * @module types/entities/tag
 */

// Exportar enums
export {
    TagCategory,
    TagRarity,
    TagSortCriteria,
    TagViewMode
} from './enums';

// Exportar tipos base
export type {
    CreateTagData, RelatedTag, TagBase, TagFilters, TagImageRelationResponse, TagWithRelations, UpdateTagData
} from './types';

// Exportar validaciones
export { TagSchema } from './types';
export type { TagFilters } from './types';

export type {
    TagFilter,
    TagValidated
} from './types';

// Exportar tipos extendidos
export type {
    TagComplete,
    TagExtended,
    TagWithRelationsComplete,
    TagWithRelationsExtended,
    TagWithStats
} from './extended';

// Tipo principal recomendado para uso general
export type { TagWithRelations as Tag } from './types';

