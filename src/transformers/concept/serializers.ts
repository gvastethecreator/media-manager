/**
 * @file Funciones de serialización para la entidad Concept
 * @module transformers/concept/serializers
 */

import { ConceptSchema } from '@/types/entities/concept/schema';
import type {
    ConceptBase,
    ConceptComplete,
    ConceptCounts,
    ConceptDeserialized,
    ConceptRelations,
    ConceptUI
} from '@/types/entities/concept/types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ConceptSerializer');

/**
 * Opciones para transformación de concept
 */
export interface ConceptTransformOptions {
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

/**
 * Serializa un concepto para Prisma
 * @param concept Concepto con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Concepto con campos serializados para Prisma
 */
export function toPrismaConcept(
	concept: Partial<ConceptComplete>,
	options: ConceptTransformOptions = {}
): any {
	try {
		const { validateFields = true } = options;

		// Validar datos si se solicita
		if (validateFields) {
			validateConcept(concept);
		}

		// Datos base
		const result: any = { ...concept };

		// Serializar tags si están presentes
		if (Array.isArray(concept.tags)) {
			result.tags = serializeTags(concept.tags);
		}

		// Eliminar campos que no van a la base de datos
		delete result._count;
		delete result._relations;
		delete result._ui;

		return result;
	} catch (error) {
		logger.error('Error serializando concept:', error);
		throw new Error(`Error serializando concept: ${(error as Error).message}`);
	}
}

/**
 * Deserializa un concepto desde Prisma
 * @param concept Concepto con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Concepto con campos deserializados
 */
export function fromPrismaConcept<T extends ConceptBase>(
	concept: T,
	options: ConceptTransformOptions = {}
): T & ConceptDeserialized & Partial<Record<'_relations' | '_count' | '_ui', any>> {
	try {
		const {
			includeRelations = false,
			includeUI = false,
			includeStats = false
		} = options;

		// Deserializar campos JSON
		const result = {
			...concept,
			tags: deserializeTags(concept.tags)
		} as T & ConceptDeserialized;

		// Agregar relaciones si están presentes y se solicitan
		if (includeRelations && (concept as any)._relations) {
			result._relations = (concept as any)._relations as ConceptRelations;
		}

		// Agregar conteos si están presentes y se solicitan
		if (includeStats && (concept as any)._count) {
			result._count = (concept as any)._count as ConceptCounts;
		}

		// Agregar campos UI si se solicitan
		if (includeUI) {
			result._ui = {
				previewContent: concept.content ? getPreviewContent(concept.content) : undefined,
				lastUpdated: concept.updatedAt instanceof Date
					? concept.updatedAt
					: new Date(concept.updatedAt)
			} as ConceptUI;
		}

		return result;
	} catch (error) {
		logger.error('Error deserializando concept:', error);
		throw new Error(`Error deserializando concept: ${(error as Error).message}`);
	}
}

/**
 * Serializa un array de tags a formato JSON
 * @param tags Array de tags
 * @returns String JSON con los tags
 */
export function serializeTags(tags: string[]): string {
	try {
		return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
	} catch (error) {
		logger.error('Error serializando tags:', error);
		return 'empty_array';
	}
}

/**
 * Deserializa tags desde un string JSON
 * @param tagsString String JSON con tags
 * @returns Array de strings con los tags
 */
export function deserializeTags(tagsString?: string | null): string[] {
	if (!tagsString) return [];

	try {
		if (tagsString === 'empty_array') return [];
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando tags:', error);
		return [];
	}
}

/**
 * Valida un concepto contra el schema
 * @param concept Concepto a validar
 * @throws Error si la validación falla
 */
export function validateConcept(concept: any): void {
	try {
		ConceptSchema.parse(concept);
	} catch (error) {
		logger.error('Error validando concept:', error);
		throw new Error(`Validación de concept fallida: ${(error as Error).message}`);
	}
}

/**
 * Extiende un concepto con campos UI adicionales
 * @param concept Concepto base
 * @returns Concepto con campos UI adicionales
 */
export function extendConcept<T extends ConceptBase | ConceptComplete>(concept: T): T & {
	_ui: ConceptUI;
} {
	try {
		return {
			...concept,
			_ui: {
				previewContent: concept.content ? getPreviewContent(concept.content) : undefined,
				lastUpdated: concept.updatedAt instanceof Date
					? concept.updatedAt
					: new Date(concept.updatedAt)
			}
		};
	} catch (error) {
		logger.error('Error extendiendo concept:', error);
		return {
			...concept,
			_ui: {
				lastUpdated: new Date()
			}
		};
	}
}

/**
 * Extiende múltiples conceptos con campos UI adicionales
 * @param concepts Array de conceptos
 * @returns Array de conceptos extendidos
 */
export function extendConcepts<T extends ConceptBase | ConceptComplete>(
	concepts: T[]
): ReturnType<typeof extendConcept<T>>[] {
	return concepts.map(concept => extendConcept(concept));
}

/**
 * Obtiene una vista previa del contenido
 * @param content Contenido completo
 * @param maxLength Longitud máxima
 * @returns Vista previa del contenido
 */
function getPreviewContent(content: string, maxLength = 150): string {
	if (!content) return '';
	return content.length > maxLength
		? `${content.substring(0, maxLength).trim()}...`
		: content.trim();
}

// Funciones obsoletas con advertencias

/**
 * @deprecated Use fromPrismaConcept en su lugar
 */
export function toConceptComplete<T extends ConceptBase>(concept: T): T & ConceptDeserialized {
	logger.warn('Función obsoleta: toConceptComplete. Use fromPrismaConcept en su lugar.');
	return fromPrismaConcept(concept);
}

/**
 * @deprecated Use fromPrismaConcept en su lugar
 */
export function toConceptWithRelationsComplete(concept: any): any {
	logger.warn('Función obsoleta: toConceptWithRelationsComplete. Use fromPrismaConcept con includeRelations=true en su lugar.');
	return fromPrismaConcept(concept, { includeRelations: true });
}

/**
 * @deprecated Use toPrismaConcept en su lugar
 */
export function fromConceptComplete<T extends ConceptComplete>(concept: T): any {
	logger.warn('Función obsoleta: fromConceptComplete. Use toPrismaConcept en su lugar.');
	return toPrismaConcept(concept);
}

/**
 * @deprecated Use fromPrismaConcept y extendConcept en su lugar
 */
export function toExtendedConcept(concept: ConceptBase): any {
	logger.warn('Función obsoleta: toExtendedConcept. Use fromPrismaConcept y extendConcept en su lugar.');
	const deserialized = fromPrismaConcept(concept);
	return extendConcept(deserialized);
}

/**
 * @deprecated Use fromPrismaConcept con includeUI=true en su lugar
 */
export function toConceptExtendedComplete(concept: any): any {
	logger.warn('Función obsoleta: toConceptExtendedComplete. Use fromPrismaConcept con includeUI=true en su lugar.');
	return fromPrismaConcept(concept, { includeUI: true });
}

/**
 * @deprecated Use fromPrismaConcept con includeRelations=true y includeUI=true en su lugar
 */
export function toConceptWithRelationsExtendedComplete(concept: any): any {
	logger.warn('Función obsoleta: toConceptWithRelationsExtendedComplete. Use fromPrismaConcept con includeRelations=true y includeUI=true en su lugar.');
	return fromPrismaConcept(concept, { includeRelations: true, includeUI: true });
}

/**
 * @deprecated Use fromPrismaConcept con includeStats=true en su lugar
 */
export function toConceptWithStatsComplete(concept: any): any {
	logger.warn('Función obsoleta: toConceptWithStatsComplete. Use fromPrismaConcept con includeStats=true en su lugar.');
	return fromPrismaConcept(concept, { includeStats: true });
}
