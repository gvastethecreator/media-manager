/**
 * @file Índice para tipos de Group
 * @module types/entities/group
 */

// Alias común para el tipo principal
// Exportar tipos principales para uso común
export type {
	GroupAdvancedFilter,
	GroupBase,
	GroupCacheConfig,
	GroupFilters,
	GroupListOptions,
	GroupSearchResult,
	GroupWithFiles,
	GroupWithRelations as Group,
	GroupWithStats,
} from './types';
// Exportar todo el módulo de tipos
export * from './types';
// Exportar enums específicamente para que puedan ser utilizados como valores
// Exportar schemas de validación
export {
	GroupSortCriteria,
	GroupViewMode,
	groupAdvancedFilterSchema,
	groupFilterSchema,
	groupListOptionsSchema,
	groupSchema,
} from './types';
