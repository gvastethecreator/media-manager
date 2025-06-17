/**
 * @file Exportaciones para la entidad Tag
 * @module types/entities/tag
 */

// Exportar enums
export {
	TagCategory,
	TagRarity,
	TagSortCriteria,
	TagViewMode,
} from './enums';
// Exportar tipos extendidos
export type {
	TagComplete,
	TagExtended,
	TagWithRelationsComplete,
	TagWithRelationsExtended,
	TagWithStats,
} from './extended';
// Exportar tipos base
// Tipo principal recomendado para uso general
export type {
	CreateTagData,
	RelatedTag,
	TagBase,
	TagFilter,
	TagFilters,
	TagFilters,
	TagImageRelationResponse,
	TagValidated,
	TagWithRelations,
	TagWithRelations as Tag,
	UpdateTagData,
} from './types';
// Exportar validaciones
export { TagSchema } from './types';
