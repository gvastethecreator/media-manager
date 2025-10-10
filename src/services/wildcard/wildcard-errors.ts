/**
 * @file Errores personalizados para operaciones de wildcards
 * @module services/wildcard/wildcard-errors
 */

import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';

/**
 * Clase de error personalizada para operaciones de Wildcard
 */
export class WildcardServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'WildcardServiceError';
	}
}

/**
 * Función auxiliar para crear errores de wildcard
 */
export const createWildcardError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('WildcardError', message, code, cause);
};
