/**
 * @file Adaptador para ConceptWithStats - Patrón estandarizado para componentes de lista
 * @module transformers/concept/adapter
 * @description Convierte datos de Drizzle a ConceptWithStats con estadísticas completas
 */

import type { ConceptBase, ConceptStatistics, ConceptWithStats } from '@/types/entities/concept';

/**
 * Estadísticas por defecto para Concept
 * Se utiliza cuando no hay datos de conteo disponibles
 */
export function defaultConceptStats(): ConceptStatistics {
	return {
		// Conteos de relaciones
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,

		// Métricas globales
		totalItems: 0,
		totalAssociations: 0,

		// Timestamps
		lastUpdated: new Date(),
		lastViewed: null,
		lastModified: null,

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: 0,
		completenessScore: 0,

		// Estado
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: new Date(),
		birthtime: new Date(),
		type: 'concept',

		// Campos específicos de ConceptStatistics
		isDirectory: false,
		isFile: true,
	};
}

/**
 * Adaptador principal: convierte ConceptBase a ConceptWithStats
 * @param concept - Objeto ConceptBase de Drizzle
 * @param counts - Conteos opcionales de relaciones
 * @returns ConceptWithStats con estadísticas calculadas
 */
export function adaptConceptWithStats(
	concept: ConceptBase,
	counts?: {
		images?: number;
		videos?: number;
		prompts?: number;
		notes?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		properties?: number;
		wildcards?: number;
		groups?: number;
		albums?: number;
		collections?: number;
		tags?: number;
	}
): ConceptWithStats {
	// Calcular el total de relaciones
	const totalRelations = counts
		? (counts.images || 0) +
			(counts.videos || 0) +
			(counts.prompts || 0) +
			(counts.notes || 0) +
			(counts.characters || 0) +
			(counts.places || 0) +
			(counts.worldItems || 0) +
			(counts.properties || 0) +
			(counts.wildcards || 0) +
			(counts.groups || 0) +
			(counts.albums || 0) +
			(counts.collections || 0) +
			(counts.tags || 0)
		: 0;

	// Calcular completeness basado en campos requeridos
	let completenessScore = 0;
	const maxScore = 8;

	// Campos básicos requeridos (peso: 1 punto cada uno)
	if (concept.name?.trim()) completenessScore += 1;
	if (concept.description?.trim()) completenessScore += 1;
	if (concept.content?.trim()) completenessScore += 1;
	if (concept.emoji?.trim()) completenessScore += 1;
	if (concept.category?.trim()) completenessScore += 1;

	// Campos de enriquecimiento (peso: 1 punto cada uno)
	if (concept.type?.trim()) completenessScore += 1;
	if (concept.applications?.trim()) completenessScore += 1;
	if (totalRelations > 0) completenessScore += 1;

	const completeness = Math.round((completenessScore / maxScore) * 100);

	// Crear estadísticas
	const stats: ConceptStatistics = {
		// Conteos de relaciones
		imageCount: counts?.images || 0,
		videoCount: counts?.videos || 0,
		albumCount: counts?.albums || 0,
		collectionCount: counts?.collections || 0,
		tagCount: counts?.tags || 0,
		characterCount: counts?.characters || 0,
		placeCount: counts?.places || 0,
		worldItemCount: counts?.worldItems || 0,
		conceptCount: 0, // Los conceptos no se relacionan consigo mismos típicamente
		promptCount: counts?.prompts || 0,
		noteCount: counts?.notes || 0,
		wildcardCount: counts?.wildcards || 0,
		propertyCount: counts?.properties || 0,
		groupCount: counts?.groups || 0,

		// Métricas globales
		totalItems: totalRelations,
		totalAssociations: totalRelations,

		// Timestamps
		lastUpdated: concept.updatedAt || new Date(),
		lastViewed: null,
		lastModified: concept.updatedAt || new Date(),

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: completeness,
		completenessScore: completeness,

		// Estado
		isDuplicate: false,
		isOrphaned: totalRelations === 0,
		needsAttention: completeness < 50,

		// Propiedades del sistema de archivos
		size: concept.content?.length || 0,
		mtime: concept.updatedAt || new Date(),
		birthtime: concept.createdAt || new Date(),
		type: 'concept',

		// Campos específicos de ConceptStatistics
		isDirectory: false,
		isFile: true,
	};

	// Crear objeto ConceptWithStats
	return {
		...concept,
		entityType: 'concept',
		stats,
		statistics: stats, // Alias para compatibilidad
		_count: counts || {
			images: 0,
			videos: 0,
			prompts: 0,
			notes: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			properties: 0,
			wildcards: 0,
			groups: 0,
			albums: 0,
			collections: 0,
			tags: 0,
		},
	};
}

/**
 * Adaptador para listas: convierte array de ConceptBase a ConceptWithStats[]
 * @param concepts - Array de objetos ConceptBase
 * @param countsMap - Mapa opcional de conteos por ID de concept
 * @returns Array de ConceptWithStats
 */
export function adaptConceptsWithStats(
	concepts: ConceptBase[],
	countsMap?: Record<
		string,
		{
			images?: number;
			videos?: number;
			prompts?: number;
			notes?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			properties?: number;
			wildcards?: number;
			groups?: number;
			albums?: number;
			collections?: number;
			tags?: number;
		}
	>
): ConceptWithStats[] {
	return concepts.map((concept) => adaptConceptWithStats(concept, countsMap?.[concept.id]));
}
