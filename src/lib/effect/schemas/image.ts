/**
 * @file Image Entity Schemas (Effect)
 * @module lib/effect/schemas/image
 * @description Effect schemas para Image entity (migration from Zod)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from 'effect';
import { UUID } from './common';
import { AbsoluteFilePath, AspectRatio, FileSize, HexColor, NonNegativeInt, PositiveInt } from './primitives';

/**
 * Schema base para Image entity
 */
export class BaseImage extends Schema.Class<BaseImage>('BaseImage')({
	id: UUID,
	name: Schema.String,
	path: AbsoluteFilePath,
	hash: Schema.optional(Schema.NullOr(Schema.String)),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	size: FileSize,
	width: NonNegativeInt.annotations({ description: 'Image width in pixels' }),
	height: NonNegativeInt.annotations({ description: 'Image height in pixels' }),
	folderId: Schema.optional(Schema.NullOr(UUID)),
}) {}

/**
 * Schema para estadísticas de Image
 */
export class ImageStats extends Schema.Class<ImageStats>('ImageStats')({
	views: NonNegativeInt,
	favorites: NonNegativeInt,
	lastAccessed: Schema.optional(Schema.NullOr(Schema.DateFromSelf)),
}) {}

/**
 * Schema para configuración visual de Image
 */
export class ImageVisualConfig extends Schema.Class<ImageVisualConfig>('ImageVisualConfig')({
	isHidden: Schema.Boolean,
	isPinned: Schema.Boolean,
	dominantColor: HexColor,
}) {}

/**
 * Schema para un thumbnail individual
 */
export class ImageThumbnail extends Schema.Class<ImageThumbnail>('ImageThumbnail')({
	url: Schema.String,
	width: Schema.optional(PositiveInt),
	height: Schema.optional(PositiveInt),
	quality: Schema.optional(Schema.String),
}) {}

/**
 * Schema para Image completa con todos sus campos
 */
export class CompleteImage extends Schema.Class<CompleteImage>('CompleteImage')({
	// Base fields
	id: UUID,
	name: Schema.String,
	path: AbsoluteFilePath,
	hash: Schema.optional(Schema.NullOr(Schema.String)),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	size: FileSize,
	width: NonNegativeInt,
	height: NonNegativeInt,
	folderId: Schema.optional(Schema.NullOr(UUID)),

	// Extended fields
	url: Schema.String,
	aspectRatio: AspectRatio,
	thumbnails: Schema.Record({ key: Schema.String, value: ImageThumbnail }),
	metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	stats: ImageStats,
	visualConfig: ImageVisualConfig,
}) {}

/**
 * Schema para Image extendida (UI) con campos adicionales
 */
export class ExtendedImage extends Schema.Class<ExtendedImage>('ExtendedImage')({
	// Complete Image fields (inline para evitar herencia compleja)
	id: UUID,
	name: Schema.String,
	path: AbsoluteFilePath,
	hash: Schema.optional(Schema.NullOr(Schema.String)),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	size: FileSize,
	width: NonNegativeInt,
	height: NonNegativeInt,
	folderId: Schema.optional(Schema.NullOr(UUID)),
	url: Schema.String,
	aspectRatio: AspectRatio,
	thumbnails: Schema.Record({ key: Schema.String, value: ImageThumbnail }),
	metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	stats: ImageStats,
	visualConfig: ImageVisualConfig,

	// UI-specific fields
	isSelected: Schema.Boolean,
	isHighlighted: Schema.Boolean,
	isVisible: Schema.Boolean,
	isFavorite: Schema.Boolean,
	isNew: Schema.Boolean,
}) {}

/**
 * Schema para crear una nueva Image (omite campos autogenerados)
 */
export class ImageCreate extends Schema.Class<ImageCreate>('ImageCreate')({
	name: Schema.String,
	path: AbsoluteFilePath,
	hash: Schema.optional(Schema.NullOr(Schema.String)),
	size: FileSize,
	width: NonNegativeInt,
	height: NonNegativeInt,
	folderId: Schema.optional(Schema.NullOr(UUID)),
}) {}

/**
 * Schema para actualizar una Image
 */
export class ImageUpdate extends Schema.Class<ImageUpdate>('ImageUpdate')({
	id: UUID,
	name: Schema.optional(Schema.String),
	path: Schema.optional(AbsoluteFilePath),
	hash: Schema.optional(Schema.NullOr(Schema.String)),
	size: Schema.optional(FileSize),
	width: Schema.optional(NonNegativeInt),
	height: Schema.optional(NonNegativeInt),
	folderId: Schema.optional(Schema.NullOr(UUID)),
	visualConfig: Schema.optional(ImageVisualConfig),
}) {}

/**
 * Schema para filtros de búsqueda de Images
 */
export class ImageFilters extends Schema.Class<ImageFilters>('ImageFilters')({
	folderId: Schema.optional(Schema.NullOr(UUID)),
	minWidth: Schema.optional(NonNegativeInt),
	maxWidth: Schema.optional(NonNegativeInt),
	minHeight: Schema.optional(NonNegativeInt),
	maxHeight: Schema.optional(NonNegativeInt),
	minSize: Schema.optional(FileSize),
	maxSize: Schema.optional(FileSize),
	aspectRatioMin: Schema.optional(AspectRatio),
	aspectRatioMax: Schema.optional(AspectRatio),
	isFavorite: Schema.optional(Schema.Boolean),
	isHidden: Schema.optional(Schema.Boolean),
}) {}
