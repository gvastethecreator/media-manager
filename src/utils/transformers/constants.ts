/**
 * 🎨 Valores por defecto para campos de UI
 */
export const DEFAULT_UI_VALUES = {
  emoji: '📄',
  color: '#6B7280',
  isFavorite: false,
} as const;

/**
 * 📊 Valores por defecto para campos de metadata
 */
export const DEFAULT_METADATA_VALUES = {
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

/**
 * 🔍 Valores por defecto para búsqueda
 */
export const DEFAULT_SEARCH_OPTIONS = {
  skip: 0,
  take: 20,
  orderBy: { createdAt: 'desc' as const },
} as const;

/**
 * 📝 Campos comunes que deben ser serializados como JSON
 */
export const JSON_FIELDS = [
  'filters',
  'stats',
  'metadata',
  'relationships',
  'goals',
  'fears',
  'beliefs',
  'personality',
  'skills',
  'abilities',
] as const;

/**
 * 🔄 Relaciones comunes entre entidades
 */
export const COMMON_RELATIONS = [
  'images',
  'videos',
  'albums',
  'collections',
  'tags',
  'characters',
  'places',
  'worldItems',
  'concepts',
  'prompts',
  'notes',
  'wildcards',
  'properties',
  'groups',
] as const;

/**
 * 🎯 Tipos de datos válidos
 */
export const VALID_DATA_TYPES = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'date',
] as const;

/**
 * 📊 Campos de ordenamiento válidos
 */
export const VALID_SORT_FIELDS = [
  'name',
  'createdAt',
  'updatedAt',
  'addedAt',
  'level',
  'category',
] as const;

/**
 * 🔍 Operadores de filtro válidos
 */
export const VALID_FILTER_OPERATORS = [
  'equals',
  'not',
  'in',
  'notIn',
  'lt',
  'lte',
  'gt',
  'gte',
  'contains',
  'startsWith',
  'endsWith',
] as const;

/**
 * 🎨 Categorías predefinidas
 */
export const PREDEFINED_CATEGORIES = [
  'general',
  'personal',
  'work',
  'archive',
  'favorite',
] as const;

/**
 * 📝 Estados de entidad
 */
export const ENTITY_STATES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

/**
 * 🔄 Tipos de relación
 */
export const RELATION_TYPES = {
  ONE_TO_ONE: 'oneToOne',
  ONE_TO_MANY: 'oneToMany',
  MANY_TO_ONE: 'manyToOne',
  MANY_TO_MANY: 'manyToMany',
} as const;

/**
 * 🎯 Niveles de validación
 */
export const VALIDATION_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  STRICT: 'strict',
} as const;

/**
 * 📄 Tamaño de página predeterminado para paginación
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * 📚 Tamaño máximo de página para paginación
 */
export const MAX_PAGE_SIZE = 100;