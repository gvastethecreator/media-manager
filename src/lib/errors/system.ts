/**
 * @file Utilidades para manejo de errores del sistema
 * @module lib/errors/system
 */

/**
 * Interfaz para errores del sistema
 */
export interface SystemErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores del sistema (enfoque funcional)
 */
export function createSystemError(message: string, code?: string, cause?: unknown): SystemErrorData {
	return {
		name: 'SystemError',
		message,
		code,
		cause,
	};
}

/**
 * Verifica si un error es un SystemErrorData
 */
export function isSystemError(error: unknown): error is SystemErrorData {
	return error !== null && typeof error === 'object' && 'name' in error && (error as any).name === 'SystemError';
}
