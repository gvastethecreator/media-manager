/**
 * Clase personalizada para errores de metadata
 * Proporciona información detallada sobre errores en el procesamiento de metadata
 */
export class MetadataError extends Error {
	constructor(
		message: string,
		public readonly path: string,
		public readonly code: string,
		public readonly details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'MetadataError';
	}
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
