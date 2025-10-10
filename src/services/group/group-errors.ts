/**
 * @file Error handling para el servicio de grupos
 * @module services/group/group-errors
 * @description Códigos de error y constructor de errores para grupos
 */

/**
 * Códigos de error específicos para operaciones de grupos
 */
export enum GroupErrorCode {
	NOT_FOUND = 'GROUP_NOT_FOUND',
	ALREADY_EXISTS = 'GROUP_ALREADY_EXISTS',
	INVALID_DATA = 'GROUP_INVALID_DATA',
	OPERATION_FAILED = 'GROUP_OPERATION_FAILED',
	PERMISSION_DENIED = 'GROUP_PERMISSION_DENIED',
}

/**
 * Constructor de errores para el servicio de grupos
 *
 * @param message - Mensaje descriptivo del error
 * @param code - Código de error específico
 * @param cause - Causa original del error (opcional)
 * @returns Error tipado con información adicional
 */
export const createGroupError = (
	message: string,
	code: GroupErrorCode = GroupErrorCode.OPERATION_FAILED,
	cause?: unknown
): Error => {
	const error = new Error(message);
	error.name = 'GroupServiceError';
	Object.assign(error, { code, cause });
	return error;
};
