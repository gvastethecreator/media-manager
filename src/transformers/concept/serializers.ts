import { serverLogger } from '@/lib/logger/server-logger';
import type {
  ConceptBase,
  ConceptComplete,
  ConceptCompleteTransform,
  ConceptExtended,
  ConceptExtendedComplete,
  ConceptWithRelations,
  ConceptWithRelationsComplete,
  ConceptWithRelationsExtendedComplete,
  ConceptWithStats
} from '@/types/entities/concept';

const serializersLogger = serverLogger.withContext('ConceptSerializers');

/**
 * Serializa un array de tags desde un string JSON
 * @param tagsString String JSON con tags
 * @returns Array de strings con los tags
 */
export function serializeTags(tagsString?: string | null): string[] {
	if (!tagsString) return [];

	try {
		if (tagsString === 'empty_array') return [];
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al serializar tags:', error);
		return [];
	}
}

/**
 * Deserializa un array de tags a string JSON
 * @param tags Array de tags
 * @returns String JSON con los tags
 */
export function deserializeTags(tags: string[]): string {
	try {
		return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar tags:', error);
		return 'empty_array';
	}
}

/**
 * Transforma un concepto con campos JSON serializados a formato completo con campos deserializados
 * @param concept Concepto con campos JSON serializados
 * @returns Concepto con campos JSON deserializados
 */
export function toConceptComplete<T extends ConceptBase>(concept: T): ConceptCompleteTransform<T> {
	try {
		return {
			...concept,
			tags: serializeTags(concept.tags),
		} as ConceptCompleteTransform<T>;
	} catch (error) {
		serializersLogger.error('❌ Error en toConceptComplete:', error);
		return {
			...concept,
			tags: [],
		} as ConceptCompleteTransform<T>;
	}
}

/**
 * Transforma un concepto con relaciones y campos JSON serializados a formato completo
 * @param concept Concepto con relaciones y campos JSON serializados
 * @returns Concepto con relaciones y campos JSON deserializados
 */
export function toConceptWithRelationsComplete(concept: ConceptWithRelations): ConceptWithRelationsComplete {
	try {
		return {
			...concept,
			tags: serializeTags(concept.tags),
		};
	} catch (error) {
		serializersLogger.error('❌ Error en toConceptWithRelationsComplete:', error);
		return {
			...concept,
			tags: [],
		} as ConceptWithRelationsComplete;
	}
}

/**
 * Transforma un concepto con campos JSON deserializados a formato con campos serializados para BD
 * @param concept Concepto con campos JSON deserializados
 * @returns Concepto con campos JSON serializados
 */
export function fromConceptComplete<T extends ConceptComplete>(concept: T): Omit<T, 'tags'> & { tags: string } {
	try {
		return {
			...concept,
			tags: deserializeTags(concept.tags),
		} as Omit<T, 'tags'> & { tags: string };
	} catch (error) {
		serializersLogger.error('❌ Error en fromConceptComplete:', error);
		return {
			...concept,
			tags: 'empty_array',
		} as Omit<T, 'tags'> & { tags: string };
	}
}

/**
 * Transforma un concepto base a un concepto extendido con propiedades para UI
 * @param concept Concepto base
 * @returns Concepto extendido
 * @deprecated Use toConceptComplete and extendConcept instead
 */
export function toExtendedConcept(concept: ConceptBase): ConceptExtended {
	return {
		...concept,
		parsedTags: serializeTags(concept.tags),
		previewContent: concept.content ? getPreviewContent(concept.content) : undefined,
		lastUpdated: concept.updatedAt instanceof Date ? concept.updatedAt : new Date(concept.updatedAt),
	};
}

/**
 * Extiende un concepto con información adicional para UI
 * @param concept Concepto base o completo
 * @returns Concepto extendido con campos adicionales para UI
 */
export function extendConcept<T extends ConceptBase | ConceptComplete>(concept: T): T & {
	previewContent?: string;
	lastUpdated?: Date;
} {
	// Generar preview del contenido
	const previewContent = concept.content ? getPreviewContent(concept.content) : undefined;

	// Asegurar formato de fecha correcto
	const lastUpdated = concept.updatedAt instanceof Date
		? concept.updatedAt
		: new Date(concept.updatedAt);

	return {
		...concept,
		previewContent,
		lastUpdated,
	};
}

/**
 * Extiende un concepto con campos JSON deserializados e información adicional para UI
 * @param concept Concepto con campos JSON deserializados
 * @returns Concepto extendido completo
 */
export function toConceptExtendedComplete(concept: ConceptComplete): ConceptExtendedComplete {
	// Generar preview del contenido
	const previewContent = concept.content ? getPreviewContent(concept.content) : undefined;

	// Asegurar formato de fecha correcto
	const lastUpdated = concept.updatedAt instanceof Date
		? concept.updatedAt
		: new Date(concept.updatedAt);

	return {
		...concept,
		previewContent,
		lastUpdated,
	};
}

/**
 * Extiende un concepto con relaciones, campos JSON deserializados e información adicional para UI
 * @param concept Concepto con relaciones y campos JSON deserializados
 * @returns Concepto con relaciones extendido completo
 */
export function toConceptWithRelationsExtendedComplete(concept: ConceptWithRelationsComplete): ConceptWithRelationsExtendedComplete {
	// Generar preview del contenido
	const previewContent = concept.content ? getPreviewContent(concept.content) : undefined;

	// Asegurar formato de fecha correcto
	const lastUpdated = concept.updatedAt instanceof Date
		? concept.updatedAt
		: new Date(concept.updatedAt);

	return {
		...concept,
		previewContent,
		lastUpdated,
	};
}

/**
 * Transforma un concepto con estadísticas a uno con estadísticas y campos JSON deserializados
 * @param concept Concepto con estadísticas
 * @returns Concepto con estadísticas y campos JSON deserializados
 */
export function toConceptWithStatsComplete(concept: ConceptWithStats): ConceptWithStats & { tags: string[] } {
	return {
		...concept,
		tags: serializeTags(concept.tags),
	};
}

/**
 * Extiende un array de conceptos con información adicional para UI
 * @param concepts Array de conceptos
 * @returns Array de conceptos extendidos
 */
export function extendConcepts<T extends ConceptBase | ConceptComplete>(concepts: T[]): ReturnType<typeof extendConcept<T>>[] {
	return concepts.map(extendConcept);
}

/**
 * Genera un preview del contenido para mostrar en UI
 * @param content Contenido completo
 * @param maxLength Longitud máxima del preview
 * @returns Preview del contenido
 */
function getPreviewContent(content: string, maxLength = 150): string {
	if (!content) return '';
	if (content.length <= maxLength) return content;

	return `${content.substring(0, maxLength)}...`;
}
