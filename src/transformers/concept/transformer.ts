/**
 * @file Transformador principal para la entidad Concept.
 * @module transformers/concept/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos de la aplicación.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptBase, ConceptStatistics, ConceptWithStats } from '@/types/entities/concept';

const logger = serverLogger.withContext('ConceptTransformer');

/**
 * 🧠 Transforma un concepto de Drizzle con conteos a ConceptWithStats.
 *
 * @param conceptData - Concepto base de Drizzle.
 * @param counts - Conteos de las relaciones del concepto.
 * @returns Concepto con estadísticas pre-calculadas, o null si hay error.
 */
export function fromDrizzleConcept(
	conceptData: ConceptBase | null,
	counts: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	}
): ConceptWithStats | null {
	if (!conceptData) {
		return null;
	}

	try {
		const totalAssociations =
			counts.images +
			counts.videos +
			counts.albums +
			counts.collections +
			counts.tags +
			counts.characters +
			counts.places +
			counts.worldItems +
			counts.prompts +
			counts.notes +
			counts.wildcards +
			counts.properties +
			counts.groups;

		const stats: ConceptStatistics = {
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: counts.albums,
			collectionCount: counts.collections,
			tagCount: counts.tags,
			characterCount: counts.characters,
			placeCount: counts.places,
			worldItemCount: counts.worldItems,
			promptCount: counts.prompts,
			noteCount: counts.notes,
			wildcardCount: counts.wildcards,
			propertyCount: counts.properties,
			groupCount: counts.groups,
			totalAssociations,
			lastUpdated: conceptData.updatedAt,
		};

		const _count = {
			images: counts.images,
			videos: counts.videos,
			albums: counts.albums,
			collections: counts.collections,
			tags: counts.tags,
			characters: counts.characters,
			places: counts.places,
			worldItems: counts.worldItems,
			prompts: counts.prompts,
			notes: counts.notes,
			wildcards: counts.wildcards,
			properties: counts.properties,
			groups: counts.groups,
		};

		return {
			...conceptData,
			entityType: 'concept' as const,
			statistics: stats,
			stats: stats,
			_count,
		};
	} catch (error) {
		logger.error('Error transformando concepto desde Drizzle', {
			error,
			conceptId: conceptData?.id,
		});
		return null;
	}
}

/**
 * 🔄 Transforma una lista de conceptos de Drizzle a una lista de ConceptWithStats.
 *
 * @param conceptsData - Un array de objetos Concept de Drizzle con sus conteos.
 * @returns Un array de objetos ConceptWithStats.
 */
export function fromDrizzleConcepts(
	conceptsData: Array<{
		concept: ConceptBase;
		counts: {
			images: number;
			videos: number;
			albums: number;
			collections: number;
			tags: number;
			characters: number;
			places: number;
			worldItems: number;
			prompts: number;
			notes: number;
			wildcards: number;
			properties: number;
			groups: number;
		};
	}>
): ConceptWithStats[] {
	return conceptsData
		.map(({ concept, counts }) => fromDrizzleConcept(concept, counts))
		.filter((c): c is ConceptWithStats => c !== null);
}

/**
 * 🔄 Función legacy de compatibilidad - transforma concepto con relaciones extendidas.
 * @deprecated Usar fromDrizzleConcept en su lugar.
 */
export function fromDrizzleConceptWithRelations(
	conceptData: ConceptBase | null,
	counts: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	}
): ConceptWithStats | null {
	// Delegar a la función principal
	return fromDrizzleConcept(conceptData, counts);
}
