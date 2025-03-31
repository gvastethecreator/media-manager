/**
 * @file Funciones de serialización para la entidad Concept
 * @module transformers/concept/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { ConceptSchema } from '@/types/entities/concept/schema';
import type {
    ConceptBase,
    ConceptComplete,
    ConceptCounts,
    ConceptDeserialized,
    ConceptRelations,
    ConceptUI
} from '@/types/entities/concept/types';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('ConceptSerializer');

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
): Prisma.ConceptCreateInput | Prisma.ConceptUpdateInput {
	try {
		const { validateFields = true } = options;

		// Validar datos si se solicita
		if (validateFields) {
			validateConcept(concept);
		}

		// Filtrar campos que no van a la base de datos
		const fieldsToExclude = ['_count', '_relations', '_ui'];

		// Crear objeto limpio sin los campos excluidos
		const filteredConcept = Object.fromEntries(
			Object.entries(concept).filter(([key]) => !fieldsToExclude.includes(key))
		);

		// Serializar tags si están presentes
		const result: Record<string, any> = { ...filteredConcept };
		if (Array.isArray(concept.tags)) {
			result.tags = serializeTags(concept.tags);
		}

		return result as Prisma.ConceptCreateInput | Prisma.ConceptUpdateInput;
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
export function validateConcept(concept: unknown): void {
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
 * Obtiene una versión truncada del contenido para previsualización
 * @param content Contenido completo
 * @param maxLength Longitud máxima para la previsualización
 * @returns Contenido truncado para previsualización
 */
function getPreviewContent(content: string, maxLength = 150): string {
	if (!content) return '';
	return content.length > maxLength
		? `${content.substring(0, maxLength).trim()}...`
		: content;
}

/**
 * Convierte un concepto base a concepto completo
 */
export function toConceptComplete<T extends ConceptBase>(concept: T): T & ConceptDeserialized {
	return fromPrismaConcept(concept, {
		deserializeFields: true
	});
}

/**
 * Convierte un concepto a concepto con relaciones completas
 */
export function toConceptWithRelationsComplete(concept: ConceptBase): ConceptComplete {
	return fromPrismaConcept(concept, {
		deserializeFields: true,
		includeRelations: true
	}) as ConceptComplete;
}

/**
 * Convierte un concepto completo a concepto serializado
 */
export function fromConceptComplete<T extends ConceptComplete>(concept: T): Prisma.ConceptCreateInput | Prisma.ConceptUpdateInput {
	return toPrismaConcept(concept);
}

/**
 * Convierte un concepto base a concepto extendido
 */
export function toExtendedConcept(concept: ConceptBase): ConceptBase & {
	_ui: ConceptUI;
} {
	return extendConcept(concept);
}

/**
 * Convierte un concepto a concepto extendido completo
 */
export function toConceptExtendedComplete(concept: ConceptBase): ConceptBase & ConceptDeserialized & {
	_ui: ConceptUI;
} {
	return extendConcept(toConceptComplete(concept));
}

/**
 * Convierte un concepto a concepto con relaciones extendido completo
 */
export function toConceptWithRelationsExtendedComplete(concept: ConceptBase): ConceptComplete & {
	_ui: ConceptUI;
} {
	return extendConcept(toConceptWithRelationsComplete(concept)) as ConceptComplete & {
		_ui: ConceptUI;
	};
}

/**
 * Convierte un concepto a concepto con estadísticas completo
 */
export function toConceptWithStatsComplete(concept: ConceptBase): ConceptComplete {
	return fromPrismaConcept(concept, {
		deserializeFields: true,
		includeStats: true
	}) as ConceptComplete;
}
