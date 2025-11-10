/**
 * @file Errores personalizados para operaciones de colecciones
 * @module services/collection/collection-errors
 */

/**
 * Clase de error personalizada para operaciones de Collection
 */
export class CollectionServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'CollectionServiceError';
	}
}

/**
 * Helper para crear errores de colección con código y causa
 */
export const createCollectionError = (message: string, code?: string, cause?: unknown): CollectionServiceError => {
	return new CollectionServiceError(message, code, cause);
};
