/**
 * @file Effect Schemas - Barrel Export
 * @module lib/effect/schemas
 * @description Central export point for all Effect schemas
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

// ============= Common Schemas =============
export {
	BooleanFilters,
	DateRange,
	EntityType,
	makePaginatedResult,
	PaginationInput,
	PaginationMeta,
	SearchOptions,
	Slug,
	SoftDeleteFields,
	SortOptions,
	TimestampFields,
	UUID,
} from './common';
// ============= Entity Schemas =============
export {
	BaseImage,
	CompleteImage,
	ExtendedImage,
	ImageCreate,
	ImageFilters,
	ImageStats,
	ImageThumbnail,
	ImageUpdate,
	ImageVisualConfig,
} from './image';
// ============= Primitive Schemas =============
export {
	AbsoluteFilePath,
	AspectRatio,
	AudioMimeType,
	BoundedString,
	Dimensions,
	DocumentMimeType,
	Email,
	Emoji,
	EntityStatus,
	FileExtension,
	FileName,
	FileSize,
	HexColor,
	HexColorWithAlpha,
	HttpUrl,
	ImageMimeType,
	NonEmptyString,
	NonEmptyTrimmedString,
	NonNegativeInt,
	Percentage,
	PositiveInt,
	ProcessingStatus,
	Ratio,
	RelativeFilePath,
	VideoMimeType,
} from './primitives';

export {
	Property,
	PropertyCategory,
	PropertyCreate,
	PropertyFilters,
	PropertyUpdate,
} from './property';

export {
	Wildcard,
	WildcardCreate,
	WildcardFilters,
	WildcardUpdate,
} from './wildcard';
