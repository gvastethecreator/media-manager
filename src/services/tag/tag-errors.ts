/**
 * @file Error handling para el servicio de etiquetas
 * @module services/tag/tag-errors
 * @description Clase de error y utilidades para manejo de errores de tags
 */

/**
 * Clase de error personalizada para operaciones de Tag
 */
export class TagServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'TagServiceError';
	}
}

/**
 * Crea un error de servicio de tag con contexto
 *
 * @param message - Mensaje descriptivo del error
 * @param code - Código de error opcional
 * @param cause - Causa original del error
 * @returns Error tipado TagServiceError
 */
export const createTagError = (message: string, code?: string, cause?: unknown): TagServiceError => {
	return new TagServiceError(message, code, cause);
};
