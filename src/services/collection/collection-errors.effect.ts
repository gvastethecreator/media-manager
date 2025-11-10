/**
 * @file Collection Service Error Types
 * @module services/collection/collection-errors.effect
 * @created 2025-10-11 - Phase 5
 */

import { Data } from 'effect';

export class CollectionNotFound extends Data.TaggedError('CollectionNotFound')<{
	readonly collectionId: string;
}> {}

export class CollectionValidationError extends Data.TaggedError('CollectionValidationError')<{
	readonly field: string;
	readonly message: string;
}> {}

export class CollectionDatabaseError extends Data.TaggedError('CollectionDatabaseError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {}

export class CollectionRelationError extends Data.TaggedError('CollectionRelationError')<{
	readonly collectionId: string;
	readonly itemId: string;
	readonly operation: string;
	readonly reason: string;
}> {}

export class CollectionHasContentError extends Data.TaggedError('CollectionHasContentError')<{
	readonly collectionId: string;
	readonly imagesCount: number;
	readonly videosCount: number;
}> {}

export class CollectionUnknownError extends Data.TaggedError('CollectionUnknownError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {}

export type CollectionError =
	| CollectionNotFound
	| CollectionValidationError
	| CollectionDatabaseError
	| CollectionRelationError
	| CollectionHasContentError
	| CollectionUnknownError;
