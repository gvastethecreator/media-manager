/**
 * Categorías disponibles para prompts
 */
export enum PromptCategory {
  GENERAL = 'general',
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  CODE = 'code',
  CHAT = 'chat',
  WORLDBUILDING = 'worldbuilding',
  CHARACTER = 'character',
  SETTING = 'setting',
  STORY = 'story',
  OTHER = 'other',
}

/**
 * Estado de un prompt
 */
export enum PromptStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Tipo de vista para los prompts
 */
export enum PromptViewMode {
  GRID = 'grid',
  LIST = 'list',
  COMPACT = 'compact',
  DETAILED = 'detailed',
}

/**
 * Opciones de ordenación para prompts
 */
export type PromptSortOption =
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
 * Eventos relacionados con prompts
 */
export const PROMPT_EVENTS = {
  PROMPT_CREATED: 'prompt:created',
  PROMPT_UPDATED: 'prompt:updated',
  PROMPT_DELETED: 'prompt:deleted',
  PROMPT_LINKED: 'prompt:linked',
  PROMPT_UNLINKED: 'prompt:unlinked',
  PROMPT_EXECUTED: 'prompt:executed',
} as const;