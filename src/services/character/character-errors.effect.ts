/**
 * @file Character Errors implementado con Effect
 * @module services/character/character-errors.effect
 * @description Errores específicos del servicio Character usando Data.TaggedError
 * @created 2025-10-11 - Fase 8 Effect Implementation
 */

import { Data } from 'effect';

// ============= Errores Específicos =============

/**
 * Error cuando un character no se encuentra
 */
export class CharacterNotFound extends Data.TaggedError('CharacterNotFound')<{
	readonly characterId: string;
	readonly message?: string;
}> {
	readonly displayMessage = `Character not found with ID: ${this.characterId}`;
}

/**
 * Error cuando falla la validación de datos de character
 */
export class CharacterValidationError extends Data.TaggedError('CharacterValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {
	readonly displayMessage = `Character validation failed for field '${this.field}': ${this.message}`;
}

/**
 * Error cuando hay un conflicto de nombre (duplicado)
 */
export class CharacterNameConflict extends Data.TaggedError('CharacterNameConflict')<{
	readonly name: string;
	readonly message?: string;
}> {
	readonly displayMessage = `Character with name '${this.name}' already exists`;
}

/**
 * Error cuando un character tiene relaciones que impiden borrarlo
 */
export class CharacterHasRelationsError extends Data.TaggedError('CharacterHasRelationsError')<{
	readonly characterId: string;
	readonly relationCount: number;
	readonly relations: string[];
}> {
	readonly displayMessage = `Cannot delete character: has ${this.relationCount} relations (${this.relations.join(
		', '
	)})`;
}

/**
 * Error cuando falla una operación de base de datos
 */
export class CharacterDatabaseError extends Data.TaggedError('CharacterDatabaseError')<{
	readonly operation: string;
	readonly message: string;
	readonly details?: unknown;
}> {
	readonly displayMessage = `Database error during ${this.operation}: ${this.message}`;
}

/**
 * Error cuando falla una operación de relación (images, tags, etc.)
 */
export class CharacterRelationError extends Data.TaggedError('CharacterRelationError')<{
	readonly operation: string;
	readonly characterId: string;
	readonly targetId: string;
	readonly message: string;
}> {
	readonly displayMessage = `Character relation error: ${this.message}`;
}

/**
 * Error genérico no clasificado
 */
export class CharacterUnknownError extends Data.TaggedError('CharacterUnknownError')<{
	readonly operation: string;
	readonly message: string;
	readonly details?: unknown;
}> {
	readonly displayMessage = `Unknown character error: ${this.message}`;
}

// ============= Helper Functions =============

/**
 * Crea un error de character desde un error desconocido
 */
export const fromUnknownError = (operation: string, error: unknown): CharacterError => {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('not found') || message.includes('no existe')) {
			return new CharacterNotFound({
				characterId: 'unknown',
				message: error.message,
			});
		}

		if (message.includes('unique constraint') || message.includes('duplicate')) {
			return new CharacterNameConflict({
				name: 'unknown',
				message: error.message,
			});
		}

		return new CharacterDatabaseError({
			operation,
			message: error.message,
			details: { name: error.name, stack: error.stack },
		});
	}

	return new CharacterUnknownError({
		operation,
		message: String(error),
		details: error,
	});
};

// ============= Type Union =============

/**
 * Tipo unión de todos los errores de Character
 */
export type CharacterError =
	| CharacterNotFound
	| CharacterValidationError
	| CharacterNameConflict
	| CharacterHasRelationsError
	| CharacterDatabaseError
	| CharacterRelationError
	| CharacterUnknownError;
