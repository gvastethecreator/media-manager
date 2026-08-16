/**
 * @file Place Effect Errors
 * @module services/place/place-errors.effect
 * @description Typed errors for PlaceService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class PlaceNotFound extends Data.TaggedError('PlaceNotFound')<{
	readonly placeId: string;
}> {
	readonly displayMessage = `Place not found: ${this.placeId}`;
}

export class PlaceValidationError extends Data.TaggedError('PlaceValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Place validation failed: ${this.message}`;
}

export class PlaceNameConflict extends Data.TaggedError('PlaceNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `Place name already exists: ${this.name}`;
}

export class PlaceHasRelationsError extends Data.TaggedError('PlaceHasRelationsError')<{
	readonly placeId: string;
	readonly relationCount: number;
	readonly relations?: string[];
}> {
	readonly displayMessage = `Cannot delete place: has ${this.relationCount} relations`;
}

export class PlaceDatabaseError extends Data.TaggedError('PlaceDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export class PlaceRelationError extends Data.TaggedError('PlaceRelationError')<{
	readonly message: string;
}> {
	readonly displayMessage = `Place relation error: ${this.message}`;
}

export class PlaceUnknownError extends Data.TaggedError('PlaceUnknownError')<{
	readonly message: string;
}> {
	readonly displayMessage = `Unknown place error: ${this.message}`;
}

export const fromUnknownError = (operation: string, error: unknown): PlaceError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) {
			return new PlaceNotFound({ placeId: 'unknown' });
		}
		if (msg.includes('unique')) {
			return new PlaceNameConflict({ name: 'unknown' });
		}
		return new PlaceDatabaseError({ operation, message: error.message });
	}
	return new PlaceUnknownError({ message: String(error) });
};

export type PlaceError =
	| PlaceNotFound
	| PlaceValidationError
	| PlaceNameConflict
	| PlaceHasRelationsError
	| PlaceDatabaseError
	| PlaceRelationError
	| PlaceUnknownError;
