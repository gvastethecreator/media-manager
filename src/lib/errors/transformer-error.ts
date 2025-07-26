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
