/**
 * Categorías disponibles para conceptos
 */
export enum ConceptCategory {
  GENERAL = 'general',
  STORYLINE = 'storyline',
  WORLDBUILDING = 'worldbuilding',
  CHARACTER_DEVELOPMENT = 'character_development',
  SETTING = 'setting',
  THEME = 'theme',
  PLOT = 'plot',
  LORE = 'lore',
  MECHANICS = 'mechanics',
  OTHER = 'other',
}

/**
 * Estado de un concepto
 */
export enum ConceptStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Tipo de vista para los conceptos
 */
export enum ConceptViewMode {
  GRID = 'grid',
  LIST = 'list',
  COMPACT = 'compact',
  DETAILED = 'detailed',
}

/**
 * Opciones de ordenación para conceptos
 */
export type ConceptSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_asc'
  | 'created_desc'
  | 'updated_asc'
  | 'updated_desc'
  | 'category_asc'
  | 'category_desc'
  | 'favorites_first';

/**
 * Eventos relacionados con conceptos
 */
export const CONCEPT_EVENTS = {
  CONCEPT_CREATED: 'concept:created',
  CONCEPT_UPDATED: 'concept:updated',
  CONCEPT_DELETED: 'concept:deleted',
  CONCEPT_LINKED: 'concept:linked',
  CONCEPT_UNLINKED: 'concept:unlinked',
} as const;