/**
 * @file Exportaciones para la entidad Tag
 * @module types/entities/tag
 */

export * from './enums';
export * from './types';

// Reexportar enums explícitamente para evitar problemas de importación
export {
	TagCategory,
	TagRarity,
	TagSortCriteria,
	TagViewMode,
} from './enums';

// Reexportar tipos explícitamente
export type {
	CreateTagData,
	RelatedTag,
	Tag,
	TagBase,
	TagFilters,
	TagImageRelationResponse,
	TagWithStats,
	UpdateTagData,
} from './types';
