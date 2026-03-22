/**
 * @file Definición de esquemas y tipos para opciones de búsqueda
 * @module types/common/search
 */

import { z } from 'zod';

/**
 * Esquema para opciones de paginación y ordenamiento
 */
export const SearchOptionsSchema = z.object({
	skip: z.number().int().nonnegative().optional(),
	take: z.number().int().positive().optional(),
	orderBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
	include: z.record(z.string(), z.boolean()).optional(),
	where: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Tipo de opciones de búsqueda base
 */
export interface SearchOptions {
	include?: Record<string, boolean>;
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
	where?: Record<string, unknown>;
}

/**
 * Enum para criterios de ordenamiento comunes
 */
export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

/**
 * Opciones para filtros de fechas
 */
export interface DateRangeFilter {
	end?: Date;
	start?: Date;
}

/**
 * Operadores de comparación para filtros
 */
export type ComparisonOperator =
	| 'eq'
	| 'neq'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'contains'
	| 'startsWith'
	| 'endsWith'
	| 'in'
	| 'notIn';

/**
 * Estructura base para filtros de búsqueda
 */
export interface FilterField {
	field: string;
	operator: ComparisonOperator;
	value: string | number | boolean | Date | Array<string | number>;
}

/**
 * Opciones para resultados de búsqueda paginados
 */
export interface PaginatedResult<T> {
	hasMore: boolean;
	items: T[];
	page?: number;
	pageSize?: number;
	total: number;
}
