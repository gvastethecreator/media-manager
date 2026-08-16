import { serverLogger } from '@/lib/logger/server-logger';

// Re-exportar TransformerError y otras clases de error relacionadas desde utils/transformers/errors
// para mantener compatibilidad con el código existente
export {
	handleTransformerError,
	MappingError,
	MetadataError,
	RelationError,
	SearchError,
	SerializationError,
	TransformerError,
	TypeMismatchError,
	UIError,
	ValidationError,
} from '@/lib/errors/transformer-error';

const _errorLogger = serverLogger.withContext('ErrorHandler');

export class StatsError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'StatsError';
	}
}

// Códigos de error genéricos para entidades
export enum EntityErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Interfaz para objetos de error serializables
export interface SerializableError {
	cause?: unknown;
	code: EntityErrorCode;
	message: string;
	name: string;
}

// Clase base para errores de entidades
export class EntityError extends Error {
	constructor(
		message: string,
		public code: EntityErrorCode,
		public cause?: unknown
	) {
		super(message);
		this.name = 'EntityError';

		// Esto es necesario en TypeScript para mantener la cadena de prototipos
		Object.setPrototypeOf(this, EntityError.prototype);
	}

	// Método para serializar el error
	toJSON(): SerializableError {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			cause: this.cause,
		};
	}
}

// Errores específicos para cada tipo de entidad
export class CharacterError extends EntityError {
	constructor(message: string, code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED, cause?: unknown) {
		super(message, code, cause);
		this.name = 'CharacterError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, CharacterError.prototype);
	}
}

export class ConceptError extends EntityError {
	constructor(message: string, code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED, cause?: unknown) {
		super(message, code, cause);
		this.name = 'ConceptError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, ConceptError.prototype);
	}
}

export class PromptError extends EntityError {
	constructor(message: string, code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED, cause?: unknown) {
		super(message, code, cause);
		this.name = 'PromptError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, PromptError.prototype);
	}
}

/**
 * Crear errores como objetos planos (para mejor serialización en Server Actions)
 *
 * IMPORTANTE: Al pasar el parámetro 'cause', debe asegurarse de que no cree
 * una recursión infinita. No pase objetos de error directamente como cause,
 * en su lugar, extraiga solo la información necesaria.
 *
 * Ejemplo correcto:
 * ```
 * try {
 *   // ...
 * } catch (error) {
 *   const errorInfo = error instanceof Error
 *     ? { message: error.message, name: error.name }
 *     : { message: 'Error desconocido' };
 *   throw createEntityErrorObject('MyError', 'Mensaje', 'CODE', errorInfo);
 * }
 * ```
 *
 * @param name Nombre del error
 * @param message Mensaje descriptivo
 * @param code Código de error
 * @param cause Causa del error (evitar objetos complejos o recursivos)
 * @returns Objeto de error serializable
 */
export function createEntityErrorObject(
	name: string,
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
): SerializableError {
	return {
		name,
		message,
		code,
		cause,
	};
}

/**
 * Maneja errores de base de datos genéricos (reemplaza handlePrismaError)
 */
export function handleDatabaseError(error: unknown, customMessage?: string): never {
	const baseMessage = customMessage || 'Error en operación de base de datos';

	if (error instanceof Error) {
		throw new StatsError(`${baseMessage}: ${error.message}`, error);
	}
	throw new StatsError(`${baseMessage}: Unknown database error`, error);
}

export function handleNotFoundError(message: string): never {
	throw createEntityErrorObject('NotFoundError', message, EntityErrorCode.NOT_FOUND);
}
