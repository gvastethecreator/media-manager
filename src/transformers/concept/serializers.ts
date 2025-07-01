/**
 * @file Serializers para la entidad Concept
 * @module transformers/concept/serializers
 * @description Funciones para serializar y deserializar datos de la entidad Concept
 */

/**
 * Deserializa tags desde un string JSON
 * @param jsonString String JSON que contiene las tags
 * @returns Array de strings con las tags
 */
export function deserializeTags(jsonString: string | undefined | null): string[] {
	if (!jsonString) return [];

	try {
		const parsed = JSON.parse(jsonString);
		if (Array.isArray(parsed)) {
			return parsed.filter((tag) => typeof tag === 'string');
		}
		return [];
	} catch (error) {
		console.warn('Error deserializando tags:', error);
		return [];
	}
}

/**
 * Serializa tags a un string JSON
 * @param tags Array de strings con las tags
 * @returns String JSON con las tags
 */
export function serializeTags(tags: string[]): string {
	return JSON.stringify(tags || []);
}
