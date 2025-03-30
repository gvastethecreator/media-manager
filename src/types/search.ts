/**
 * @file Tipos para el sistema de búsqueda y filtrado
 * @module types/search
 */

import type { JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Operador de búsqueda
 */
export enum SearchOperator {
    EQUALS = 'eq',
    NOT_EQUALS = 'neq',
    GREATER_THAN = 'gt',
    GREATER_THAN_OR_EQUALS = 'gte',
    LESS_THAN = 'lt',
    LESS_THAN_OR_EQUALS = 'lte',
    IN = 'in',
    NOT_IN = 'nin',
    BETWEEN = 'between',
    LIKE = 'like',
    NOT_LIKE = 'nlike',
    NULL = 'null',
    NOT_NULL = 'nnull',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'ncontains'
}

/**
 * Modo de ordenamiento
 */
export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

/**
 * Campo de búsqueda
 */
export interface SearchField {
    name: string;
    type: string;
    searchable: boolean;
    sortable: boolean;
    operators: SearchOperator[];
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Condición de búsqueda
 */
export interface SearchCondition {
    field: string;
    operator: SearchOperator;
    value: unknown;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Grupo de condiciones
 */
export interface SearchGroup {
    operator: 'and' | 'or';
    conditions: Array<SearchCondition | SearchGroup>;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Ordenamiento
 */
export interface SearchSort {
    field: string;
    order: SortOrder;
}

/**
 * Paginación
 */
export interface SearchPagination {
    page: number;
    perPage: number;
    offset?: number;
}

/**
 * Opciones de búsqueda
 */
export interface SearchOptions {
    includeDeleted?: boolean;
    includeDrafts?: boolean;
    caseInsensitive?: boolean;
    timeout?: number;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Consulta de búsqueda
 */
export interface SearchQuery {
    index: string;
    filter?: SearchGroup;
    sort?: SearchSort[];
    pagination?: SearchPagination;
    options?: SearchOptions;
}

/**
 * Resultado de búsqueda
 */
export interface SearchResult<T = unknown> {
    items: T[];
    total: number;
    metadata: {
        query: SearchQuery;
        duration: number;
        timestamp: Date;
    };
}

// Validaciones Zod
export const searchOperatorSchema = z.nativeEnum(SearchOperator);
export const sortOrderSchema = z.nativeEnum(SortOrder);

export const searchFieldSchema = z.object({
    name: z.string(),
    type: z.string(),
    searchable: z.boolean(),
    sortable: z.boolean(),
    operators: z.array(searchOperatorSchema),
    metadata: z.string().optional()
});

export const searchConditionSchema = z.object({
    field: z.string(),
    operator: searchOperatorSchema,
    value: z.unknown(),
    metadata: z.string().optional()
});

export const searchGroupSchema: z.ZodType<SearchGroup> = z.lazy(() =>
    z.object({
        operator: z.enum(['and', 'or']),
        conditions: z.array(z.union([searchConditionSchema, searchGroupSchema])),
        metadata: z.string().optional()
    })
);

export const searchSortSchema = z.object({
    field: z.string(),
    order: sortOrderSchema
});

export const searchPaginationSchema = z.object({
    page: z.number().positive(),
    perPage: z.number().positive(),
    offset: z.number().nonnegative().optional()
});

export const searchOptionsSchema = z.object({
    includeDeleted: z.boolean().optional(),
    includeDrafts: z.boolean().optional(),
    caseInsensitive: z.boolean().optional(),
    timeout: z.number().positive().optional(),
    metadata: z.string().optional()
});

export const searchQuerySchema = z.object({
    index: z.string(),
    filter: searchGroupSchema.optional(),
    sort: z.array(searchSortSchema).optional(),
    pagination: searchPaginationSchema.optional(),
    options: searchOptionsSchema.optional()
});

export const searchResultSchema = z.object({
    items: z.array(z.unknown()),
    total: z.number().nonnegative(),
    metadata: z.object({
        query: searchQuerySchema,
        duration: z.number().positive(),
        timestamp: z.date()
    })
});

// Tipos inferidos
export type SearchFieldValidated = z.infer<typeof searchFieldSchema>;
export type SearchConditionValidated = z.infer<typeof searchConditionSchema>;
export type SearchGroupValidated = z.infer<typeof searchGroupSchema>;
export type SearchSortValidated = z.infer<typeof searchSortSchema>;
export type SearchPaginationValidated = z.infer<typeof searchPaginationSchema>;
export type SearchOptionsValidated = z.infer<typeof searchOptionsSchema>;
export type SearchQueryValidated = z.infer<typeof searchQuerySchema>;
export type SearchResultValidated = z.infer<typeof searchResultSchema>;