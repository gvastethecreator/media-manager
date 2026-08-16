/**
 * @file Image Service Error Types
 * @module services/image/image-errors.effect
 * @description Data.TaggedError classes for functional error handling in ImageService
 * @created 2025-10-11 - Phase 6
 */

import { Data } from 'effect';

/**
 * Error when an image is not found by its ID
 */
export class ImageNotFound extends Data.TaggedError('ImageNotFound')<{
	readonly imageId: string;
}> {
	get displayMessage(): string {
		return `Image not found: ${this.imageId}`;
	}
}

/**
 * Error when trying to create/update an image with duplicate hash
 */
export class ImageHashConflict extends Data.TaggedError('ImageHashConflict')<{
	readonly hash: string;
	readonly existingImageId?: string;
}> {
	get displayMessage(): string {
		return `Image with hash ${this.hash} already exists`;
	}
}

/**
 * Database operation error (queries, transactions, etc.)
 */
export class ImageDatabaseError extends Data.TaggedError('ImageDatabaseError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {
	get displayMessage(): string {
		const errorMsg = this.originalError instanceof Error ? this.originalError.message : String(this.originalError);
		return `Database error in operation '${this.operation}': ${errorMsg}`;
	}
}

/**
 * Input validation error
 */
export class ImageValidationError extends Data.TaggedError('ImageValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {
	get displayMessage(): string {
		return `Validation failed for field '${this.field}': ${this.message}`;
	}
}

/**
 * Error when an image cannot be deleted due to active relations
 */
export class ImageHasRelationsError extends Data.TaggedError('ImageHasRelationsError')<{
	readonly imageId: string;
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
}> {
	get displayMessage(): string {
		const totalRelations = Object.values(this.relationCounts).reduce((sum, count) => sum + count, 0);
		return `Image ${this.imageId} cannot be deleted because it has ${totalRelations} active relations`;
	}

	get hasRelations(): boolean {
		return Object.values(this.relationCounts).some((count) => count > 0);
	}
}

/**
 * Error in relation operations (add/remove to albums, collections, tags, etc.)
 */
export class ImageRelationError extends Data.TaggedError('ImageRelationError')<{
	readonly imageId: string;
	readonly relationType: string;
	readonly relationId: string;
	readonly operation: 'add' | 'remove' | 'update';
	readonly message: string;
	readonly cause?: unknown;
}> {
	get displayMessage(): string {
		return `Failed to ${this.operation} ${this.relationType} (${this.relationId}) for image ${this.imageId}: ${this.message}`;
	}
}

/**
 * Error during thumbnail generation or processing
 */
export class ImageThumbnailError extends Data.TaggedError('ImageThumbnailError')<{
	readonly imageId: string;
	readonly operation: 'generate' | 'retrieve' | 'delete' | 'update';
	readonly reason: string;
	readonly originalError?: unknown;
}> {
	get displayMessage(): string {
		return `Thumbnail ${this.operation} failed for image ${this.imageId}: ${this.reason}`;
	}
}

/**
 * Error during metadata extraction (EXIF, IPTC, XMP)
 */
export class ImageMetadataError extends Data.TaggedError('ImageMetadataError')<{
	readonly imageId: string;
	readonly operation: 'extract' | 'parse' | 'update';
	readonly metadataType: 'exif' | 'iptc' | 'xmp' | 'all';
	readonly reason: string;
	readonly originalError?: unknown;
}> {
	get displayMessage(): string {
		return `Metadata ${this.operation} failed for ${this.metadataType} in image ${this.imageId}: ${this.reason}`;
	}
}

/**
 * Error during image processing (resize, convert, optimize)
 */
export class ImageProcessingError extends Data.TaggedError('ImageProcessingError')<{
	readonly imageId: string;
	readonly operation: 'resize' | 'convert' | 'optimize' | 'process';
	readonly reason: string;
	readonly originalError?: unknown;
}> {
	get displayMessage(): string {
		return `Image processing (${this.operation}) failed for image ${this.imageId}: ${this.reason}`;
	}
}

/**
 * Error when image file is not found or inaccessible on filesystem
 */
export class ImageFileNotFound extends Data.TaggedError('ImageFileNotFound')<{
	readonly imageId: string;
	readonly path: string;
	readonly operation: string;
}> {
	get displayMessage(): string {
		return `Image file not found at ${this.path} for operation '${this.operation}'`;
	}
}

/**
 * Generic unknown error wrapper for unexpected errors
 */
export class ImageUnknownError extends Data.TaggedError('ImageUnknownError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {
	get displayMessage(): string {
		const errorMsg = this.originalError instanceof Error ? this.originalError.message : String(this.originalError);
		return `Unknown error in operation '${this.operation}': ${errorMsg}`;
	}
}

/**
 * Union type for all possible ImageService errors
 */
