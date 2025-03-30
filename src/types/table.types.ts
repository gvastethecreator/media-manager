/**
 * @file Tipos para tablas y grids
 * @module types/table
 */

import type { EntityId } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Alineación de columna
 */
export enum ColumnAlign {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right'
}

/**
 * Tipo de ordenación
 */
export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

/**
 * Tamaño de columna
 */
export enum ColumnSize {
    SMALL = 'sm',
    MEDIUM = 'md',
    LARGE = 'lg',
    AUTO = 'auto'
}

/**
 * Opciones de columna
 */
export interface ColumnDef<T = any> {
    id: string;
    accessorKey?: keyof T;
    accessorFn?: (row: T) => any;
    header: string;
    cell?: (props: { row: T; value: any }) => React.ReactNode;
    size?: ColumnSize;
    minSize?: number;
    maxSize?: number;
    align?: ColumnAlign;
    sortable?: boolean;
    filterable?: boolean;
    resizable?: boolean;
    visible?: boolean;
}

/**
 * Estado de ordenación
 */
export interface SortingState {
    id: string;
    direction: SortDirection;
}

/**
 * Estado de filtro
 */
export interface FilterState {
    id: string;
    value: any;
    operator: FilterOperator;
}

/**
 * Operadores de filtro
 */
export enum FilterOperator {
    EQUALS = 'equals',
    NOT_EQUALS = 'not_equals',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains',
    STARTS_WITH = 'starts_with',
    ENDS_WITH = 'ends_with',
    GREATER_THAN = 'greater_than',
    LESS_THAN = 'less_than',
    BETWEEN = 'between',
    IN = 'in',
    NOT_IN = 'not_in'
}

/**
 * Estado de paginación
 */
export interface PaginationState {
    pageIndex: number;
    pageSize: number;
}

/**
 * Props de tabla
 */
export interface TableProps<T = any> {
    data: T[];
    columns: ColumnDef<T>[];
    sorting?: SortingState[];
    filters?: FilterState[];
    pagination?: PaginationState;
    selectedRows?: Set<EntityId>;
    onSortingChange?: (sorting: SortingState[]) => void;
    onFiltersChange?: (filters: FilterState[]) => void;
    onPaginationChange?: (pagination: PaginationState) => void;
    onRowSelectionChange?: (selectedRows: Set<EntityId>) => void;
    onRowClick?: (row: T) => void;
}

// Validaciones Zod
export const columnAlignSchema = z.nativeEnum(ColumnAlign);
export const sortDirectionSchema = z.nativeEnum(SortDirection);
export const columnSizeSchema = z.nativeEnum(ColumnSize);
export const filterOperatorSchema = z.nativeEnum(FilterOperator);

export const columnDefSchema = z.object({
    id: z.string(),
    accessorKey: z.string().optional(),
    header: z.string(),
    size: columnSizeSchema.optional(),
    minSize: z.number().optional(),
    maxSize: z.number().optional(),
    align: columnAlignSchema.optional(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    resizable: z.boolean().optional(),
    visible: z.boolean().optional()
});

export const sortingStateSchema = z.object({
    id: z.string(),
    direction: sortDirectionSchema
});

export const filterStateSchema = z.object({
    id: z.string(),
    value: z.any(),
    operator: filterOperatorSchema
});

export const paginationStateSchema = z.object({
    pageIndex: z.number().min(0),
    pageSize: z.number().min(1)
});

// Tipos inferidos
export type ColumnDefValidated = z.infer<typeof columnDefSchema>;
export type SortingStateValidated = z.infer<typeof sortingStateSchema>;
export type FilterStateValidated = z.infer<typeof filterStateSchema>;
export type PaginationStateValidated = z.infer<typeof paginationStateSchema>;
