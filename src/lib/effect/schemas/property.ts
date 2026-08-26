/**
 * @file Property Entity Schemas (Effect)
 * @module lib/effect/schemas/property
 * @description Effect schemas para Property entity (migration from Zod)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from 'effect';
import { ID } from './common';
import { BoundedString, Emoji, ThemeColor } from './primitives';

/**
 * Categorías válidas para Property
 */
export const PropertyCategory = Schema.Literal('general', 'technical', 'artistic', 'management').annotations({
	identifier: 'PropertyCategory',
	title: 'Property category',
	description: 'Category classification for properties',
});

/**
 * Schema base para Property entity
 */
export class Property extends Schema.Class<Property>('Property')({
	id: ID,
	name: BoundedString(1, 50),
	emoji: Emoji,
	color: ThemeColor,
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
	category: PropertyCategory,
	featuredImage: Schema.optional(Schema.String),
	isFavorite: Schema.Boolean,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Schema para crear una Property
 */
export class PropertyCreate extends Schema.Class<PropertyCreate>('PropertyCreate')({
	name: BoundedString(1, 50),
	emoji: Schema.optional(Emoji),
	color: Schema.optional(ThemeColor),
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
	category: Schema.optional(PropertyCategory),
	featuredImage: Schema.optional(Schema.String),
}) {}

/**
 * Schema para actualizar una Property
 */
export class PropertyUpdate extends Schema.Class<PropertyUpdate>('PropertyUpdate')({
	id: ID,
	name: Schema.optional(BoundedString(1, 50)),
	emoji: Schema.optional(Emoji),
	color: Schema.optional(ThemeColor),
	description: Schema.optional(Schema.String),
	shortcut: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
	category: Schema.optional(PropertyCategory),
	featuredImage: Schema.optional(Schema.String),
}) {}

/**
 * Schema para filtros de Property
 */
export class PropertyFilters extends Schema.Class<PropertyFilters>('PropertyFilters')({
	searchQuery: Schema.optional(Schema.String),
	categories: Schema.optional(Schema.Array(PropertyCategory)),
	onlyFavorites: Schema.optional(Schema.Boolean),
	sortBy: Schema.optional(Schema.Literal('name', 'category', 'createdAt')),
	sortOrder: Schema.optional(Schema.Literal('asc', 'desc')),
}) {}
