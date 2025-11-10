/**
 * @file Pagination & Filtering Schemas
 * @module lib/effect/schemas/pagination
 * @description Schemas Effect para paginación, sorting y filtrado avanzado
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';

// ============= Pagination =============

/**
 * Input para paginación con cursor
 */
export class CursorPaginationInput extends Schema.Class<CursorPaginationInput>('CursorPaginationInput')({
	cursor: Schema.optional(
		Schema.String.annotations({
			description: 'Cursor for pagination (typically an ID)',
		})
	),
	limit: Schema.optional(
		Schema.Number.pipe(
			Schema.int(),
			Schema.positive(),
			Schema.lessThanOrEqualTo(100)
		).annotations({
			description: 'Items per page (max 100)',
			default: 20,
		})
	),
}) {}

/**
 * Metadata de paginación con cursor
 */
export class CursorPaginationMeta extends Schema.Class<CursorPaginationMeta>('CursorPaginationMeta')({
	nextCursor: Schema.NullOr(Schema.String),
	prevCursor: Schema.NullOr(Schema.String),
	hasNext: Schema.Boolean,
	hasPrev: Schema.Boolean,
}) {}

/**
 * Helper para crear resultado paginado con cursor
 */
export const makeCursorPaginatedResult = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Struct({
		data: Schema.Array(itemSchema),
		pagination: CursorPaginationMeta,
	});

// ============= Advanced Sorting =============

/**
 * Ordenamiento multi-campo
 */
export class MultiSortOptions extends Schema.Class<MultiSortOptions>('MultiSortOptions')({
	sorts: Schema.Array(
		Schema.Struct({
			field: Schema.String.annotations({
				description: 'Field name to sort by',
			}),
			order: Schema.Literal('asc', 'desc'),
		})
	).annotations({
		description: 'Array of sort conditions applied in order',
		examples: [[{ field: 'isFavorite', order: 'desc' }, { field: 'name', order: 'asc' }]],
	}),
}) {}

// ============= Advanced Filtering =============

/**
 * Operadores de comparación
 */
export const ComparisonOperator = Schema.Literal(
	'eq', // equals
	'ne', // not equals
	'gt', // greater than
	'gte', // greater than or equal
	'lt', // less than
	'lte', // less than or equal
	'in', // in array
	'nin', // not in array
	'like', // SQL LIKE
	'ilike', // case-insensitive LIKE
	'between' // between two values
).annotations({
	identifier: 'ComparisonOperator',
	title: 'Comparison operator for filtering',
});

/**
 * Filtro individual
 */
export class Filter extends Schema.Class<Filter>('Filter')({
	field: Schema.String,
	operator: ComparisonOperator,
	value: Schema.Unknown,
}) {}

/**
 * Lógica de combinación de filtros
 */
export const FilterLogic = Schema.Literal('and', 'or').annotations({
	identifier: 'FilterLogic',
	title: 'Logic to combine multiple filters',
});

/**
 * Conjunto de filtros avanzados
 */
export class AdvancedFilters extends Schema.Class<AdvancedFilters>('AdvancedFilters')({
	filters: Schema.Array(Filter),
	logic: Schema.optional(FilterLogic.annotations({ default: 'and' })),
}) {}

// ============= Entity-Specific Filters =============

/**
 * Filtros para entidades con categoría
 */
export class CategoryFilters extends Schema.Class<CategoryFilters>('CategoryFilters')({
	categories: Schema.optional(
		Schema.Array(Schema.String).annotations({
			description: 'Filter by category names',
		})
	),
	excludeCategories: Schema.optional(
		Schema.Array(Schema.String).annotations({
			description: 'Exclude specific categories',
		})
	),
}) {}

/**
 * Filtros para entidades con fecha
 */
export class DateFilters extends Schema.Class<DateFilters>('DateFilters')({
	createdAfter: Schema.optional(Schema.DateFromString),
	createdBefore: Schema.optional(Schema.DateFromString),
	updatedAfter: Schema.optional(Schema.DateFromString),
	updatedBefore: Schema.optional(Schema.DateFromString),
}) {}

/**
 * Filtros para media (images, videos, etc.)
 */
export class MediaFilters extends Schema.Class<MediaFilters>('MediaFilters')({
	mimeTypes: Schema.optional(
		Schema.Array(Schema.String).annotations({
			description: 'Filter by MIME types',
			examples: [['image/jpeg', 'image/png']],
		})
	),
	extensions: Schema.optional(
		Schema.Array(Schema.String).annotations({
			description: 'Filter by file extensions',
			examples: [['.jpg', '.png', '.webp']],
		})
	),
	minSize: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.nonNegative()).annotations({
			description: 'Minimum file size in bytes',
		})
	),
	maxSize: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
			description: 'Maximum file size in bytes',
		})
	),
	minWidth: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
			description: 'Minimum width in pixels',
		})
	),
	maxWidth: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
			description: 'Maximum width in pixels',
		})
	),
	minHeight: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
			description: 'Minimum height in pixels',
		})
	),
	maxHeight: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
			description: 'Maximum height in pixels',
		})
	),
}) {}

/**
 * Filtros combinados para Albums
 */
