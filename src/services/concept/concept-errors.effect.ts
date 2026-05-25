/**
 * @file Concept Effect Errors
 * @module services/concept/concept-errors.effect
 * @description Typed errors for ConceptService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class ConceptNotFound extends Data.TaggedError('ConceptNotFound')<{
	readonly conceptId: string;
}> {
	readonly displayMessage = `Concept not found: ${this.conceptId}`;
}

export class ConceptValidationError extends Data.TaggedError('ConceptValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Concept validation failed: ${this.message}`;
}

export class ConceptNameConflict extends Data.TaggedError('ConceptNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `Concept name already exists: ${this.name}`;
}

export class ConceptHasRelationsError extends Data.TaggedError('ConceptHasRelationsError')<{
	readonly conceptId: string;
	readonly relationCount: number;
	readonly relations?: string[];
}> {
	readonly displayMessage = `Cannot delete concept: has ${this.relationCount} relations`;
}

export class ConceptDatabaseError extends Data.TaggedError('ConceptDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export class ConceptUnknownError extends Data.TaggedError('ConceptUnknownError')<{
	readonly message: string;
}> {
	readonly displayMessage = `Unknown concept error: ${this.message}`;
}

export const fromUnknownConceptError = (operation: string, error: unknown): ConceptError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) {
			return new ConceptNotFound({ conceptId: 'unknown' });
		}
		if (msg.includes('unique')) {
			return new ConceptNameConflict({ name: 'unknown' });
		}
		return new ConceptDatabaseError({ operation, message: error.message });
	}
	return new ConceptUnknownError({ message: String(error) });
};

export type ConceptError =
	| ConceptNotFound
	| ConceptValidationError
	| ConceptNameConflict
	| ConceptHasRelationsError
	| ConceptDatabaseError
	| ConceptUnknownError;
