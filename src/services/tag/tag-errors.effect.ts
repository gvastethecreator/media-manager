/**
 * @file Errores tipados de Effect para TagService
 * @module services/tag/tag-errors.effect
 * @description Data.TaggedError clases para manejo de errores funcionales en TagService
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Data } from 'effect';

/**
 * Error cuando no se encuentra un tag por su ID
 */
export class TagNotFound extends Data.TaggedError('TagNotFound')<{
	readonly tagId: string;
	readonly message?: string;
}> {
	get displayMessage(): string {
		return this.message ?? `Tag no encontrado: ${this.tagId}`;
	}
}

/**
 * Error cuando se intenta crear/actualizar un tag con nombre duplicado
 */
export class TagNameConflict extends Data.TaggedError('TagNameConflict')<{
	readonly name: string;
	readonly existingTagId?: string;
	readonly message?: string;
}> {
	get displayMessage(): string {
		return this.message ?? `Ya existe un tag con el nombre: ${this.name}`;
	}
}

/**
 * Error de base de datos (queries, transactions, etc.)
 */
export class TagDatabaseError extends Data.TaggedError('TagDatabaseError')<{
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {
	get displayMessage(): string {
		return `Error en operación de BD (${this.operation}): ${this.message}`;
	}
}

/**
 * Error de validación de datos de entrada
 */
export class TagValidationError extends Data.TaggedError('TagValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {
	get displayMessage(): string {
		return `Validación fallida en campo '${this.field}': ${this.message}`;
	}
}

/**
 * Error cuando un tag no puede ser eliminado por tener relaciones activas
 */
export class TagHasRelationsError extends Data.TaggedError('TagHasRelationsError')<{
	readonly tagId: string;
	readonly relationCount: number;
	readonly message?: string;
}> {
	get displayMessage(): string {
		return (
			this.message ??
			`El tag ${this.tagId} no puede ser eliminado porque tiene ${this.relationCount} relaciones activas`
		);
	}
}

/**
 * Union type para todos los errores posibles del TagService
 */
export type TagError =
	| TagNotFound
	| TagNameConflict
	| TagDatabaseError
	| TagValidationError
	| TagHasRelationsError;

/**
 * Helper para crear TagDatabaseError desde errores desconocidos
 */
export const fromUnknownError = (operation: string, error: unknown): TagDatabaseError => {
	const message = error instanceof Error ? error.message : String(error);
	return new TagDatabaseError({
		operation,
		message,
		cause: error,
	});
};

/**
 * Helper para verificar si un error es un TagError
 */
export const isTagError = (error: unknown): error is TagError => {
	return (
		error instanceof TagNotFound ||
		error instanceof TagNameConflict ||
		error instanceof TagDatabaseError ||
		error instanceof TagValidationError ||
		error instanceof TagHasRelationsError
	);
};
