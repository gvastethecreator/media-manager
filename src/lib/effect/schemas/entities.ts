/**
 * @file Entity Schemas
 * @module lib/effect/schemas/entities
 * @description Schemas Effect para entidades del sistema (Album, Folder, Tag, etc.)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { EntityType, ID, TimestampFields } from './common';

// ============= Base Entity =============

/**
 * Campos base que comparten todas las entidades
 */
export class BaseEntity extends Schema.Class<BaseEntity>('BaseEntity')({
	id: ID,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Campos UI comunes (emoji, color, isFavorite)
 */
export class UIFields extends Schema.Class<UIFields>('UIFields')({
	emoji: Schema.NullOr(Schema.String).annotations({
		description: 'Emoji representation',
		examples: ['📁', '🎨', '⭐'],
	}),
	color: Schema.NullOr(Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{6}$/))).annotations({
		description: 'Hex color code',
		examples: ['#FF5733', '#3498DB'],
	}),
	isFavorite: Schema.Boolean.annotations({
		description: 'Whether entity is marked as favorite',
		default: false,
	}),
}) {}

/**
 * Campos de metadata comunes
 */
export class MetadataFields extends Schema.Class<MetadataFields>('MetadataFields')({
	metadata: Schema.NullOr(
		Schema.Record({
			key: Schema.String,
			value: Schema.Unknown,
		})
	).annotations({
		description: 'Additional metadata as JSON',
	}),
}) {}

// ============= Album Entity =============

/**
 * Schema para Album (solo campos DB, sin stats)
 */
