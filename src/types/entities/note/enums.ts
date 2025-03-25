/**
 * Enumeración para los posibles estados de una nota
 */
export enum NoteStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
  DRAFT = 'draft',
  PENDING = 'pending'
}

/**
 * Enumeración para las categorías de notas
 */
export enum NoteCategory {
  GENERAL = 'general',
  STORY = 'story',
  LORE = 'lore',
  MECHANICS = 'mechanics',
  CHARACTER = 'character',
  PLACE = 'place',
  WORLD_ITEM = 'world_item',
  PROMPT = 'prompt',
  IDEA = 'idea',
  TODO = 'todo'
}

/**
 * Enumeración para la prioridad de notas
 */
export enum NotePriority {
  LOWEST = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  HIGHEST = 4
}

/**
 * Enumeración para opciones de ordenación de notas
 */
export enum NoteSortOption {
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
  CREATED_ASC = 'created_asc',
  CREATED_DESC = 'created_desc',
  UPDATED_ASC = 'updated_asc',
  UPDATED_DESC = 'updated_desc',
  PRIORITY_ASC = 'priority_asc',
  PRIORITY_DESC = 'priority_desc',
  CATEGORY_ASC = 'category_asc',
  CATEGORY_DESC = 'category_desc',
  STATUS_ASC = 'status_asc',
  STATUS_DESC = 'status_desc'
}

/**
 * Enumeración para modos de visualización de notas
 */
export enum NoteViewMode {
  GRID = 'grid',
  LIST = 'list',
  CARD = 'card',
  COMPACT = 'compact',
  DETAILED = 'detailed'
}

/**
 * Constantes para tamaños de página de notas
 */
export const NOTE_PAGE_SIZES = [10, 20, 50, 100] as const;
export type NotePageSize = typeof NOTE_PAGE_SIZES[number];