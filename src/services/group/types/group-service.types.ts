/**
 * @file Tipos y errores del servicio de grupos
 * @module services/group/types
 */

// Re-export de tipos externos
export type {
	GroupCreateInput,
	GroupSearchResult,
	GroupUpdateInput,
	GroupWithStats,
} from '@/types/entities/group/types';

// Códigos de error
export enum GroupErrorCode {
	NOT_FOUND = 'GROUP_NOT_FOUND',
	ALREADY_EXISTS = 'GROUP_ALREADY_EXISTS',
	INVALID_DATA = 'GROUP_INVALID_DATA',
	OPERATION_FAILED = 'GROUP_OPERATION_FAILED',
	PERMISSION_DENIED = 'GROUP_PERMISSION_DENIED',
}

/**
 * Constructor de errores para grupos
 */
export const createGroupError = (
	message: string,
	code: GroupErrorCode = GroupErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'GroupServiceError';
	Object.assign(error, { code, cause });
	return error;
};
