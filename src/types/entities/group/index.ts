/**
 * @file Índice para tipos de Group
 * @module types/entities/group
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types'.
 * Legacy eliminado.
 */

// Exportar desde schema.ts
export {
    CreateGroupSchema, GroupAdvancedFilterSchema, GroupFiltersSchema, GroupRelationsSchema, GroupSchema, GroupSearchOptionsSchema, GroupStatsSchema, UpdateGroupSchema
} from './schema';
export type {
    CreateGroupData,
    Group,
    GroupBase,
    GroupCard,
    GroupComplete,
    GroupCounts,
    GroupCreateInput,
    GroupDisplayState,
    GroupExtended,
    GroupFilters,
    GroupListItem,
    GroupListItemImage,
    GroupListProps,
    GroupRelations,
    GroupSearchParams,
    GroupSearchResult,
    GroupTransformerOptions,
    GroupUpdateInput,
    GroupWithStats,
    UpdateGroupData
} from './types';
// Exportar desde types.ts (excepto GroupSchema que ya se exportó desde schema)
export {
    GroupSortCriteria,
    GroupType,
    GroupViewMode
} from './types';

// 📝 Documentación: Solo tipos canónicos. Legacy removido.