export type ImageError =
	| ImageNotFound
	| ImageHashConflict
	| ImageDatabaseError
	| ImageValidationError
	| ImageHasRelationsError
	| ImageRelationError
	| ImageThumbnailError
	| ImageMetadataError
	| ImageProcessingError
	| ImageFileNotFound
	| ImageUnknownError;

/**
 * Helper to create ImageDatabaseError from unknown errors
 */
export const fromUnknownError = (operation: string, error: unknown): ImageDatabaseError => {
	return new ImageDatabaseError({
		operation,
		originalError: error,
	});
};

/**
 * Helper to check if an error is an ImageError
 */
export const isImageError = (error: unknown): error is ImageError => {
	return (
		error instanceof ImageNotFound ||
		error instanceof ImageHashConflict ||
		error instanceof ImageDatabaseError ||
		error instanceof ImageValidationError ||
		error instanceof ImageHasRelationsError ||
		error instanceof ImageRelationError ||
		error instanceof ImageThumbnailError ||
		error instanceof ImageMetadataError ||
		error instanceof ImageProcessingError ||
		error instanceof ImageFileNotFound ||
		error instanceof ImageUnknownError
	);
};

/**
 * Helper to convert ImageError to HTTP response format
 */
export const toHttpError = (
	error: ImageError
): {
	status: number;
	code: string;
	message: string;
	details?: unknown;
} => {
	if (error instanceof ImageNotFound) {
		return {
			status: 404,
			code: 'IMAGE_NOT_FOUND',
			message: error.displayMessage,
		};
	}

	if (error instanceof ImageHashConflict) {
		return {
			status: 409,
			code: 'IMAGE_HASH_CONFLICT',
			message: error.displayMessage,
			details: { existingImageId: error.existingImageId },
		};
	}

	if (error instanceof ImageValidationError) {
		return {
			status: 400,
			code: 'IMAGE_VALIDATION_ERROR',
			message: error.displayMessage,
			details: { field: error.field, value: error.value },
		};
	}

	if (error instanceof ImageHasRelationsError) {
		return {
			status: 409,
			code: 'IMAGE_HAS_RELATIONS',
			message: error.displayMessage,
			details: { relationCounts: error.relationCounts },
		};
	}

	if (error instanceof ImageRelationError) {
		return {
			status: 400,
			code: 'IMAGE_RELATION_ERROR',
			message: error.displayMessage,
			details: {
				relationType: error.relationType,
				relationId: error.relationId,
				operation: error.operation,
			},
		};
	}

	if (error instanceof ImageThumbnailError) {
		return {
			status: 500,
			code: 'IMAGE_THUMBNAIL_ERROR',
			message: error.displayMessage,
			details: { operation: error.operation },
		};
	}

	if (error instanceof ImageMetadataError) {
		return {
			status: 500,
			code: 'IMAGE_METADATA_ERROR',
			message: error.displayMessage,
			details: {
				operation: error.operation,
				metadataType: error.metadataType,
			},
		};
	}

	if (error instanceof ImageProcessingError) {
		return {
			status: 500,
			code: 'IMAGE_PROCESSING_ERROR',
			message: error.displayMessage,
			details: { operation: error.operation },
		};
	}

	if (error instanceof ImageFileNotFound) {
		return {
			status: 404,
			code: 'IMAGE_FILE_NOT_FOUND',
			message: error.displayMessage,
			details: { path: error.path },
		};
	}

	if (error instanceof ImageDatabaseError) {
		return {
			status: 500,
			code: 'IMAGE_DATABASE_ERROR',
			message: error.displayMessage,
		};
	}

	// ImageUnknownError
	return {
		status: 500,
		code: 'IMAGE_UNKNOWN_ERROR',
		message: error.displayMessage,
	};
};

/**
 * Helper to map error to appropriate HTTP status code
 */
export const getHttpStatus = (error: ImageError): number => {
	if (error instanceof ImageNotFound || error instanceof ImageFileNotFound) {
		return 404;
	}

	if (error instanceof ImageHashConflict || error instanceof ImageHasRelationsError) {
		return 409;
	}

	if (error instanceof ImageValidationError || error instanceof ImageRelationError) {
		return 400;
	}

	// All processing, metadata, thumbnail, database, and unknown errors
	return 500;
};

/**
 * Helper to check if error is retryable (e.g., temporary database issues)
 */
export const isRetryableError = (error: ImageError): boolean => {
	// Only database errors might be retryable (connection issues, deadlocks, etc.)
	return error instanceof ImageDatabaseError;
};

/**
 * Helper to extract original error for logging
 */
export const getOriginalError = (error: ImageError): unknown => {
	if (error instanceof ImageDatabaseError) return error.originalError;
	if (error instanceof ImageThumbnailError) return error.originalError;
	if (error instanceof ImageMetadataError) return error.originalError;
	if (error instanceof ImageProcessingError) return error.originalError;
	if (error instanceof ImageUnknownError) return error.originalError;
	if (error instanceof ImageRelationError) return error.cause;
	return null;
};
