/**
 * @file Group entity types re-export
 * @module types/entities/group
 * @description Re-exporta los tipos de grupo desde la estructura modular
 */

export type {
  GroupBase,
  GroupComplete,
  GroupStatistics,
  GroupWithStats,
  GroupSortKey
} from './group/base';

export { GroupViewMode } from './group/base';

export type {
  CreateGroupInput,
  UpdateGroupInput
} from './group/types';

export * from './group/enums';
