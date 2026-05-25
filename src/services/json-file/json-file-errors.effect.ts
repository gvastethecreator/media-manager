/**
 * @file JsonFile Effect Errors
 * @module services/json-file/json-file-errors.effect
 * @description Typed errors for JsonFileService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class JsonFileNotFound extends Data.TaggedError('JsonFileNotFound')<{
	readonly id: string;
	readonly message?: string;
}> {}

export class JsonFileDatabaseError extends Data.TaggedError('JsonFileDatabaseError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

export class JsonFileValidationError extends Data.TaggedError('JsonFileValidationError')<{
	readonly field: string;
	readonly value: unknown;
	readonly reason: string;
}> {}

export class JsonFileHashConflict extends Data.TaggedError('JsonFileHashConflict')<{
	readonly hash: string;
	readonly existingId: string;
	readonly message?: string;
}> {}

export type JsonFileError =
	| JsonFileNotFound
	| JsonFileDatabaseError
	| JsonFileValidationError
	| JsonFileHashConflict;
