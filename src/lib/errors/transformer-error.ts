/**
 * Error personalizado para transformadores
 */

export class TransformerError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, any>;
	public readonly originalError?: Error;

	constructor(message: string, code = 'TRANSFORMER_ERROR', context?: Record<string, any>, originalError?: Error) {
		super(message);
		this.name = 'TransformerError';
		this.code = code;
		this.context = context;
		this.originalError = originalError;

		// Mantiene el stack trace correcto
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, TransformerError);
		}
	}

	/**
	 * Crea un error de validación
	 */
	static validation(message: string, context?: Record<string, any>): TransformerError {
		return new TransformerError(message, 'VALIDATION_ERROR', context);
	}

	/**
	 * Crea un error de transformación
	 */
	static transformation(message: string, context?: Record<string, any>): TransformerError {
		return new TransformerError(message, 'TRANSFORMATION_ERROR', context);
	}

	/**
	 * Crea un error de serialización
	 */
	static serialization(message: string, context?: Record<string, any>): TransformerError {
		return new TransformerError(message, 'SERIALIZATION_ERROR', context);
	}

	/**
	 * Crea un error de datos faltantes
	 */
	static missingData(field: string, context?: Record<string, any>): TransformerError {
		return new TransformerError(`Required field '${field}' is missing or invalid`, 'MISSING_DATA_ERROR', {
			field,
			...context,
		});
	}

	/**
	 * Crea un error de tipo incorrecto
	 */
	static invalidType(
		field: string,
		expected: string,
		received: string,
		context?: Record<string, any>
	): TransformerError {
		return new TransformerError(
			`Field '${field}' expected type '${expected}' but received '${received}'`,
			'INVALID_TYPE_ERROR',
			{ field, expected, received, ...context }
		);
	}

	/**
	 * Envuelve un error existente
	 */
	static wrap(originalError: Error, context?: Record<string, any>): TransformerError {
		return new TransformerError(`Transformer error: ${originalError.message}`, 'WRAPPED_ERROR', context, originalError);
	}

	/**
	 * Convierte el error a un objeto JSON serializable
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			stack: this.stack,
			originalError: this.originalError
				? {
						name: this.originalError.name,
						message: this.originalError.message,
						stack: this.originalError.stack,
					}
				: undefined,
		};
	}

	/**
	 * Obtiene una representación string detallada del error
	 */
	toString(): string {
		let result = `${this.name} [${this.code}]: ${this.message}`;

		if (this.context && Object.keys(this.context).length > 0) {
			result += `\nContext: ${JSON.stringify(this.context, null, 2)}`;
		}

		if (this.originalError) {
			result += `\nOriginal Error: ${this.originalError.toString()}`;
		}

		return result;
	}
}

/**
 * Tipos de errores de transformador
 */
export enum TransformerErrorCode {
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
	SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
	MISSING_DATA_ERROR = 'MISSING_DATA_ERROR',
	INVALID_TYPE_ERROR = 'INVALID_TYPE_ERROR',
	WRAPPED_ERROR = 'WRAPPED_ERROR',
	MAPPING_ERROR = 'MAPPING_ERROR',
	METADATA_ERROR = 'METADATA_ERROR',
	RELATION_ERROR = 'RELATION_ERROR',
	SEARCH_ERROR = 'SEARCH_ERROR',
	TYPE_MISMATCH = 'TYPE_MISMATCH',
	UI_ERROR = 'UI_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Interfaz para el contexto de error
 */
export interface TransformerErrorContext {
	entityType?: string;
	entityId?: string;
	operation?: string;
	field?: string;
	expected?: string;
	received?: string;
	[key: string]: any;
}

// Additional error classes extending TransformerError
export class MappingError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'MAPPING_ERROR', context);
		this.name = 'MappingError';
	}
}

export class MetadataError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'METADATA_ERROR', context);
		this.name = 'MetadataError';
	}
}

export class RelationError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'RELATION_ERROR', context);
		this.name = 'RelationError';
	}
}

export class SearchError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'SEARCH_ERROR', context);
		this.name = 'SearchError';
	}
}

export class SerializationError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'SERIALIZATION_ERROR', context);
		this.name = 'SerializationError';
	}
}

export class TypeMismatchError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'TYPE_MISMATCH', context);
		this.name = 'TypeMismatchError';
	}
}

export class UIError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'UI_ERROR', context);
		this.name = 'UIError';
	}
}

export class ValidationError extends TransformerError {
	constructor(message: string, context?: TransformerErrorContext) {
		super(message, 'VALIDATION_ERROR', context);
		this.name = 'ValidationError';
	}
}

// Utility function for handling transformer errors
export function handleTransformerError(error: unknown, context?: TransformerErrorContext): TransformerError {
	if (error instanceof TransformerError) {
		return error;
	}

	if (error instanceof Error) {
		return new TransformerError(error.message, 'UNKNOWN_ERROR', context, error);
	}

	return new TransformerError(typeof error === 'string' ? error : 'Unknown error occurred', 'UNKNOWN_ERROR', context);
}
