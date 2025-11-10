/**
 * @file Effect Schemas - Barrel Export
 * @module lib/effect/schemas
 * @description Central export point for all Effect schemas
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

// ============= Common Schemas =============
export {
	UUID,
	Slug,
	PaginationInput,
	PaginationMeta,
	makePaginatedResult,
	SortOptions,
	DateRange,
	SearchOptions,
	BooleanFilters,
	TimestampFields,
	SoftDeleteFields,
	EntityType,
} from './common';

// ============= Primitive Schemas =============
export {
	NonEmptyString,
	NonEmptyTrimmedString,
	BoundedString,
	Email,
	PositiveInt,
	NonNegativeInt,
	Percentage,
	Ratio,
	FileSize,
	HexColor,
	HexColorWithAlpha,
	HttpUrl,
	AbsoluteFilePath,
	RelativeFilePath,
	FileName,
	FileExtension,
	ImageMimeType,
	VideoMimeType,
	AudioMimeType,
	DocumentMimeType,
	Dimensions,
	AspectRatio,
	EntityStatus,
	ProcessingStatus,
	Emoji,
} from './primitives';

// ============= Entity Schemas =============
export {
	BaseImage,
	ImageStats,
	ImageVisualConfig,
	ImageThumbnail,
	CompleteImage,
	ExtendedImage,
	ImageCreate,
	ImageUpdate,
	ImageFilters,
} from './image';

export {
	PropertyCategory,
	Property,
	PropertyCreate,
	PropertyUpdate,
	PropertyFilters,
} from './property';

export {
	Wildcard,
	WildcardCreate,
	WildcardUpdate,
	WildcardFilters,
} from './wildcard';
