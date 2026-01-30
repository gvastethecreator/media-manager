/**
 * @file Tipos de error para FolderService usando Effect TaggedError
 * @module services/folder/folder-errors.effect
 * @description Error types tipados para operaciones de carpetas con Effect-TS
 */

import { Data } from 'effect';

/**
 * Error cuando una carpeta no es encontrada
 */
export class FolderNotFound extends Data.TaggedError('FolderNotFound')<{
	readonly folderId: string;
}> {
	get displayMessage(): string {
		return `Carpeta no encontrada: ${this.folderId}`;
	}
}

/**
 * Error cuando se intenta crear una carpeta con un path que ya existe
 */
export class FolderPathConflict extends Data.TaggedError('FolderPathConflict')<{
	readonly path: string;
}> {
	get displayMessage(): string {
		return `Ya existe una carpeta con el path: ${this.path}`;
	}
}

/**
 * Error cuando se intenta crear una carpeta con un nombre que ya existe en el mismo padre
 */
export class FolderNameConflict extends Data.TaggedError('FolderNameConflict')<{
	readonly name: string;
	readonly parentId: string | null;
}> {
	get displayMessage(): string {
		const location = this.parentId ? `en el padre ${this.parentId}` : 'en la raíz';
		return `Ya existe una carpeta con el nombre "${this.name}" ${location}`;
	}
}

/**
 * Error cuando la validación de datos de carpeta falla
 */
export class FolderValidationError extends Data.TaggedError('FolderValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value: unknown;
}> {
	get displayMessage(): string {
		return `Error de validación en campo "${this.field}": ${this.message}`;
	}
}

/**
 * Error de operaciones de base de datos
 */
export class FolderDatabaseError extends Data.TaggedError('FolderDatabaseError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {
	get displayMessage(): string {
		const errorMsg = this.originalError instanceof Error ? this.originalError.message : String(this.originalError);
		return `Error de base de datos en operación "${this.operation}": ${errorMsg}`;
	}
}

/**
 * Error cuando se intenta eliminar una carpeta con hijos
 */
export class FolderHasChildrenError extends Data.TaggedError('FolderHasChildrenError')<{
	readonly folderId: string;
	readonly childrenCount: number;
}> {
	get displayMessage(): string {
		return `No se puede eliminar la carpeta ${this.folderId}: tiene ${this.childrenCount} subcarpeta(s)`;
	}
}

/**
 * Error cuando se intenta eliminar una carpeta con contenido (imágenes/videos)
 */
export class FolderHasContentError extends Data.TaggedError('FolderHasContentError')<{
	readonly folderId: string;
	readonly imageCount: number;
	readonly videoCount: number;
}> {
	get displayMessage(): string {
		const items = [];
		if (this.imageCount > 0) items.push(`${this.imageCount} imagen(es)`);
		if (this.videoCount > 0) items.push(`${this.videoCount} video(s)`);
		return `No se puede eliminar la carpeta ${this.folderId}: contiene ${items.join(' y ')}`;
	}
}

/**
 * Error cuando se intenta mover una carpeta a sí misma o a un descendiente
 */
export class FolderCircularReferenceError extends Data.TaggedError('FolderCircularReferenceError')<{
	readonly folderId: string;
	readonly targetParentId: string;
}> {
	get displayMessage(): string {
		return `No se puede mover la carpeta ${this.folderId} a ${this.targetParentId}: causaría una referencia circular`;
	}
}

/**
 * Error cuando se excede la profundidad máxima de jerarquía
 */
export class FolderMaxDepthExceededError extends Data.TaggedError('FolderMaxDepthExceededError')<{
	readonly currentDepth: number;
	readonly maxDepth: number;
}> {
	get displayMessage(): string {
		return `Profundidad máxima de jerarquía excedida: ${this.currentDepth} (máximo: ${this.maxDepth})`;
	}
}

/**
 * Error desconocido en operaciones de carpetas
 */
export class FolderUnknownError extends Data.TaggedError('FolderUnknownError')<{
	readonly operation: string;
	readonly originalError: unknown;
}> {
	get displayMessage(): string {
		const errorMsg = this.originalError instanceof Error ? this.originalError.message : String(this.originalError);
		return `Error desconocido en operación "${this.operation}": ${errorMsg}`;
	}
}

/**
 * Union type de todos los errores posibles de carpetas
 */
export type FolderError =
	| FolderNotFound
	| FolderPathConflict
	| FolderNameConflict
	| FolderValidationError
	| FolderDatabaseError
	| FolderHasChildrenError
	| FolderHasContentError
	| FolderCircularReferenceError
	| FolderMaxDepthExceededError
	| FolderUnknownError;

/**
 * Helper para convertir errores desconocidos a FolderError
 */
export function fromUnknownError(operation: string, error: unknown): FolderError {
	if (error instanceof Error) {
		// Detectar errores específicos por mensaje
		if (error.message.includes('UNIQUE constraint failed') && error.message.includes('path')) {
			// Extraer path del mensaje si es posible
			const pathMatch = error.message.match(/path\s*=\s*'([^']+)'/);
			const path = pathMatch?.[1] || 'unknown';
			return new FolderPathConflict({ path });
		}

		if (error.message.includes('UNIQUE constraint failed')) {
			return new FolderNameConflict({ name: 'unknown', parentId: null });
		}

		return new FolderDatabaseError({ operation, originalError: error });
	}

	return new FolderUnknownError({ operation, originalError: error });
}
