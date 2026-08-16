/**
 * @file File3D Effect Errors
 * @module services/file3d/file3d-errors.effect
 * @description Typed errors for File3DService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class File3DNotFound extends Data.TaggedError('File3DNotFound')<{
	readonly id: string;
	readonly message?: string;
}> {}

export class File3DDatabaseError extends Data.TaggedError('File3DDatabaseError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

export class File3DValidationError extends Data.TaggedError('File3DValidationError')<{
	readonly field: string;
	readonly value: unknown;
	readonly reason: string;
}> {}

export class File3DHashConflict extends Data.TaggedError('File3DHashConflict')<{
	readonly hash: string;
	readonly existingId: string;
	readonly message?: string;
}> {}

export type File3DError = File3DNotFound | File3DDatabaseError | File3DValidationError | File3DHashConflict;
