/**
 * @file Índice para tipos de Group
 * @module types/entities/group
 */

// Exportar todo el módulo de tipos
export * from './types';

// Alias común para el tipo principal
export type { GroupWithRelations as Group } from './types';

// Exportar tipos principales para uso común
export type {
	GroupAdvancedFilter, GroupBase, GroupCacheConfig, GroupFilters, GroupListOptions,
	GroupSearchResult, GroupWithFiles, GroupWithStats
} from './types';

// Exportar enums específicamente para que puedan ser utilizados como valores
export { GroupSortCriteria, GroupViewMode } from './types';

// Exportar schemas de validación
export {
	groupAdvancedFilterSchema, groupFilterSchema, groupListOptionsSchema, groupSchema
} from './types';