export class AlbumFilters extends Schema.Class<AlbumFilters>('AlbumFilters')({
	search: Schema.optional(Schema.String),
	isFavorite: Schema.optional(Schema.Boolean),
	categories: Schema.optional(Schema.Array(Schema.String)),
	hasImages: Schema.optional(Schema.Boolean),
	hasVideos: Schema.optional(Schema.Boolean),
	minTotalImages: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	maxTotalImages: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	createdAfter: Schema.optional(Schema.DateFromString),
	createdBefore: Schema.optional(Schema.DateFromString),
}) {}

/**
 * Filtros combinados para Folders
 */
export class FolderFilters extends Schema.Class<FolderFilters>('FolderFilters')({
	search: Schema.optional(Schema.String),
	isFavorite: Schema.optional(Schema.Boolean),
	isIndexed: Schema.optional(Schema.Boolean),
	parentId: Schema.optional(Schema.NullOr(Schema.String)),
	hasParent: Schema.optional(Schema.Boolean),
	minTotalFiles: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	maxTotalFiles: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
}) {}

/**
 * Filtros combinados para Images
 */
export class ImageFilters extends Schema.Class<ImageFilters>('ImageFilters')({
	search: Schema.optional(Schema.String),
	folderId: Schema.optional(Schema.String),
	isFavorite: Schema.optional(Schema.Boolean),
	isArchived: Schema.optional(Schema.Boolean),
	mimeTypes: Schema.optional(Schema.Array(Schema.String)),
	extensions: Schema.optional(Schema.Array(Schema.String)),
	minSize: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	maxSize: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	minWidth: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	maxWidth: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	minHeight: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	maxHeight: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
	createdAfter: Schema.optional(Schema.DateFromString),
	createdBefore: Schema.optional(Schema.DateFromString),
}) {}

// ============= Query Options Combinadas =============

/**
 * Opciones completas de query para listado de entidades
 * Combina paginación, sorting, búsqueda y filtrado
 */
export const makeQueryOptions = <FilterSchema extends Schema.Schema.Any>(
	filterSchema: FilterSchema
) =>
	Schema.Struct({
		// Pagination
		limit: Schema.optional(
			Schema.Number.pipe(
				Schema.int(),
				Schema.positive(),
				Schema.lessThanOrEqualTo(100)
			).annotations({ default: 20 })
		),
		offset: Schema.optional(
			Schema.Number.pipe(
				Schema.int(),
				Schema.nonNegative()
			).annotations({ default: 0 })
		),
		
		// Sorting
		sortBy: Schema.optional(Schema.String),
		sortOrder: Schema.optional(Schema.Literal('asc', 'desc').annotations({ default: 'asc' })),
		
		// Search
		search: Schema.optional(Schema.String),
		
		// Filters
		filters: Schema.optional(filterSchema),
	});

/**
 * Ejemplo de uso para Albums:
 * const AlbumQueryOptions = makeQueryOptions(AlbumFilters);
 */

// ============= Result Wrappers =============

/**
 * Lista con metadata de paginación
 */
export const makeListResult = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Struct({
		data: Schema.Array(itemSchema),
		pagination: Schema.Struct({
			total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
			limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
			offset: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
			hasNext: Schema.Boolean,
			hasPrev: Schema.Boolean,
		}),
	});

/**
 * Resultado de operación CRUD
 */
export const makeCrudResult = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Struct({
		success: Schema.Boolean,
		data: Schema.optional(itemSchema),
		message: Schema.optional(Schema.String),
	});

/**
 * Resultado de operación de bulk (batch)
 */
export const makeBulkResult = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Struct({
		success: Schema.Boolean,
		processed: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
		succeeded: Schema.Array(itemSchema),
		failed: Schema.Array(
			Schema.Struct({
				item: Schema.Unknown,
				error: Schema.String,
			})
		),
	});

// ============= Stats & Aggregates =============

/**
 * Estadísticas de conteo
 */
export class CountStats extends Schema.Class<CountStats>('CountStats')({
	total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	favorites: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	archived: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

/**
 * Estadísticas de tamaño
 */
export class SizeStats extends Schema.Class<SizeStats>('SizeStats')({
	totalSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()).annotations({
		description: 'Total size in bytes',
	}),
	averageSize: Schema.Number.pipe(Schema.nonNegative()),
	minSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	maxSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

/**
 * Estadísticas de actividad
 */
export class ActivityStats extends Schema.Class<ActivityStats>('ActivityStats')({
	totalViews: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	lastViewedAt: Schema.NullOr(Schema.DateFromSelf),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	lastActivityAt: Schema.NullOr(Schema.DateFromSelf),
}) {}

/**
 * Distribución por categoría
 */
export class CategoryDistribution extends Schema.Class<CategoryDistribution>('CategoryDistribution')({
	categories: Schema.Array(
		Schema.Struct({
			name: Schema.String,
			count: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
			percentage: Schema.Number.pipe(Schema.nonNegative(), Schema.lessThanOrEqualTo(100)),
		})
	),
}) {}

// ============= Export All =============

export {
	// Re-export from common for convenience
	PaginationInput,
	PaginationMeta,
	SortOptions,
	DateRange,
	SearchOptions,
	BooleanFilters,
} from './common';
