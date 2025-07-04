/**
 * @file Sistema de errores estandarizado para servicios
 * @module utils/errors/service-errors
 */

import { serverLogger } from '@/lib/logger/server-logger';

/**
 * Categorías de errores para servicios
 */
export enum ServiceErrorCategory {
	VALIDATION = 'validation',
	ENTITY_NOT_FOUND = 'entity_not_found',
	AUTHORIZATION = 'authorization',
	CONFLICT = 'conflict',
	EXTERNAL_SERVICE = 'external_service',
	DATABASE = 'database',
	FILE_SYSTEM = 'file_system',
	NETWORK = 'network',
	UNEXPECTED = 'unexpected',
}

/**
 * Códigos de error para servicios, agrupados por categoría
 */
export enum ServiceErrorCode {
	// Validation errors
	INVALID_INPUT = 'invalid_input',
	MISSING_REQUIRED_FIELD = 'missing_required_field',
	INVALID_FORMAT = 'invalid_format',
	INVALID_RELATION = 'invalid_relation',

	// Entity errors
	ENTITY_NOT_FOUND = 'entity_not_found',
	RELATION_NOT_FOUND = 'relation_not_found',

	// Authorization errors
	UNAUTHORIZED = 'unauthorized',
	FORBIDDEN = 'forbidden',

	// Conflict errors
	ENTITY_ALREADY_EXISTS = 'entity_already_exists',
	UNIQUE_CONSTRAINT_VIOLATION = 'unique_constraint_violation',
	FOREIGN_KEY_CONSTRAINT_VIOLATION = 'foreign_key_constraint_violation',
	CIRCULAR_REFERENCE = 'circular_reference',
	CONCURRENT_MODIFICATION = 'concurrent_modification',

	// External service errors
	EXTERNAL_SERVICE_UNAVAILABLE = 'external_service_unavailable',
	EXTERNAL_SERVICE_TIMEOUT = 'external_service_timeout',
	EXTERNAL_SERVICE_ERROR = 'external_service_error',

	// Database errors
	DATABASE_CONNECTION_ERROR = 'database_connection_error',
	DATABASE_QUERY_ERROR = 'database_query_error',
	TRANSACTION_ERROR = 'transaction_error',

	// File system errors
	FILE_NOT_FOUND = 'file_not_found',
	FILE_ACCESS_DENIED = 'file_access_denied',
	FILE_READ_ERROR = 'file_read_error',
	FILE_WRITE_ERROR = 'file_write_error',
	DIRECTORY_NOT_FOUND = 'directory_not_found',

	// Network errors
	NETWORK_ERROR = 'network_error',
	REQUEST_TIMEOUT = 'request_timeout',

	// Unexpected errors
	UNEXPECTED_ERROR = 'unexpected_error',
}

/**
 * Códigos HTTP que corresponden a los errores de servicio
 */
export const ErrorHttpStatusMap: Record<ServiceErrorCategory, number> = {
	[ServiceErrorCategory.VALIDATION]: 400,
	[ServiceErrorCategory.ENTITY_NOT_FOUND]: 404,
	[ServiceErrorCategory.AUTHORIZATION]: 403,
	[ServiceErrorCategory.CONFLICT]: 409,
	[ServiceErrorCategory.EXTERNAL_SERVICE]: 502,
	[ServiceErrorCategory.DATABASE]: 500,
	[ServiceErrorCategory.FILE_SYSTEM]: 500,
	[ServiceErrorCategory.NETWORK]: 500,
	[ServiceErrorCategory.UNEXPECTED]: 500,
};

/**
 * Interfaz para errores de servicio
 */
export interface ServiceError extends Error {
	code: ServiceErrorCode;
	category: ServiceErrorCategory;
	message: string;
	cause?: unknown;
	context?: Record<string, unknown>;
	timestamp: Date;
	httpStatus: number;
}

/**
 * Mapa para determinar la categoría de un código de error
 */
