/**
 * @file Errores tipados de Effect para AlbumService
 * @module services/album/album-errors.effect
 * @description Data.TaggedError clases para manejo de errores funcionales en AlbumService
 * @created 2025-10-11 - Fase 3 Effect Implementation
 */

import { Data } from 'effect';

/**
 * Error cuando no se encuentra un album por su ID
 */
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
	readonly albumId: string;
}> {
	get displayMessage(): string {
		return `Album no encontrado: ${this.albumId}`;
	}
}

/**
 * Error cuando se intenta crear/actualizar un album con nombre duplicado
 */
export class AlbumNameConflict extends Data.TaggedError('AlbumNameConflict')<{
	readonly name: string;
	readonly existingAlbumId?: string;
}> {
	get displayMessage(): string {
		return `Ya existe un album con el nombre: ${this.name}`;
	}
}

/**
 * Error de base de datos (queries, transactions, etc.)
 */
export class AlbumDatabaseError extends Data.TaggedError('AlbumDatabaseError')<{
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
export class AlbumValidationError extends Data.TaggedError('AlbumValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {
	get displayMessage(): string {
		return `Validación fallida en campo '${this.field}': ${this.message}`;
	}
}

/**
 * Error cuando un album no puede ser eliminado por tener relaciones activas
 */
export class AlbumHasRelationsError extends Data.TaggedError('AlbumHasRelationsError')<{
	readonly albumId: string;
	readonly relationCount: number;
	readonly relationType?: string;
}> {
	get displayMessage(): string {
		const relationInfo = this.relationType ? ` de tipo ${this.relationType}` : '';
		return `El album ${this.albumId} no puede ser eliminado porque tiene ${this.relationCount} relaciones activas${relationInfo}`;
	}
}

/**
 * Error en operaciones con relaciones (agregar/remover items, tags, etc.)
 */
export class AlbumRelationError extends Data.TaggedError('AlbumRelationError')<{
	readonly albumId: string;
	readonly relationType: string;
	readonly relationId: string;
	readonly operation: 'add' | 'remove' | 'update';
	readonly message: string;
	readonly cause?: unknown;
}> {
	get displayMessage(): string {
		const action = this.operation === 'add' ? 'agregar' : this.operation === 'remove' ? 'remover' : 'actualizar';
		return `Error al ${action} ${this.relationType} (${this.relationId}) en album ${this.albumId}: ${this.message}`;
	}
}

/**
 * Union type para todos los errores posibles del AlbumService
 */
export type AlbumError =
	| AlbumNotFound
	| AlbumNameConflict
	| AlbumDatabaseError
	| AlbumValidationError
	| AlbumHasRelationsError
	| AlbumRelationError;

/**
 * Helper para crear AlbumDatabaseError desde errores desconocidos
 */
export const fromUnknownError = (operation: string, error: unknown): AlbumDatabaseError => {
	const message = error instanceof Error ? error.message : String(error);
	return new AlbumDatabaseError({
		operation,
		message,
		cause: error,
	});
};

/**
 * Helper para verificar si un error es un AlbumError
 */
export const isAlbumError = (error: unknown): error is AlbumError => {
	return (
		error instanceof AlbumNotFound ||
		error instanceof AlbumNameConflict ||
		error instanceof AlbumDatabaseError ||
		error instanceof AlbumValidationError ||
		error instanceof AlbumHasRelationsError ||
		error instanceof AlbumRelationError
	);
};

/**
 * Helper para convertir AlbumError a response HTTP
 */
export const toHttpError = (
	error: AlbumError
): {
	status: number;
	code: string;
	message: string;
} => {
	if (error instanceof AlbumNotFound) {
		return {
			status: 404,
			code: 'ALBUM_NOT_FOUND',
			message: error.displayMessage,
		};
	}

	if (error instanceof AlbumNameConflict) {
		return {
			status: 409,
			code: 'ALBUM_NAME_CONFLICT',
			message: error.displayMessage,
		};
	}

	if (error instanceof AlbumValidationError) {
		return {
			status: 400,
			code: 'ALBUM_VALIDATION_ERROR',
			message: error.displayMessage,
		};
	}

	if (error instanceof AlbumHasRelationsError) {
		return {
			status: 409,
			code: 'ALBUM_HAS_RELATIONS',
			message: error.displayMessage,
		};
	}

	if (error instanceof AlbumRelationError) {
		return {
			status: 400,
			code: 'ALBUM_RELATION_ERROR',
			message: error.displayMessage,
		};
	}

	// AlbumDatabaseError
	return {
		status: 500,
		code: 'ALBUM_DATABASE_ERROR',
		message: error.displayMessage,
	};
};
