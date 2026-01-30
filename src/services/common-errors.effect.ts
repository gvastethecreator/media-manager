/**
 * @file Sistema de errores unificado para servicios Effect
 * @module services/common-errors
 * @description Provee clases de error comunes y helpers para todos los servicios Effect
 */

import { Data } from 'effect';

// ============================================================================
// Errores Base Comunes
// ============================================================================

/**
 * Error genérico de entidad no encontrada
 */
export class EntityNotFound extends Data.TaggedError('EntityNotFound')<{
	readonly entityType: string;
	readonly entityId: string;
	readonly message?: string;
}> {}

/**
 * Error de validación genérico
 */
export class EntityValidationError extends Data.TaggedError('EntityValidationError')<{
	readonly entityType: string;
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {}

/**
 * Error de conflicto de nombre duplicado
 */
export class EntityNameConflict extends Data.TaggedError('EntityNameConflict')<{
	readonly entityType: string;
	readonly name: string;
	readonly message?: string;
}> {}

/**
 * Error de base de datos genérico
 */
export class EntityDatabaseError extends Data.TaggedError('EntityDatabaseError')<{
	readonly entityType: string;
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error de entidad con relaciones existentes
 */
export class EntityHasRelationsError extends Data.TaggedError('EntityHasRelationsError')<{
	readonly entityType: string;
	readonly entityId: string;
	readonly relationTypes: string[];
	readonly message?: string;
}> {}

/**
 * Error de relación entre entidades
 */
export class EntityRelationError extends Data.TaggedError('EntityRelationError')<{
	readonly entityType: string;
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error desconocido genérico
 */
export class EntityUnknownError extends Data.TaggedError('EntityUnknownError')<{
	readonly entityType: string;
	readonly operation: string;
	readonly cause: unknown;
}> {}

// ============================================================================
// Helpers para conversión de errores
// ============================================================================

/**
 * Convierte un error desconocido en un error tipado de Effect
 */
export const fromUnknownError = (
	entityType: string,
	operation: string,
	error: unknown
): EntityDatabaseError | EntityUnknownError => {
	if (error instanceof Error) {
		return new EntityDatabaseError({
			entityType,
			operation,
			message: error.message,
			cause: error,
		});
	}
	return new EntityUnknownError({
		entityType,
		operation,
		cause: error,
	});
};

/**
 * Crea un error de "not found" para cualquier tipo de entidad
 */
export const createNotFoundError = (entityType: string, entityId: string, message?: string) =>
	new EntityNotFound({ entityType, entityId, message });

/**
 * Crea un error de validación para cualquier tipo de entidad
 */
export const createValidationError = (entityType: string, field: string, message: string, value?: unknown) =>
	new EntityValidationError({ entityType, field, message, value });

/**
 * Crea un error de conflicto de nombre
 */
export const createNameConflictError = (entityType: string, name: string, message?: string) =>
	new EntityNameConflict({ entityType, name, message });

// ============================================================================
// Tipos de utilidad
// ============================================================================

/**
 * Tipo unión de todos los errores comunes
 */
export type CommonEntityError =
	| EntityNotFound
	| EntityValidationError
	| EntityNameConflict
	| EntityDatabaseError
	| EntityHasRelationsError
	| EntityRelationError
	| EntityUnknownError;

/**
 * Función helper para verificar si un error es "not found"
 */
export const isNotFoundError = (error: unknown): error is EntityNotFound => error instanceof EntityNotFound;

/**
 * Función helper para verificar si un error es de validación
 */
export const isValidationError = (error: unknown): error is EntityValidationError =>
	error instanceof EntityValidationError;

/**
 * Función helper para verificar si un error es de conflicto de nombre
 */
export const isNameConflictError = (error: unknown): error is EntityNameConflict => error instanceof EntityNameConflict;
