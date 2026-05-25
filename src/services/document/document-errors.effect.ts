/**
 * @file Document Effect Errors
 * @module services/document/document-errors.effect
 * @description Typed errors for DocumentService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class DocumentNotFound extends Data.TaggedError('DocumentNotFound')<{
	readonly id: string;
	readonly message?: string;
}> {}

export class DocumentDatabaseError extends Data.TaggedError('DocumentDatabaseError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

export class DocumentValidationError extends Data.TaggedError('DocumentValidationError')<{
	readonly field: string;
	readonly value: unknown;
	readonly reason: string;
}> {}

export class DocumentHashConflict extends Data.TaggedError('DocumentHashConflict')<{
	readonly hash: string;
	readonly existingId: string;
	readonly message?: string;
}> {}

export type DocumentError =
	| DocumentNotFound
	| DocumentDatabaseError
	| DocumentValidationError
	| DocumentHashConflict;
