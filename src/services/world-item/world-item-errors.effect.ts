/**
 * @file WorldItem Effect Errors
 * @module services/world-item/world-item-errors.effect
 * @description Typed errors for WorldItemService using Effect-TS Data.TaggedError pattern
 */

import { Data } from 'effect';

export class WorldItemNotFound extends Data.TaggedError('WorldItemNotFound')<{
	readonly worldItemId: string;
}> {
	readonly displayMessage = `World item not found: ${this.worldItemId}`;
}

export class WorldItemValidationError extends Data.TaggedError('WorldItemValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `World item validation failed: ${this.message}`;
}

export class WorldItemNameConflict extends Data.TaggedError('WorldItemNameConflict')<{
	readonly name: string;
}> {
	readonly displayMessage = `World item name already exists: ${this.name}`;
}

export class WorldItemHasRelationsError extends Data.TaggedError('WorldItemHasRelationsError')<{
	readonly worldItemId: string;
	readonly relationCount: number;
	readonly relations?: string[];
}> {
	readonly displayMessage = `Cannot delete world item: has ${this.relationCount} relations`;
}

export class WorldItemDatabaseError extends Data.TaggedError('WorldItemDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export class WorldItemUnknownError extends Data.TaggedError('WorldItemUnknownError')<{
	readonly message: string;
}> {
	readonly displayMessage = `Unknown world item error: ${this.message}`;
}

export const fromUnknownWorldItemError = (operation: string, error: unknown): WorldItemError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) {
			return new WorldItemNotFound({ worldItemId: 'unknown' });
		}
		if (msg.includes('unique')) {
			return new WorldItemNameConflict({ name: 'unknown' });
		}
		return new WorldItemDatabaseError({ operation, message: error.message });
	}
	return new WorldItemUnknownError({ message: String(error) });
};

export type WorldItemError =
	| WorldItemNotFound
	| WorldItemValidationError
	| WorldItemNameConflict
	| WorldItemHasRelationsError
	| WorldItemDatabaseError
	| WorldItemUnknownError;
