/**
 * @file Group entity types re-export
 * @module types/entities/group
 * @description Re-exporta los tipos de grupo desde la estructura modular
 */

// Barrel legacy (mantener mientras se migra a imports desde './group')
export type { GroupBase, GroupComplete, GroupSortKey, GroupStatistics, GroupWithStats } from './group/base';
export { GroupViewMode } from './group/base';
export * from './group/enums';
// Exportar tipos de creación/actualización
export type {
	GroupCreateInput,
	GroupUpdateInput,
	GroupViewConfig,
} from './group/types';
