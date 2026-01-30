/**
 * @file Prompt Result to WithStats Adapter
 * @module transformers/prompt/adapter
 */

import type { PromptStatistics, PromptWithStats } from '@/types/entities/prompt';

/**
 * Estadísticas por defecto para Prompt
 */
function defaultPromptStats(): PromptStatistics {
	const now = new Date();

	return {
		// Estadísticas de EntityStats base
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
		totalItems: 0,
		totalAssociations: 0,
		lastUpdated: now,
		lastViewed: null,
		lastModified: null,

		// Métricas de uso opcionales
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad opcionales
		qualityScore: 0.7,
		completenessScore: 0.8,

		// Estado opcionales
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: now,
		birthtime: now,
		type: 'prompt',

		// Estadísticas específicas de Prompt
		totalContentItems: 0,
		averageContentLength: 0,
		parametersCount: 0,
		tagsCount: 0,

		// Conteos específicos para compatibilidad con prompt-card
		totalImages: 0,
		totalVideos: 0,
		totalCollections: 0,
		totalAlbums: 0,
		totalConcepts: 0,
		totalNotes: 0,
		totalCharacters: 0,
		totalProperties: 0,
		totalWildcards: 0,
		totalGroups: 0,
		totalPlaces: 0,

		// Métricas de IA y uso
		executionCount: 0,
		successRate: 0.8,
		averageExecutionTime: 1000,
		confidenceScore: 0.7,
		popularityScore: 0.5,

		// Análisis temporal
		lastExecutedAt: null,
		createdThisMonth: false,
		updatedThisWeek: false,
		executedToday: false,

		// Análisis de calidad
		hasDescription: false, // Se calculará en adaptPromptToWithStats
		hasFeaturedImage: false,
		isWellStructured: true,
		qualityGrade: 'B' as const,
		creativeScore: 0.7,
		technicalScore: 0.8,
		usabilityScore: 0.7,

		// File system functions
		isDirectory: false,
		isFile: true,
	};
}

/**
 * Adapta un objeto Prompt raw de la base de datos al formato PromptWithStats
 */
export function adaptPromptToWithStats(prompt: any): PromptWithStats {
	// Calcular isFavorite basado en algún criterio simple
	const isFavorite = prompt.description ? prompt.description.includes('favorite') : false;

	// Obtener estadísticas base y personalizar
	const stats = defaultPromptStats();
	stats.hasDescription = Boolean(prompt.description);
	stats.completenessScore = prompt.description && prompt.text ? 0.9 : 0.6;

	return {
		...prompt,
		stats,
		isFavorite,
		entityType: 'prompt' as const,
	};
}

/**
 * Adapta una lista de Prompt raw al formato PromptWithStats[]
 */
export function adaptPromptListToWithStats(prompts: any[]): PromptWithStats[] {
	return prompts.map(adaptPromptToWithStats);
}
