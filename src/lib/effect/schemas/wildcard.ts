/**
 * @file Wildcard Entity Schemas (Effect)
 * @module lib/effect/schemas/wildcard
 * @description Effect schemas para Wildcard entity (migration from Zod)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from 'effect';
import { ID } from './common';
import { BoundedString, Emoji, ThemeColor } from './primitives';

/**
 * Schema base para Wildcard entity
 */
export class Wildcard extends Schema.Class<Wildcard>('Wildcard')({
	id: ID,
	name: BoundedString(1, 50),
	emoji: Emoji,
	color: ThemeColor,
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String),
	category: Schema.String,
	children: Schema.Array(Schema.String), // Array de IDs
	parentId: Schema.optional(Schema.NullOr(ID)),
	featuredImage: Schema.optional(Schema.String),
	isFavorite: Schema.Boolean,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Schema para crear un Wildcard
 */
export class WildcardCreate extends Schema.Class<WildcardCreate>('WildcardCreate')({
	name: BoundedString(1, 50),
	emoji: Schema.optional(Emoji),
	color: Schema.optional(ThemeColor),
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String),
	category: Schema.optional(Schema.String),
	children: Schema.optional(Schema.Array(Schema.String)),
	parentId: Schema.optional(Schema.NullOr(ID)),
	featuredImage: Schema.optional(Schema.String),
}) {}

/**
 * Schema para actualizar un Wildcard
 */
export class WildcardUpdate extends Schema.Class<WildcardUpdate>('WildcardUpdate')({
	id: ID,
	name: Schema.optional(BoundedString(1, 50)),
	emoji: Schema.optional(Emoji),
	color: Schema.optional(ThemeColor),
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String),
	category: Schema.optional(Schema.String),
	children: Schema.optional(Schema.Array(Schema.String)),
	parentId: Schema.optional(Schema.NullOr(ID)),
	featuredImage: Schema.optional(Schema.String),
}) {}

/**
 * Schema para filtros de Wildcard
 */
export class WildcardFilters extends Schema.Class<WildcardFilters>('WildcardFilters')({
	searchQuery: Schema.optional(Schema.String),
	categories: Schema.optional(Schema.Array(Schema.String)),
	onlyFavorites: Schema.optional(Schema.Boolean),
	showOnlyRoots: Schema.optional(Schema.Boolean),
	sortBy: Schema.optional(Schema.Literal('name', 'category', 'createdAt')),
	sortOrder: Schema.optional(Schema.Literal('asc', 'desc')),
	parentId: Schema.optional(Schema.NullOr(ID)),
}) {}
