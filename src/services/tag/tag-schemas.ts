/**
 * @file Schemas de Effect para Tag
 * @module services/tag/tag-schemas
 * @description Schemas @effect/schema para validación y transformación de Tags
 * @created 2025-10-11 - Fase 1 Effect Implementation
 * @updated 2025-10-11 - Fase 2: Refactored to use common schemas
 */

import { Schema } from '@effect/schema';
import { UUID, HexColor, Emoji, TimestampFields } from '@/lib/effect/schemas';

/**
 * Schema base para Tag entity (matches Drizzle schema)
 * Representa un tag almacenado en la base de datos
 */
export class Tag extends Schema.Class<Tag>('Tag')({
	id: UUID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	description: Schema.NullOr(Schema.String),
	color: Schema.NullOr(HexColor),
	emoji: Schema.NullOr(Emoji),
	category: Schema.NullOr(Schema.String.pipe(Schema.maxLength(50))),
	shortcut: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(20)))),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Schema para crear un nuevo Tag
 * Omite campos autogenerados (id, timestamps)
 */
export class TagCreate extends Schema.Class<TagCreate>('TagCreate')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(
		Schema.NullOr(Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{6}$/))).annotations({
			message: () => 'Color debe ser formato hex (#RRGGBB)',
		})
	),
	emoji: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(10)))),
	category: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(50)))),
	shortcut: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(20)))),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
}) {}

/**
 * Schema para actualizar un Tag existente
 * Todos los campos son opcionales excepto el ID
 */
export class TagUpdate extends Schema.Class<TagUpdate>('TagUpdate')({
	id: Schema.UUID,
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(
		Schema.NullOr(Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{6}$/))).annotations({
			message: () => 'Color debe ser formato hex (#RRGGBB)',
		})
	),
	emoji: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(10)))),
	category: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(50)))),
	shortcut: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(20)))),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
}) {}

/**
 * Schema para conteos de relaciones (_count)
 */
export class TagCounts extends Schema.Class<TagCounts>('TagCounts')({
	images: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	videos: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	documents: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	file3Ds: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	jsonFiles: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	audios: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	albums: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	collections: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	characters: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	places: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	worldItems: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	concepts: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	prompts: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	notes: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	wildcards: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	properties: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	groups: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

/**
 * Schema para estadísticas calculadas del Tag
 */
export class TagStatistics extends Schema.Class<TagStatistics>('TagStatistics')({
	totalRelations: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	usageDiversity: Schema.Number.pipe(Schema.between(0, 1)),
	popularity: Schema.Number.pipe(Schema.nonNegative()),
	completenessScore: Schema.Number.pipe(Schema.between(0, 100)),
	totalViews: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	lastAccessedAt: Schema.optional(Schema.NullOr(Schema.DateFromSelf)),
}) {}

/**
 * Schema para Tag con estadísticas completas
 * Este es el tipo canónico que se usa en la UI
 */
export class TagWithStats extends Schema.Class<TagWithStats>('TagWithStats')({
	id: Schema.UUID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	description: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	emoji: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	shortcut: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	entityType: Schema.Literal('tag'),
	stats: TagStatistics,
	_count: Schema.optional(TagCounts),
	statistics: Schema.optional(TagStatistics), // Alias para compatibilidad
}) {}

/**
 * Schema para opciones de búsqueda/filtrado de tags
 */
export class GetTagsOptions extends Schema.Class<GetTagsOptions>('GetTagsOptions')({
	search: Schema.optional(Schema.String),
	onlyFavorites: Schema.optional(Schema.Boolean),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	orderBy: Schema.optional(Schema.Literal('name', 'createdAt', 'updatedAt', 'popularity')),
	orderDirection: Schema.optional(Schema.Literal('asc', 'desc')),
	limit: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(1000))),
	offset: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	includeArchived: Schema.optional(Schema.Boolean),
}) {}

/**
 * Schema para el resultado de getTags (lista paginada)
 */
export class GetTagsResult extends Schema.Class<GetTagsResult>('GetTagsResult')({
	tags: Schema.Array(TagWithStats),
	total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
	offset: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	hasMore: Schema.Boolean,
}) {}

/**
 * Schema para Tag preview (vista reducida)
 */
export class TagPreview extends Schema.Class<TagPreview>('TagPreview')({
	id: Schema.UUID,
	name: Schema.String,
	color: Schema.NullOr(Schema.String),
	emoji: Schema.NullOr(Schema.String),
	imageCount: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
}) {}

// Re-exports de tipos inferidos para uso en TypeScript estándar
export type TagType = Schema.Schema.Type<typeof Tag>;
export type TagCreateType = Schema.Schema.Type<typeof TagCreate>;
export type TagUpdateType = Schema.Schema.Type<typeof TagUpdate>;
export type TagWithStatsType = Schema.Schema.Type<typeof TagWithStats>;
export type GetTagsOptionsType = Schema.Schema.Type<typeof GetTagsOptions>;
export type GetTagsResultType = Schema.Schema.Type<typeof GetTagsResult>;
export type TagPreviewType = Schema.Schema.Type<typeof TagPreview>;
