/**
 * @file Serializadores para la entidad Concept
 * @module entities/concept/serializers
 */

import { logger } from '@/lib/logger';
import { ConceptSchema, ConceptTagsSchema } from '@/types/entities/concept/schema';
import type { Concept, ConceptWithRelations, ConceptWithStats } from '@/types/entities/concept/types';

/**
 * Serializa los tags de un concepto
 */
export function serializeConceptTags(tags: string[] | null): string {
	if (!tags) return '';
	try {
		return JSON.stringify({ items: tags });
	} catch (error) {
		logger.error('Error serializando tags de concepto:', error);
		return '';
	}
}

/**
 * Deserializa los tags de un concepto
 */
export function deserializeConceptTags(tagsJson: string | null): string[] {
	if (!tagsJson) return [];
	try {
		const parsed = JSON.parse(tagsJson);
		const validated = ConceptTagsSchema.parse(parsed);
		return validated.items;
	} catch (error) {
		logger.error('Error deserializando tags de concepto:', error);
		return [];
	}
}

/**
 * Extiende un concepto con campos deserializados
 */
export function extendConcept(concept: Concept): ConceptWithRelations {
	try {
		return {
			...concept,
			tags: typeof concept.tags === 'string' ? deserializeConceptTags(concept.tags) : concept.tags || [],
			_count: concept._count || {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};
	} catch (error) {
		logger.error('Error extendiendo concepto:', error);
		throw error;
	}
}

/**
 * Enriquece un concepto con estadísticas adicionales
 */
export function extendConceptWithStats(concept: Concept): ConceptWithStats {
	try {
		// Asegurar que _count existe
		const _count = concept._count || {
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};

		return {
			...concept,
			_count,
		};
	} catch (error) {
		logger.error('Error extendiendo concepto con estadísticas:', error);
		throw error;
	}
}

/**
 * Valida un concepto usando el esquema definido
 */
export function validateConcept(concept: Concept): boolean {
	try {
		ConceptSchema.parse(concept);
		return true;
	} catch (error) {
		logger.error('Error validando concepto:', error);
		return false;
	}
}
