/**
 * @file Errores personalizados para operaciones de personajes
 * @module services/character/character-errors
 */

/**
 * Clase de error personalizada para operaciones de Character
 */
export class CharacterServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'CharacterServiceError';
	}
}

/**
 * Helper para crear errores de personaje con código y causa
 */
export const createCharacterError = (message: string, code?: string, cause?: unknown): CharacterServiceError => {
	return new CharacterServiceError(message, code, cause);
};