const ErrorCodeCategoryMap: Record<ServiceErrorCode, ServiceErrorCategory> = {
	// Validation errors
	[ServiceErrorCode.INVALID_INPUT]: ServiceErrorCategory.VALIDATION,
	[ServiceErrorCode.MISSING_REQUIRED_FIELD]: ServiceErrorCategory.VALIDATION,
	[ServiceErrorCode.INVALID_FORMAT]: ServiceErrorCategory.VALIDATION,
	[ServiceErrorCode.INVALID_RELATION]: ServiceErrorCategory.VALIDATION,

	// Entity errors
	[ServiceErrorCode.ENTITY_NOT_FOUND]: ServiceErrorCategory.ENTITY_NOT_FOUND,
	[ServiceErrorCode.RELATION_NOT_FOUND]: ServiceErrorCategory.ENTITY_NOT_FOUND,

	// Authorization errors
	[ServiceErrorCode.UNAUTHORIZED]: ServiceErrorCategory.AUTHORIZATION,
	[ServiceErrorCode.FORBIDDEN]: ServiceErrorCategory.AUTHORIZATION,

	// Conflict errors
	[ServiceErrorCode.ENTITY_ALREADY_EXISTS]: ServiceErrorCategory.CONFLICT,
	[ServiceErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: ServiceErrorCategory.CONFLICT,
	[ServiceErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]: ServiceErrorCategory.CONFLICT,
	[ServiceErrorCode.CIRCULAR_REFERENCE]: ServiceErrorCategory.CONFLICT,
	[ServiceErrorCode.CONCURRENT_MODIFICATION]: ServiceErrorCategory.CONFLICT,

	// External service errors
	[ServiceErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: ServiceErrorCategory.EXTERNAL_SERVICE,
	[ServiceErrorCode.EXTERNAL_SERVICE_TIMEOUT]: ServiceErrorCategory.EXTERNAL_SERVICE,
	[ServiceErrorCode.EXTERNAL_SERVICE_ERROR]: ServiceErrorCategory.EXTERNAL_SERVICE,

	// Database errors
	[ServiceErrorCode.DATABASE_CONNECTION_ERROR]: ServiceErrorCategory.DATABASE,
	[ServiceErrorCode.DATABASE_QUERY_ERROR]: ServiceErrorCategory.DATABASE,
	[ServiceErrorCode.TRANSACTION_ERROR]: ServiceErrorCategory.DATABASE,

	// File system errors
	[ServiceErrorCode.FILE_NOT_FOUND]: ServiceErrorCategory.FILE_SYSTEM,
	[ServiceErrorCode.FILE_ACCESS_DENIED]: ServiceErrorCategory.FILE_SYSTEM,
	[ServiceErrorCode.FILE_READ_ERROR]: ServiceErrorCategory.FILE_SYSTEM,
	[ServiceErrorCode.FILE_WRITE_ERROR]: ServiceErrorCategory.FILE_SYSTEM,
	[ServiceErrorCode.DIRECTORY_NOT_FOUND]: ServiceErrorCategory.FILE_SYSTEM,

	// Network errors
	[ServiceErrorCode.NETWORK_ERROR]: ServiceErrorCategory.NETWORK,
	[ServiceErrorCode.REQUEST_TIMEOUT]: ServiceErrorCategory.NETWORK,

	// Unexpected errors
	[ServiceErrorCode.UNEXPECTED_ERROR]: ServiceErrorCategory.UNEXPECTED,
};

/**
 * Opciones para crear un error de servicio
 */
export interface CreateServiceErrorOptions {
	code: ServiceErrorCode;
	message: string;
	cause?: unknown;
	context?: Record<string, unknown>;
	logLevel?: 'error' | 'warn' | 'info';
	serviceName?: string;
}

/**
 * Crea un error de servicio estandarizado
 */
export function createServiceError(options: CreateServiceErrorOptions): ServiceError {
	const { code, message, cause, context, logLevel = 'error', serviceName } = options;

	// Determinar la categoría del error basado en el código
	const category = ErrorCodeCategoryMap[code] || ServiceErrorCategory.UNEXPECTED;

	// Determinar el status HTTP correspondiente
	const httpStatus = ErrorHttpStatusMap[category];

	// Crear el objeto de error
	const error = new Error(message) as ServiceError;
	error.name = 'ServiceError';
	error.code = code;
	error.category = category;
	error.cause = cause;
	error.context = context;
	error.timestamp = new Date();
	error.httpStatus = httpStatus;

	// Registrar el error en los logs
	const logger = serviceName ? serverLogger.withContext(serviceName) : serverLogger.withContext('ServiceError');

	// Construir el mensaje de log
	const logMessage = `[${code}] ${message}`;
	const logContext = {
		errorCode: code,
		category,
		context,
		timestamp: error.timestamp,
		...(cause ? { cause: cause instanceof Error ? cause.message : String(cause) } : {}),
	};

	// Registrar según el nivel especificado
	switch (logLevel) {
		case 'warn':
			logger.warn(logMessage, logContext);
			break;
		case 'info':
			logger.info(logMessage, logContext);
			break;
		default:
			logger.error(logMessage, logContext);
			break;
	}

	return error;
}

/**
 * Determina si un error es un ServiceError
 */
export function isServiceError(error: unknown): error is ServiceError {
	return (
		error !== null &&
		typeof error === 'object' &&
		'name' in error &&
		'code' in error &&
		'category' in error &&
		error.name === 'ServiceError'
	);
}

/**
 * Convierte un error genérico a un ServiceError
 */
export function toServiceError(error: unknown, defaultOptions?: Partial<CreateServiceErrorOptions>): ServiceError {
	// Si ya es un ServiceError, retornarlo
	if (isServiceError(error)) {
		return error;
	}

	const options: CreateServiceErrorOptions = {
		code: ServiceErrorCode.UNEXPECTED_ERROR,
		message: 'Se ha producido un error inesperado',
		cause: error,
		...defaultOptions,
	};

	// Si es un error estándar, extraer mensaje y causa
	if (error instanceof Error) {
		options.message = error.message || options.message;
		options.cause = error.cause || error;
	}

	return createServiceError(options);
}

/**
 * Crea un error de entidad no encontrada
 */
export function createEntityNotFoundError(entityName: string, entityId?: string, serviceName?: string): ServiceError {
	const idText = entityId ? ` con ID "${entityId}"` : '';
	return createServiceError({
		code: ServiceErrorCode.ENTITY_NOT_FOUND,
		message: `${entityName}${idText} no encontrado`,
		context: { entityName, entityId },
		serviceName,
	});
}

/**
 * Crea un error de validación
 */
export function createValidationError(
	message: string,
	context?: Record<string, unknown>,
	serviceName?: string
): ServiceError {
	return createServiceError({
		code: ServiceErrorCode.INVALID_INPUT,
		message,
		context,
		serviceName,
	});
}

/**
 * Crea un error de archivo no encontrado
 */
export function createFileNotFoundError(
	path: string,
	context?: Record<string, unknown>,
	serviceName?: string
): ServiceError {
	return createServiceError({
		code: ServiceErrorCode.FILE_NOT_FOUND,
		message: `Archivo no encontrado: ${path}`,
		context: { path, ...context },
		serviceName,
	});
}

/**
 * Convierte un ServiceError a un objeto plano para respuestas API
 */
export function serviceErrorToResponse(error: ServiceError): {
	error: boolean;
	code: string;
	message: string;
	httpStatus: number;
} {
	return {
		error: true,
		code: error.code,
		message: error.message,
		httpStatus: error.httpStatus,
	};
}
