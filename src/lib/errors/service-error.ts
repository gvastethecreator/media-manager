/**
 * @file Clase base para errores de servicios
 * @module lib/errors/service-error
 * @description Proporciona una clase base genérica para errores de servicios,
 * eliminando código duplicado en múltiples servicios
 */

/**
 * Clase base para errores de servicios
 * @template TCode Tipo de códigos de error permitidos
 */
export class BaseServiceError<TCode extends string = string> extends Error {
	public readonly code?: TCode;
	public readonly cause?: unknown;
	public readonly timestamp: Date;

	constructor(message: string, code?: TCode, cause?: unknown) {
		super(message);
		this.code = code;
		this.cause = cause;
		this.timestamp = new Date();
		
		// Mantener el stack trace correcto en V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Serializa el error para logging o transmisión
	 */
	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			timestamp: this.timestamp.toISOString(),
			cause: this.cause instanceof Error ? this.cause.message : this.cause,
			stack: this.stack,
		};
	}
}

/**
 * Factory para crear clases de error específicas de un servicio
 * @param serviceName Nombre del servicio
 * @returns Clase de error específica del servicio
 * 
 * @example
 * ```typescript
 * // Crear clase de error para ImageService
 * export class ImageServiceError extends createServiceErrorClass('ImageService') {}
 * 
 * // Usar en el servicio
 * throw new ImageServiceError('Image not found', 'IMAGE_NOT_FOUND');
 * ```
 */
export function createServiceErrorClass<TCode extends string = string>(serviceName: string) {
	return class ServiceError extends BaseServiceError<TCode> {
		public override readonly name = `${serviceName}Error`;
	};
}

/**
 * Factory para crear función de error de servicio
 * @param serviceName Nombre del servicio
 * @returns Función para crear errores del servicio
 * 
 * @example
 * ```typescript
 * const createImageError = createServiceErrorFactory('ImageService');
 * throw createImageError('Image not found', 'IMAGE_NOT_FOUND');
 * ```
 */
export function createServiceErrorFactory<TCode extends string = string>(serviceName: string) {
	const ErrorClass = createServiceErrorClass<TCode>(serviceName);
	
	return function createError(message: string, code?: TCode, cause?: unknown) {
		return new ErrorClass(message, code, cause);
	};
}

// Códigos de error comunes reutilizables
export const CommonErrorCodes = {
	NOT_FOUND: 'NOT_FOUND',
	INVALID_INPUT: 'INVALID_INPUT',
	ALREADY_EXISTS: 'ALREADY_EXISTS',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	TIMEOUT: 'TIMEOUT',
	NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type CommonErrorCode = typeof CommonErrorCodes[keyof typeof CommonErrorCodes];
