/**
 * @file Group entity types re-export
 * @module types/entities/group
 * @description Re-exporta los tipos de grupo desde la estructura modular
 */

export type {
	GroupBase,
	GroupComplete,
	GroupSortKey,
	GroupStatistics,
	GroupWithStats,
} from './group/base';

export { GroupViewMode } from './group/base';
export * from './group/enums';
export type {
	CreateGroupInput,
	UpdateGroupInput,
} from './group/types';
