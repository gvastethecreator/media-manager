/**
 * Utilidades y tipos de error estándar para servicios y controladores
 */

export enum ServiceErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION = 'VALIDATION',
	INTERNAL = 'INTERNAL',
	PERMISSION = 'PERMISSION',
}

export function createEntityNotFoundError(entity: string, id?: string | number) {
	return {
		code: ServiceErrorCode.NOT_FOUND,
		message: `No se encontró la entidad '${entity}'${id ? ` con id '${id}'` : ''}.`,
		entity,
		id,
	};
}

export function toServiceError(error: unknown, code: ServiceErrorCode = ServiceErrorCode.INTERNAL) {
	return {
		code,
		message: error instanceof Error ? error.message : String(error),
		original: error,
	};
}
