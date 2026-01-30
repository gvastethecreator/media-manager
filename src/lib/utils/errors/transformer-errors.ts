/**
 * @file Errores específicos para transformadores
 * @module utils/errors/transformer-errors
 * @description Códigos de error y utilidades para manejar errores en transformadores
 */

import { TransformerError } from '@/lib/errors/transformer-error';

/**
 * 🔢 Códigos de error para transformadores
 */
export enum TransformerErrorCode {
	// Errores generales
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
	VALIDATION_FAILED = 'VALIDATION_FAILED',
	TRANSFORM_FAILED = 'TRANSFORM_FAILED',
	NULL_INPUT = 'NULL_INPUT',
	INVALID_INPUT = 'INVALID_INPUT',

	// Errores específicos
	MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
	TYPE_MISMATCH = 'TYPE_MISMATCH',
	INVALID_FORMAT = 'INVALID_FORMAT',
	SERIALIZATION_FAILED = 'SERIALIZATION_FAILED',
	DESERIALIZATION_FAILED = 'DESERIALIZATION_FAILED',

	// Errores de relaciones
	RELATION_NOT_FOUND = 'RELATION_NOT_FOUND',
	INVALID_RELATION = 'INVALID_RELATION',

	// Errores de operación
	OPERATION_FAILED = 'OPERATION_FAILED',
	NOT_SUPPORTED = 'NOT_SUPPORTED',
}

/**
 * ⚙️ Opciones para crear un error de transformador
 */
export interface TransformerErrorOptions {
	code: TransformerErrorCode;
	message: string;
	cause?: Error;
	context?: Record<string, unknown>;
}

/**
 * 🔨 Crea un error de transformador con código y contexto
 */
export function createTransformerError(options: TransformerErrorOptions): TransformerError {
	const { code, message, cause, context } = options;

	// Crear mensaje detallado
	let detailedMessage = `[${code}] ${message}`;

	if (cause) {
		detailedMessage += ` | Causa: ${cause.message}`;
	}

	if (context) {
		const contextStr = JSON.stringify(context, null, 2);
		detailedMessage += ` | Contexto: ${contextStr}`;
	}

	const error = new TransformerError(detailedMessage);

	// Añadir propiedades adicionales al error
	Object.assign(error, {
		code,
		cause,
		context,
		timestamp: new Date(),
	});

	return error;
}
