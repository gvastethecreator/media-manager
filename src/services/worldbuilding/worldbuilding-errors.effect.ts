/**
 * @file Worldbuilding Errors (Places, Concepts, Prompts) implementado con Effect
 * @module services/worldbuilding/worldbuilding-errors.effect
 */

import { Data } from 'effect';

// ============= Place Errors =============

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

// ============= Concept Errors =============

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

// ============= Prompt Errors =============

export class PromptNotFound extends Data.TaggedError('PromptNotFound')<{
	readonly promptId: string;
}> {
	readonly displayMessage = `Prompt not found: ${this.promptId}`;
}

export class PromptValidationError extends Data.TaggedError('PromptValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Prompt validation failed: ${this.message}`;
}

export class PromptNameConflict extends Data.TaggedError('PromptNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `Prompt name already exists: ${this.name}`;
}

export class PromptHasRelationsError extends Data.TaggedError('PromptHasRelationsError')<{
	readonly promptId: string;
	readonly relationCount: number;
	readonly relations?: string[];
}> {
	readonly displayMessage = `Cannot delete prompt: has ${this.relationCount} relations`;
}

export class PromptDatabaseError extends Data.TaggedError('PromptDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export class PromptUnknownError extends Data.TaggedError('PromptUnknownError')<{
	readonly message: string;
}> {
	readonly displayMessage = `Unknown prompt error: ${this.message}`;
}

export const fromUnknownPromptError = (operation: string, error: unknown): PromptError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) {
			return new PromptNotFound({ promptId: 'unknown' });
		}
		if (msg.includes('unique')) {
			return new PromptNameConflict({ name: 'unknown' });
		}
		return new PromptDatabaseError({ operation, message: error.message });
	}
	return new PromptUnknownError({ message: String(error) });
};

export type PromptError =
	| PromptNotFound
	| PromptValidationError
	| PromptNameConflict
	| PromptHasRelationsError
	| PromptDatabaseError
	| PromptUnknownError;
