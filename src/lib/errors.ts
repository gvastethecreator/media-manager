import { Prisma } from '@prisma/client';
import { serverLogger } from './logger/server-logger';

// Re-exportar TransformerError y otras clases de error relacionadas desde utils/transformers/errors
// para mantener compatibilidad con el código existente
export {
    handleTransformerError, MappingError, MetadataError, RelationError, SearchError, SerializationError, TransformerError, TypeMismatchError, UIError, ValidationError
} from '@/utils/transformers/errors';

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
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Interfaz para objetos de error serializables
export interface SerializableError {
	name: string;
	message: string;
	code: EntityErrorCode;
	cause?: unknown;
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
			cause: this.cause
		};
	}
}

// Errores específicos para cada tipo de entidad
export class CharacterError extends EntityError {
	constructor(
		message: string,
		code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
		cause?: unknown
	) {
		super(message, code, cause);
		this.name = 'CharacterError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, CharacterError.prototype);
	}
}

export class ConceptError extends EntityError {
	constructor(
		message: string,
		code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
		cause?: unknown
	) {
		super(message, code, cause);
		this.name = 'ConceptError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, ConceptError.prototype);
	}
}

export class PromptError extends EntityError {
	constructor(
		message: string,
		code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
		cause?: unknown
	) {
		super(message, code, cause);
		this.name = 'PromptError';

		// Mantener la cadena de prototipos
		Object.setPrototypeOf(this, PromptError.prototype);
	}
}

// Crear errores como objetos planos (para mejor serialización en Server Actions)
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
		cause
	};
}

export function handlePrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		// Errores conocidos de Prisma
		switch (error.code) {
			case 'P2002':
				throw new StatsError('Error de unicidad en la base de datos', error);
			case 'P2025':
				throw new StatsError('Registro no encontrado', error);
			default:
				throw new StatsError(`Error de base de datos (${error.code}): ${error.message}`, error);
		}
	}
	if (error instanceof Prisma.PrismaClientValidationError) {
		throw new StatsError('Error de validación en la base de datos', error);
	}
	if (error instanceof Prisma.PrismaClientInitializationError) {
		throw new StatsError('Error al inicializar la base de datos', error);
	}
	if (error instanceof Error) {
		throw new StatsError(error.message, error);
	}
	throw new StatsError('Error desconocido en el servicio de estadísticas', error);
}