export class Album extends Schema.Class<Album>('Album')({
	id: ID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	lastImageAddedAt: Schema.NullOr(Schema.DateFromSelf),
	lastVideoAddedAt: Schema.NullOr(Schema.DateFromSelf),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Album
 */
export class AlbumCreateInput extends Schema.Class<AlbumCreateInput>('AlbumCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

/**
 * Input para actualizar Album (partial)
 */
export class AlbumUpdateInput extends Schema.Class<AlbumUpdateInput>('AlbumUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

/**
 * Schema para Album con stats enriquecido
 */
export class AlbumWithStats extends Schema.Class<AlbumWithStats>('AlbumWithStats')({
	id: ID,
	name: Schema.String,
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	lastImageAddedAt: Schema.NullOr(Schema.DateFromSelf),
	lastVideoAddedAt: Schema.NullOr(Schema.DateFromSelf),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	// Stats computed
	totalImages: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalVideos: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

// ============= Collection Entity =============

/**
 * Schema para Collection (solo campos DB, sin stats)
 */
export class Collection extends Schema.Class<Collection>('Collection')({
	id: Schema.String,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	lastImageAddedAt: Schema.NullOr(Schema.DateFromSelf),
	lastVideoAddedAt: Schema.NullOr(Schema.DateFromSelf),
	parentId: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Collection
 */
export class CollectionCreateInput extends Schema.Class<CollectionCreateInput>('CollectionCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	parentId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Input para actualizar Collection (partial)
 */
export class CollectionUpdateInput extends Schema.Class<CollectionUpdateInput>('CollectionUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	parentId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Schema para Collection con stats enriquecido
 */
export class CollectionWithStats extends Schema.Class<CollectionWithStats>('CollectionWithStats')({
	id: Schema.String,
	name: Schema.String,
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	lastImageAddedAt: Schema.NullOr(Schema.DateFromSelf),
	lastVideoAddedAt: Schema.NullOr(Schema.DateFromSelf),
	parentId: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	// Stats computed
	totalImages: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalVideos: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

// ============= Folder Entity =============

/**
 * Schema para Folder
 */
export class Folder extends Schema.Class<Folder>('Folder')({
	id: ID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	path: Schema.String.pipe(Schema.minLength(1)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	parentId: Schema.NullOr(ID),
	presetId: Schema.NullOr(ID),
	isFavorite: Schema.Boolean,
	totalImages: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalVideos: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalFiles: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	totalSize: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	lastIndexed: Schema.NullOr(Schema.DateFromSelf),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Folder
 */
export class FolderCreateInput extends Schema.Class<FolderCreateInput>('FolderCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	path: Schema.String.pipe(Schema.minLength(1)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	parentId: Schema.optional(Schema.NullOr(ID)),
	presetId: Schema.optional(Schema.NullOr(ID)),
	isFavorite: Schema.optional(Schema.Boolean),
}) {}

/**
 * Input para actualizar Folder
 */
export class FolderUpdateInput extends Schema.Class<FolderUpdateInput>('FolderUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	path: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	parentId: Schema.optional(Schema.NullOr(ID)),
	presetId: Schema.optional(Schema.NullOr(ID)),
	isFavorite: Schema.optional(Schema.Boolean),
}) {}

// ============= Image Entity =============

/**
 * Schema para Image base (matches Drizzle schema)
 * NOTE: Using Schema.String for id (not ID) - Phase 5 lesson learned
 */
export class Image extends Schema.Class<Image>('Image')({
	id: Schema.String,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	description: Schema.NullOr(Schema.String),
	path: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
	hash: Schema.String.pipe(Schema.minLength(64), Schema.maxLength(64)).annotations({
		description: 'SHA-256 hash (64 characters)',
	}),
	size: Schema.Number.pipe(Schema.int(), Schema.nonNegative(), Schema.lessThanOrEqualTo(107_374_182_400)).annotations({
		description: 'File size in bytes (max 100GB)',
	}),
	width: Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(32_768)),
	height: Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(32_768)),
	metadata: Schema.NullOr(Schema.String).annotations({
		description: 'JSON string with EXIF/IPTC/XMP metadata',
	}),
	thumbnail: Schema.NullOr(Schema.String).annotations({
		description: 'Base64 encoded thumbnail',
	}),
	thumbnailSize: Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	thumbnailWidth: Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive())),
	thumbnailHeight: Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive())),
	thumbnailMimeType: Schema.NullOr(Schema.String),
	thumbnailError: Schema.NullOr(Schema.String),
	thumbnailErrorAt: Schema.NullOr(Schema.DateFromSelf),
	thumbnailOptimizedAt: Schema.NullOr(Schema.DateFromSelf),
	aiEngine: Schema.NullOr(Schema.String),
	aiModel: Schema.NullOr(Schema.String),
	aiOriginDetected: Schema.NullOr(Schema.Boolean),
	isFavorite: Schema.Boolean,
	folderId: Schema.String.annotations({
		description: 'Required folder reference (NOT NULL constraint)',
	}),
	noteId: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.NullOr(Schema.DateFromSelf),
	addedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Image
 * CONSTRAINTS (from schema):
 * - hash: CHECK length(hash) = 64 (SHA-256)
 * - size: CHECK size >= 0 AND size <= 107374182400 (100GB)
 * - dimensions: CHECK width/height > 0 AND <= 32768
 * - path: CHECK length(path) BETWEEN 1 AND 1000
 * - folderId: NOT NULL (required)
 * - UNIQUE (path, folderId)
 * - UNIQUE (hash) with index
 */
export class ImageCreateInput extends Schema.Class<ImageCreateInput>('ImageCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	path: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
	hash: Schema.String.pipe(Schema.minLength(64), Schema.maxLength(64)),
	size: Schema.Number.pipe(Schema.int(), Schema.nonNegative(), Schema.lessThanOrEqualTo(107_374_182_400)),
	width: Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(32_768)),
	height: Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(32_768)),
	metadata: Schema.optional(Schema.NullOr(Schema.String)),
	thumbnail: Schema.optional(Schema.NullOr(Schema.String)),
	thumbnailSize: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))),
	thumbnailWidth: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive()))),
	thumbnailHeight: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive()))),
	thumbnailMimeType: Schema.optional(Schema.NullOr(Schema.String)),
	aiEngine: Schema.optional(Schema.NullOr(Schema.String)),
	aiModel: Schema.optional(Schema.NullOr(Schema.String)),
	aiOriginDetected: Schema.optional(Schema.Boolean),
	isFavorite: Schema.optional(Schema.Boolean),
	folderId: Schema.String.annotations({
		description: 'Required folder reference',
	}),
	noteId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Input para actualizar Image (partial)
 */
