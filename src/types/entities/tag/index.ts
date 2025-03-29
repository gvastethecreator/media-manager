/**
 * @file Exportaciones para la entidad Tag
 * @module types/entities/tag
 */

export * from './enums';
export * from './extended';
export * from './types';

// Reexportar enums explícitamente para evitar problemas de importación
export {
  TagCategory,
  TagRarity,
  TagSortCriteria,
  TagViewMode
} from './enums';

// Reexportar tipos explícitamente
export type {
  CreateTagData,
  RelatedTag,
  TagBase,
  // Nuevos tipos extendidos
  TagComplete, TagExtended, TagFilters,
  TagImageRelationResponse, TagWithRelations, TagWithRelationsComplete, TagWithRelationsExtended, TagWithStats,
  UpdateTagData
} from './types';

// Alias común para el tipo principal - usando el tipo extendido para mantener consistencia
export type { TagWithRelationsExtended as Tag } from './extended';

