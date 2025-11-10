/**
 * @file Common Effect Schemas
 * @module lib/effect/schemas/common
 * @description Schemas reutilizables para estructuras comunes (paginación, sorting, fechas, etc.)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';

// ============= ID Types =============

/**
 * ID genérico (nanoid format, 21 caracteres)
 * @example "juO3ZL-S7P3gZe_xoqQl-"
 */
export const ID = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(30)).annotations({
	identifier: 'ID',
	title: 'Entity Identifier',
	description: 'Unique identifier (nanoid format)',
	examples: ['juO3ZL-S7P3gZe_xoqQl-'],
});

/**
 * UUID v4 format (deprecated, usar ID para nuevas implementaciones)
 * @example "550e8400-e29b-41d4-a716-446655440000"
 */
export const UUID = Schema.UUID.annotations({
	identifier: 'UUID',
	title: 'Universally Unique Identifier',
	description: 'UUID v4 format',
});

/**
 * URL-safe identifier (slug)
 * @example "my-folder", "vacation-2024"
 */
export const Slug = Schema.String.pipe(
	Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	Schema.minLength(1),
	Schema.maxLength(100)
).annotations({
	identifier: 'Slug',
	title: 'URL-safe identifier',
	description: 'Lowercase alphanumeric with hyphens',
	examples: ['my-folder', 'vacation-2024'],
});

// ============= Pagination =============

/**
 * Input para paginación (query params)
 */
export class PaginationInput extends Schema.Class<PaginationInput>('PaginationInput')({
	limit: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(100)).annotations({
			description: 'Items per page (max 100)',
			default: 20,
		})
	),
	offset: Schema.optional(
		Schema.Number.pipe(Schema.int(), Schema.nonNegative()).annotations({
			description: 'Number of items to skip',
			default: 0,
		})
	),
}) {}

/**
 * Metadata de paginación (response)
 */
export class PaginationMeta extends Schema.Class<PaginationMeta>('PaginationMeta')({
	total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
	offset: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	hasNext: Schema.Boolean,
	hasPrev: Schema.Boolean,
}) {}

/**
 * Helper para crear resultado paginado con tipo específico
 */
export const makePaginatedResult = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Struct({
		data: Schema.Array(itemSchema),
		pagination: PaginationMeta,
	});

// ============= Sorting =============

/**
 * Opciones de ordenamiento
 */
export class SortOptions extends Schema.Class<SortOptions>('SortOptions')({
	sortBy: Schema.optional(
		Schema.String.annotations({
			description: 'Field name to sort by',
			examples: ['name', 'createdAt', 'size'],
		})
	),
	sortOrder: Schema.optional(
		Schema.Literal('asc', 'desc').annotations({
			description: 'Sort direction',
			default: 'asc',
		})
	),
}) {}

// ============= Date Ranges =============

/**
 * Rango de fechas (para filtros)
 */
export class DateRange extends Schema.Class<DateRange>('DateRange')({
	from: Schema.optional(
		Schema.DateFromString.annotations({
			description: 'Start date (inclusive)',
		})
	),
	to: Schema.optional(
		Schema.DateFromString.annotations({
			description: 'End date (inclusive)',
		})
	),
}) {}

// ============= Search =============

/**
 * Opciones de búsqueda
 */
export class SearchOptions extends Schema.Class<SearchOptions>('SearchOptions')({
	query: Schema.optional(
		Schema.String.pipe(Schema.minLength(1)).annotations({
			description: 'Search query string',
			examples: ['vacation', 'project-2024'],
		})
	),
	fields: Schema.optional(
		Schema.Array(Schema.String).annotations({
			description: 'Fields to search in',
			examples: [
				['name', 'description'],
				['title', 'content'],
			],
		})
	),
}) {}

// ============= Filtering =============

/**
 * Filtros booleanos comunes
 */
export class BooleanFilters extends Schema.Class<BooleanFilters>('BooleanFilters')({
	isActive: Schema.optional(Schema.Boolean),
	isFavorite: Schema.optional(Schema.Boolean),
	isArchived: Schema.optional(Schema.Boolean),
}) {}

// ============= Entity Metadata =============

/**
 * Campos de timestamp comunes
 */
export class TimestampFields extends Schema.Class<TimestampFields>('TimestampFields')({
	createdAt: Schema.DateFromSelf.annotations({
		description: 'Creation timestamp',
	}),
	updatedAt: Schema.DateFromSelf.annotations({
		description: 'Last update timestamp',
	}),
}) {}

/**
 * Campos para soft delete
 */
export class SoftDeleteFields extends Schema.Class<SoftDeleteFields>('SoftDeleteFields')({
	deletedAt: Schema.optional(
		Schema.NullOr(Schema.DateFromSelf).annotations({
			description: 'Deletion timestamp (null if not deleted)',
		})
	),
}) {}

/**
 * Tipo de entidad (para discriminated unions)
 */
export const EntityType = Schema.Literal(
	'image',
	'video',
	'document',
	'audio',
	'file3d',
	'json',
	'folder',
	'tag',
	'album',
	'collection',
	'character',
	'place',
	'worldItem',
	'concept',
	'prompt',
	'note',
	'wildcard',
	'property',
	'group'
).annotations({
	identifier: 'EntityType',
	title: 'Entity type discriminator',
	description: 'Type of entity in the system',
});