export class ImageUpdateInput extends Schema.Class<ImageUpdateInput>('ImageUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	metadata: Schema.optional(Schema.NullOr(Schema.String)),
	thumbnail: Schema.optional(Schema.NullOr(Schema.String)),
	thumbnailSize: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))),
	thumbnailWidth: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive()))),
	thumbnailHeight: Schema.optional(Schema.NullOr(Schema.Number.pipe(Schema.int(), Schema.positive()))),
	thumbnailMimeType: Schema.optional(Schema.NullOr(Schema.String)),
	thumbnailError: Schema.optional(Schema.NullOr(Schema.String)),
	aiEngine: Schema.optional(Schema.NullOr(Schema.String)),
	aiModel: Schema.optional(Schema.NullOr(Schema.String)),
	aiOriginDetected: Schema.optional(Schema.Boolean),
	isFavorite: Schema.optional(Schema.Boolean),
	folderId: Schema.optional(Schema.String),
	noteId: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * Schema para Image con stats enriquecido
 */
export class ImageWithStats extends Schema.Class<ImageWithStats>('ImageWithStats')({
	id: Schema.String,
	name: Schema.String,
	description: Schema.NullOr(Schema.String),
	path: Schema.String,
	hash: Schema.String,
	size: Schema.Number,
	width: Schema.Number,
	height: Schema.Number,
	metadata: Schema.NullOr(Schema.String),
	thumbnail: Schema.NullOr(Schema.String),
	thumbnailSize: Schema.NullOr(Schema.Number),
	thumbnailWidth: Schema.NullOr(Schema.Number),
	thumbnailHeight: Schema.NullOr(Schema.Number),
	thumbnailMimeType: Schema.NullOr(Schema.String),
	thumbnailError: Schema.NullOr(Schema.String),
	thumbnailErrorAt: Schema.NullOr(Schema.DateFromSelf),
	thumbnailOptimizedAt: Schema.NullOr(Schema.DateFromSelf),
	aiEngine: Schema.NullOr(Schema.String),
	aiModel: Schema.NullOr(Schema.String),
	aiOriginDetected: Schema.NullOr(Schema.Boolean),
	isFavorite: Schema.Boolean,
	folderId: Schema.String,
	noteId: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.NullOr(Schema.DateFromSelf),
	addedAt: Schema.DateFromSelf,
	// Stats computed
	albumCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	collectionCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	tagCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	characterCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	placeCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	worldItemCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	conceptCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	promptCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	noteCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	wildcardCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	propertyCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
	groupCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
}) {}

// ============= Character Entity =============

/**
 * Schema para Character
 */
export class Character extends Schema.Class<Character>('Character')({
	id: ID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Character
 */
export class CharacterCreateInput extends Schema.Class<CharacterCreateInput>('CharacterCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

/**
 * Input para actualizar Character
 */
export class CharacterUpdateInput extends Schema.Class<CharacterUpdateInput>('CharacterUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

// ============= Place Entity =============

/**
 * Schema para Place
 */
export class Place extends Schema.Class<Place>('Place')({
	id: ID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Place
 */
export class PlaceCreateInput extends Schema.Class<PlaceCreateInput>('PlaceCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

/**
 * Input para actualizar Place
 */
export class PlaceUpdateInput extends Schema.Class<PlaceUpdateInput>('PlaceUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

// ============= Concept Entity =============

/**
 * Schema para Concept
 */
export class Concept extends Schema.Class<Concept>('Concept')({
	id: ID,
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.NullOr(Schema.String),
	color: Schema.NullOr(Schema.String),
	description: Schema.NullOr(Schema.String),
	category: Schema.NullOr(Schema.String),
	filters: Schema.NullOr(Schema.String),
	featuredImage: Schema.NullOr(Schema.String),
	isFavorite: Schema.Boolean,
	metadata: Schema.NullOr(Schema.Unknown),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

/**
 * Input para crear Concept
 */
export class ConceptCreateInput extends Schema.Class<ConceptCreateInput>('ConceptCreateInput')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

/**
 * Input para actualizar Concept
 */
export class ConceptUpdateInput extends Schema.Class<ConceptUpdateInput>('ConceptUpdateInput')({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255))),
	emoji: Schema.optional(Schema.NullOr(Schema.String)),
	color: Schema.optional(Schema.NullOr(Schema.String)),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	category: Schema.optional(Schema.NullOr(Schema.String)),
	filters: Schema.optional(Schema.NullOr(Schema.String)),
	featuredImage: Schema.optional(Schema.NullOr(Schema.String)),
	isFavorite: Schema.optional(Schema.Boolean),
	metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
}) {}

// ============= Export All =============

export {
	// Base
	EntityType,
	TimestampFields,
	// Helpers
	ID,
};
