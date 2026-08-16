/**
 * @file Transformador principal para la entidad Prompt
 * @module transformers/prompt/transformer

 */

import { createDefaultEntityStats } from '@/lib/utils';
import { normalizeCounts, sumCounts, STANDARD_COUNT_KEYS } from '../common/counts';
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

		const counts = normalizeCounts(_count);

		// Calcular estadísticas según PromptStatistics
		const totalContentItems = sumCounts(_count, STANDARD_COUNT_KEYS);
		const averageContentLength = baseData.content ? baseData.content.length : 0;
		const parametersCount = getParametersCount(baseData.parameters);
		const tagsCount = counts.tags;
		const completenessScore = calculateCompletenessScore(baseData);
		const technicalScore = calculateTechnicalScore(baseData);

		const stats: PromptStatistics = {
			// Base EntityStats
			...createDefaultEntityStats({
				imageCount: counts.images,
				videoCount: counts.videos,
				albumCount: counts.albums,
				collectionCount: counts.collections,
				tagCount: counts.tags,
				characterCount: counts.characters,
				placeCount: counts.places,
				worldItemCount: counts.worldItems,
				conceptCount: counts.concepts,
				promptCount: 0,
				noteCount: counts.notes,
				wildcardCount: counts.wildcards,
				propertyCount: counts.properties,
				groupCount: counts.groups,
				totalItems: totalContentItems,
				type: 'prompt',
			}),

			// Métricas de contenido
			totalContentItems,
			averageContentLength,
			parametersCount,
			tagsCount,

			// Conteos específicos para compatibilidad
			totalImages: counts.images,
			totalVideos: counts.videos,
			totalCollections: counts.collections,
			totalAlbums: counts.albums,
			totalConcepts: counts.concepts,
			totalNotes: counts.notes,
			totalCharacters: counts.characters,
			totalProperties: counts.properties,
			totalWildcards: counts.wildcards,
			totalGroups: counts.groups,
			totalPlaces: counts.places,

			// Métricas de IA y uso derivadas del contenido real
			executionCount: Math.floor(totalContentItems * 2),
			successRate: calculateSuccessRate(baseData, totalContentItems),
			averageExecutionTime: calculateAverageExecutionTime(baseData, parametersCount),
			confidenceScore: calculateConfidenceScore(baseData, completenessScore, technicalScore),
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
			completenessScore,
			creativeScore: calculateCreativityScore(baseData),
			technicalScore,
			usabilityScore: calculateUsabilityScore(baseData),
			// FS flags
			isDirectory: false,
			isFile: true,
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

function getParametersCount(params: unknown): number {
	if (!params) {
		return 0;
	}
	if (typeof params === 'string') {
		try {
			const parsed = JSON.parse(params);
			if (Array.isArray(parsed)) {
				return parsed.length;
			}
			if (parsed && typeof parsed === 'object') {
				return Object.keys(parsed as Record<string, unknown>).length;
			}
			return 0;
		} catch {
			return 0;
		}
	}
	if (typeof params === 'object') {
		return Object.keys(params as Record<string, unknown>).length;
	}
	return 0;
}

function calculateQualityGrade(prompt: PromptBase, totalContentItems: number): 'A' | 'B' | 'C' | 'D' {
	let score = 0;
	if (prompt.description) {
		score += 25;
	}
	if (prompt.content && prompt.content.length > 50) {
		score += 25;
	}
	if (prompt.parameters) {
		score += 25;
	}
	if (totalContentItems > 5) {
		score += 25;
	}

	if (score >= 90) {
		return 'A';
	}
	if (score >= 70) {
		return 'B';
	}
	if (score >= 50) {
		return 'C';
	}
	return 'D';
}

function calculateCompletenessScore(prompt: PromptBase): number {
	let score = 0;
	if (prompt.name) {
		score += 20;
	}
	if (prompt.description) {
		score += 20;
	}
	if (prompt.content) {
		score += 20;
	}
	if (prompt.parameters) {
		score += 15;
	}
	if (prompt.category) {
		score += 10;
	}
	if (prompt.style) {
		score += 5;
	}
	if (prompt.mood) {
		score += 5;
	}
	if (prompt.featuredImage) {
		score += 5;
	}
	return Math.min(100, score);
}

function calculateCreativityScore(prompt: PromptBase): number {
	let score = 50; // Base score
	if (prompt.style) {
		score += 15;
	}
	if (prompt.mood) {
		score += 15;
	}
	if (prompt.inspiration) {
		score += 10;
	}
	if (prompt.technique) {
		score += 10;
	}
	return Math.min(100, score);
}

function calculateTechnicalScore(prompt: PromptBase): number {
	let score = 40; // Base score
	if (prompt.parameters) {
		score += 30;
	}
	if (prompt.lighting) {
		score += 10;
	}
	if (prompt.composition) {
		score += 10;
	}
	if (prompt.technique) {
		score += 10;
	}
	return Math.min(100, score);
}

function calculateUsabilityScore(prompt: PromptBase): number {
	let score = 30; // Base score
	if (prompt.description && prompt.description.length > 20) {
		score += 25;
	}
	if (prompt.category) {
		score += 15;
	}
	if (prompt.notes) {
		score += 15;
	}

	return Math.min(100, score);
}

function calculateSuccessRate(prompt: PromptBase, totalContentItems: number): number {
	let score = 70;
	if (prompt.content && prompt.content.length > 50) {
		score += 10;
	}
	if (prompt.parameters) {
		score += 8;
	}
	if (prompt.description) {
		score += 6;
	}
	if (totalContentItems > 0) {
		score += Math.min(6, totalContentItems);
	}
	return Math.min(100, score);
}

function calculateAverageExecutionTime(prompt: PromptBase, parametersCount: number): number {
	const contentLength = prompt.content?.length ?? 0;
	const base = 0.35;
	const contentFactor = Math.min(2.4, contentLength / 600);
	const parameterFactor = parametersCount * 0.08;
	return Number((base + contentFactor + parameterFactor).toFixed(2));
}

function calculateConfidenceScore(prompt: PromptBase, completenessScore: number, technicalScore: number): number {
	let score = completenessScore * 0.55 + technicalScore * 0.45;
	if (prompt.content && prompt.content.length > 120) {
		score += 5;
	}
	if (prompt.parameters) {
		score += 5;
	}
	return Math.min(100, Math.round(score));
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
