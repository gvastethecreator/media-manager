/**
 * Utilidades para manejo de errores relacionados con metadatos
 * @module lib/errors/metadata
 */

/**
 * Interfaz para errores de metadatos
 */
export interface MetadataErrorData {
	cause?: unknown;
	code: string;
	details?: Record<string, unknown>;
	message: string;
	name: string;
	path: string;
}

/**
 * Función para crear errores de metadatos (enfoque funcional)
 */
export function createMetadataError(
	message: string,
	path: string,
	code: string,
	details?: Record<string, unknown>,
	cause?: unknown
): MetadataErrorData {
	return {
		name: 'MetadataError',
		message,
		path,
		code,
		details,
		cause,
	};
}

/**
 * Códigos de error específicos para la extracción de metadata
 */
export enum MetadataErrorCode {
	FILE_NOT_FOUND = 'FILE_NOT_FOUND',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
	INVALID_EXIF = 'INVALID_EXIF',
	PARSING_ERROR = 'PARSING_ERROR',
	TIMEOUT = 'TIMEOUT',
	UNKNOWN = 'UNKNOWN',
}

/**
 * Convierte un error genérico a un error de metadatos
 */
export function fromError(error: unknown, path: string): MetadataErrorData {
	if (error && typeof error === 'object' && 'code' in error && 'path' in error) {
		return error as MetadataErrorData;
	}

	return createMetadataError(
		error instanceof Error ? error.message : String(error),
		path,
		MetadataErrorCode.UNKNOWN,
		undefined,
		error
	);
}

/**
 * Clase de error para problemas de metadatos
 */
export class MetadataError extends Error {
	public code: MetadataErrorCode;
	public path?: string;
	public details?: Record<string, unknown>;

	constructor(
		message: string,
		path?: string,
		code: MetadataErrorCode = MetadataErrorCode.UNKNOWN,
		details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'MetadataError';
		this.code = code;
		this.path = path;
		this.details = details;
		Object.setPrototypeOf(this, MetadataError.prototype);
	}
}
