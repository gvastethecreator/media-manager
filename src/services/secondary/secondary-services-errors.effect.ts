/**
 * @file Secondary Services Errors implementado con Effect
 * @module services/secondary/secondary-services-errors.effect
 * @description Errores para Group, Wildcard, Note, Property, WorldItem
 * @created 2025-10-11 - Fase 9 Effect Implementation
 */

import { Data } from 'effect';

// ============= Group Errors =============

export class GroupNotFound extends Data.TaggedError('GroupNotFound')<{
	readonly groupId: string;
}> {
	readonly displayMessage = `Group not found: ${this.groupId}`;
}

export class GroupValidationError extends Data.TaggedError('GroupValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Group validation failed: ${this.message}`;
}

export class GroupNameConflict extends Data.TaggedError('GroupNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `Group name already exists: ${this.name}`;
}

export class GroupHasRelationsError extends Data.TaggedError('GroupHasRelationsError')<{
	readonly groupId: string;
	readonly relationCount: number;
}> {
	readonly displayMessage = `Cannot delete group: has ${this.relationCount} relations`;
}

export class GroupDatabaseError extends Data.TaggedError('GroupDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownGroupError = (operation: string, error: unknown): GroupError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new GroupNotFound({ groupId: 'unknown' });
		if (msg.includes('unique')) return new GroupNameConflict({ name: 'unknown' });
		return new GroupDatabaseError({ operation, message: error.message });
	}
	return new GroupDatabaseError({ operation, message: String(error) });
};

export type GroupError =
	| GroupNotFound
	| GroupValidationError
	| GroupNameConflict
	| GroupHasRelationsError
	| GroupDatabaseError;

// ============= Wildcard Errors =============

export class WildcardNotFound extends Data.TaggedError('WildcardNotFound')<{
	readonly wildcardId: string;
}> {
	readonly displayMessage = `Wildcard not found: ${this.wildcardId}`;
}

export class WildcardValidationError extends Data.TaggedError('WildcardValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Wildcard validation failed: ${this.message}`;
}

export class WildcardNameConflict extends Data.TaggedError('WildcardNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `Wildcard name already exists: ${this.name}`;
}

export class WildcardHasRelationsError extends Data.TaggedError('WildcardHasRelationsError')<{
	readonly wildcardId: string;
	readonly relationCount: number;
}> {
	readonly displayMessage = `Cannot delete wildcard: has ${this.relationCount} relations`;
}

export class WildcardDatabaseError extends Data.TaggedError('WildcardDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownWildcardError = (operation: string, error: unknown): WildcardError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new WildcardNotFound({ wildcardId: 'unknown' });
		if (msg.includes('unique')) return new WildcardNameConflict({ name: 'unknown' });
		return new WildcardDatabaseError({ operation, message: error.message });
	}
	return new WildcardDatabaseError({ operation, message: String(error) });
};

export type WildcardError =
	| WildcardNotFound
	| WildcardValidationError
	| WildcardNameConflict
	| WildcardHasRelationsError
	| WildcardDatabaseError;

// ============= Note Errors =============

export class NoteNotFound extends Data.TaggedError('NoteNotFound')<{
	readonly noteId: string;
}> {
	readonly displayMessage = `Note not found: ${this.noteId}`;
}

export class NoteValidationError extends Data.TaggedError('NoteValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Note validation failed: ${this.message}`;
}

export class NoteDatabaseError extends Data.TaggedError('NoteDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownNoteError = (operation: string, error: unknown): NoteError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new NoteNotFound({ noteId: 'unknown' });
		return new NoteDatabaseError({ operation, message: error.message });
	}
	return new NoteDatabaseError({ operation, message: String(error) });
};

export type NoteError = NoteNotFound | NoteValidationError | NoteDatabaseError;

// ============= Property Errors =============

export class PropertyNotFound extends Data.TaggedError('PropertyNotFound')<{
	readonly propertyId: string;
}> {
	readonly displayMessage = `Property not found: ${this.propertyId}`;
}

export class PropertyValidationError extends Data.TaggedError('PropertyValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Property validation failed: ${this.message}`;
}

export class PropertyDatabaseError extends Data.TaggedError('PropertyDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownPropertyError = (operation: string, error: unknown): PropertyError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new PropertyNotFound({ propertyId: 'unknown' });
		return new PropertyDatabaseError({ operation, message: error.message });
	}
	return new PropertyDatabaseError({ operation, message: String(error) });
};

export type PropertyError = PropertyNotFound | PropertyValidationError | PropertyDatabaseError;

// ============= WorldItem Errors =============

export class WorldItemNotFound extends Data.TaggedError('WorldItemNotFound')<{
	readonly worldItemId: string;
}> {
	readonly displayMessage = `WorldItem not found: ${this.worldItemId}`;
}

export class WorldItemValidationError extends Data.TaggedError('WorldItemValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `WorldItem validation failed: ${this.message}`;
}

export class WorldItemDatabaseError extends Data.TaggedError('WorldItemDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownWorldItemError = (operation: string, error: unknown): WorldItemError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new WorldItemNotFound({ worldItemId: 'unknown' });
		return new WorldItemDatabaseError({ operation, message: error.message });
	}
	return new WorldItemDatabaseError({ operation, message: String(error) });
};

export type WorldItemError = WorldItemNotFound | WorldItemValidationError | WorldItemDatabaseError;
