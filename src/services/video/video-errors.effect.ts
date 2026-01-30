/**
 * @file Video Effect Errors
 * @module services/video/video-errors.effect
 * @description Typed errors for VideoService using Effect-TS Data.TaggedError pattern
 * @created 2025-10-12 - Phase 6.2 VideoService Effect Implementation
 */

import { Data } from 'effect';

/**
 * Video not found error
 */
export class VideoNotFound extends Data.TaggedError('VideoNotFound')<{
	readonly id: string;
	readonly message?: string;
}> {}

/**
 * Video hash conflict error (duplicate hash)
 */
export class VideoHashConflict extends Data.TaggedError('VideoHashConflict')<{
	readonly hash: string;
	readonly existingId: string;
	readonly message?: string;
}> {}

/**
 * Video database operation error
 */
export class VideoDatabaseError extends Data.TaggedError('VideoDatabaseError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Video validation error
 */
export class VideoValidationError extends Data.TaggedError('VideoValidationError')<{
	readonly field: string;
	readonly value: unknown;
	readonly reason: string;
}> {}

/**
 * Video has relations error (cannot delete)
 */
export class VideoHasRelationsError extends Data.TaggedError('VideoHasRelationsError')<{
	readonly id: string;
	readonly relationCounts: {
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	readonly message?: string;
}> {}

/**
 * Video relation operation error
 */
export class VideoRelationError extends Data.TaggedError('VideoRelationError')<{
	readonly operation: string;
	readonly videoId: string;
	readonly relationType: string;
	readonly reason: string;
}> {}

/**
 * Video thumbnail error
 */
export class VideoThumbnailError extends Data.TaggedError('VideoThumbnailError')<{
	readonly videoId: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Video metadata extraction error
 */
export class VideoMetadataError extends Data.TaggedError('VideoMetadataError')<{
	readonly videoId: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Video processing error (transcode, etc.)
 */
export class VideoProcessingError extends Data.TaggedError('VideoProcessingError')<{
	readonly videoId: string;
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Video file not found error
 */
export class VideoFileNotFound extends Data.TaggedError('VideoFileNotFound')<{
	readonly path: string;
	readonly videoId?: string;
	readonly message?: string;
}> {}

/**
 * Unknown video error (fallback)
 */
export class VideoUnknownError extends Data.TaggedError('VideoUnknownError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Union type of all video errors
 */
export type VideoError =
	| VideoNotFound
	| VideoHashConflict
	| VideoDatabaseError
	| VideoValidationError
	| VideoHasRelationsError
	| VideoRelationError
	| VideoThumbnailError
	| VideoMetadataError
	| VideoProcessingError
	| VideoFileNotFound
	| VideoUnknownError;

/**
 * Helper to create VideoNotFound error
 */
export const videoNotFound = (id: string, message?: string): VideoNotFound =>
	new VideoNotFound({ id, message: message || `Video with id ${id} not found` });

/**
 * Helper to create VideoHashConflict error
 */
export const videoHashConflict = (hash: string, existingId: string): VideoHashConflict =>
	new VideoHashConflict({
		hash,
		existingId,
		message: `Video with hash ${hash} already exists (id: ${existingId})`,
	});

/**
 * Helper to create VideoDatabaseError
 */
export const videoDatabaseError = (operation: string, reason: string, originalError?: unknown): VideoDatabaseError =>
	new VideoDatabaseError({ operation, reason, originalError });

/**
 * Helper to create VideoValidationError
 */
export const videoValidationError = (field: string, value: unknown, reason: string): VideoValidationError =>
	new VideoValidationError({ field, value, reason });

/**
 * Helper to create VideoHasRelationsError
 */
export const videoHasRelationsError = (
	id: string,
	relationCounts: VideoHasRelationsError['relationCounts']
): VideoHasRelationsError =>
	new VideoHasRelationsError({
		id,
		relationCounts,
		message: `Video ${id} has relations and cannot be deleted without force`,
	});

/**
 * Helper to create VideoRelationError
 */
export const videoRelationError = (
	operation: string,
	videoId: string,
	relationType: string,
	reason: string
): VideoRelationError => new VideoRelationError({ operation, videoId, relationType, reason });

/**
 * Helper to create VideoThumbnailError
 */
export const videoThumbnailError = (videoId: string, reason: string, originalError?: unknown): VideoThumbnailError =>
	new VideoThumbnailError({ videoId, reason, originalError });

/**
 * Helper to create VideoMetadataError
 */
export const videoMetadataError = (videoId: string, reason: string, originalError?: unknown): VideoMetadataError =>
	new VideoMetadataError({ videoId, reason, originalError });

/**
 * Helper to create VideoProcessingError
 */
export const videoProcessingError = (
	videoId: string,
	operation: string,
	reason: string,
	originalError?: unknown
): VideoProcessingError => new VideoProcessingError({ videoId, operation, reason, originalError });

/**
 * Helper to create VideoFileNotFound error
 */
export const videoFileNotFound = (path: string, videoId?: string, message?: string): VideoFileNotFound =>
	new VideoFileNotFound({ path, videoId, message: message || `Video file not found at ${path}` });

/**
 * Helper to create VideoUnknownError
 */
export const videoUnknownError = (operation: string, reason: string, originalError?: unknown): VideoUnknownError =>
	new VideoUnknownError({ operation, reason, originalError });
