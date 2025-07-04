/**
 * @file Utilidades para manejo de errores de configuración del sistema
 * @module lib/errors/settings
 */

/**
 * Interfaz para errores de configuración
 */
export interface SettingsErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Función para crear errores de configuración (enfoque funcional)
 */
export function createSettingsError(message: string, code?: string, cause?: unknown): SettingsErrorData {
	return {
		name: 'SettingsError',
		message,
		code,
		cause,
	};
}

/**
 * Verifica si un error es un SettingsErrorData
 */
export function isSettingsError(error: unknown): error is SettingsErrorData {
	return error !== null && typeof error === 'object' && 'name' in error && (error as any).name === 'SettingsError';
}
