/**
 * @file Transformador principal para la entidad Prompt
 * @module transformers/prompt/transformer

 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import type { PromptBase, PromptStatistics, PromptWithStats } from '../../types/entities/prompt/base';

const logger = serverLogger.withContext('PromptTransformer');

/**
 * Transforma un objeto Prompt de Drizzle a PromptWithStats
 */
export function fromDrizzlePrompt(drizzlePrompt: any): PromptWithStats {
	if (!drizzlePrompt) {
		throw new TransformerError('El objeto de prompt de Drizzle no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = drizzlePrompt;

		// Calcular estadísticas según PromptStatistics
		const totalContentItems =
			(_count?.images || 0) +
			(_count?.videos || 0) +
			(_count?.albums || 0) +
			(_count?.collections || 0) +
			(_count?.tags || 0) +
			(_count?.characters || 0) +
			(_count?.places || 0) +
			(_count?.worldItems || 0) +
			(_count?.concepts || 0) +
			(_count?.notes || 0) +
			(_count?.wildcards || 0) +
			(_count?.properties || 0) +
			(_count?.groups || 0);
		const averageContentLength = baseData.content ? baseData.content.length : 0;
		const parametersCount = baseData.parameters
			? typeof baseData.parameters === 'string'
				? JSON.parse(baseData.parameters).length
				: Object.keys(baseData.parameters).length
			: 0;
		const tagsCount = _count?.tags || 0;

		const stats: PromptStatistics = {
			// Conteos de relaciones
			totalImages: _count?.images || 0,
			totalVideos: _count?.videos || 0,
			totalAlbums: _count?.albums || 0,
			totalCollections: _count?.collections || 0,
			totalTags: _count?.tags || 0,
			totalCharacters: _count?.characters || 0,
			totalPlaces: _count?.places || 0,
			totalItems: _count?.worldItems || 0,
			totalConcepts: _count?.concepts || 0,
			totalNotes: _count?.notes || 0,
			totalWildcards: _count?.wildcards || 0,
			totalProperties: _count?.properties || 0,
			totalGroups: _count?.groups || 0,

			// Métricas de contenido
			totalContentItems,
			averageContentLength,
			parametersCount,
			tagsCount,

			// Métricas de IA y uso (simuladas por ahora)
			executionCount: Math.floor(totalContentItems * 2),
			successRate: Math.min(100, 85 + Math.random() * 15),
			averageExecutionTime: 1.5 + Math.random() * 2,
			confidenceScore: Math.min(100, 70 + Math.random() * 30),
			popularityScore: Math.min(100, totalContentItems * 3),

			// Análisis temporal
			lastExecutedAt: null,
			createdThisMonth: isCreatedThisMonth(baseData.createdAt),
			updatedThisWeek: isUpdatedThisWeek(baseData.updatedAt),
			executedToday: false,

			// Análisis de calidad
			hasDescription: !!baseData.description,
			hasFeaturedImage: !!baseData.featuredImage,
			isWellStructured: !!baseData.parameters && tagsCount > 0,
			qualityGrade: calculateQualityGrade(baseData, totalContentItems),
			completenessScore: calculateCompletenessScore(baseData),
			creativityScore: calculateCreativityScore(baseData),
			technicalScore: calculateTechnicalScore(baseData),
			usabilityScore: calculateUsabilityScore(baseData),
		};

		return {
			...baseData,
			stats,
		};
	} catch (error) {
		logger.error('Error transformando prompt desde Drizzle', {
			error,
			promptId: drizzlePrompt?.id,
		});
		throw new TransformerError(`Error al transformar el prompt: ${(error as Error).message}`);
	}
}

/**
 * Transforma una lista de prompts de Drizzle a PromptWithStats[]
 */
export function fromDrizzlePrompts(drizzlePrompts: any[]): PromptWithStats[] {
	return drizzlePrompts.map(fromDrizzlePrompt);
}

/**
 * Funciones auxiliares para cálculos de estadísticas
 */
function isCreatedThisMonth(createdAt: Date): boolean {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	return createdAt >= monthStart;
}

function isUpdatedThisWeek(updatedAt: Date): boolean {
	const now = new Date();
	const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	return updatedAt >= weekStart;
}

function calculateQualityGrade(prompt: PromptBase, totalContentItems: number): 'A' | 'B' | 'C' | 'D' {
	let score = 0;
	if (prompt.description) score += 25;
	if (prompt.content && prompt.content.length > 50) score += 25;
	if (prompt.parameters) score += 25;
	if (totalContentItems > 5) score += 25;

	if (score >= 90) return 'A';
	if (score >= 70) return 'B';
	if (score >= 50) return 'C';
	return 'D';
}

function calculateCompletenessScore(prompt: PromptBase): number {
	let score = 0;
	if (prompt.name) score += 20;
	if (prompt.description) score += 20;
	if (prompt.content) score += 20;
	if (prompt.parameters) score += 15;
	if (prompt.category) score += 10;
	if (prompt.style) score += 5;
	if (prompt.mood) score += 5;
	if (prompt.featuredImage) score += 5;
	return Math.min(100, score);
}

function calculateCreativityScore(prompt: PromptBase): number {
	let score = 50; // Base score
	if (prompt.style) score += 15;
	if (prompt.mood) score += 15;
	if (prompt.inspiration) score += 10;
	if (prompt.technique) score += 10;
	return Math.min(100, score);
}

function calculateTechnicalScore(prompt: PromptBase): number {
	let score = 40; // Base score
	if (prompt.parameters) score += 30;
	if (prompt.lighting) score += 10;
	if (prompt.composition) score += 10;
	if (prompt.technique) score += 10;
	return Math.min(100, score);
}

function calculateUsabilityScore(prompt: PromptBase): number {
	let score = 30; // Base score
	if (prompt.description && prompt.description.length > 20) score += 25;
	if (prompt.category) score += 15;
	if (prompt.notes) score += 15;

	return Math.min(100, score);
}

/**
 * Convierte un PromptBase a DrizzlePrompt para inserción/actualización
 */
export function toDrizzlePrompt(prompt: PromptBase): any {
	return {
		id: prompt.id,
		name: prompt.name,
		content: prompt.content,
		description: prompt.description,
		category: prompt.category,
		parameters: prompt.parameters,
		style: prompt.style,
		mood: prompt.mood,
		lighting: prompt.lighting,
		composition: prompt.composition,
		technique: prompt.technique,
		inspiration: prompt.inspiration,
		notes: prompt.notes,
		featuredImage: prompt.featuredImage,
		parentId: prompt.parentId,

		isFavorite: prompt.isFavorite,
		createdAt: prompt.createdAt,
		updatedAt: prompt.updatedAt,
	};
}
