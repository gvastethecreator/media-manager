/**
 * @file Transformador principal para la entidad Prompt
 * @module transformers/prompt/transformer
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { PromptBase, PromptStatistics, PromptWithStats } from '@/types/entities/prompt';

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

		const wordCount = baseData.content ? baseData.content.split(/\s+/).length : 0;
		const parameterCount = baseData.parameters ? Object.keys(baseData.parameters).length : 0;

		const stats: PromptStatistics = {
			useCount: _count?.uses || 0,
			favoriteCount: _count?.favorites || 0,
			shareCount: _count?.shares || 0,
			wordCount,
			parameterCount,
			tagCount: baseData.tags ? baseData.tags.length : 0,
			lastUsed: _count?.lastUsed || undefined,
			popularity: Math.min(100, ((_count?.uses || 0) / 10) * 100),
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
 * Convierte un PromptBase a DrizzlePrompt para inserción/actualización
 */
export function toDrizzlePrompt(prompt: PromptBase): any {
	return {
		id: prompt.id,
		title: prompt.title,
		content: prompt.content,
		description: prompt.description,
		category: prompt.category,
		tags: prompt.tags,
		parameters: prompt.parameters,
		isPublic: prompt.isPublic,
		isFavorite: prompt.isFavorite,
		createdAt: prompt.createdAt,
		updatedAt: prompt.updatedAt,
	};
}
