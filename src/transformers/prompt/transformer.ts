/**
 * @file Transformador principal para la entidad Prompt.
 * @module transformers/prompt/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos de la aplicación.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptComplete } from '@/types/entities/prompt';
import type { PropertyComplete } from '@/types/entities/property';
import type { TagComplete } from '@/types/entities/tag';
import type { VideoComplete } from '@/types/entities/video';
import type { WildcardComplete } from '@/types/entities/wildcard';
import type { WorldItemComplete } from '@/types/entities/world-item';
import { transformImagesForCard } from '../image/transformer';
import { fromDrizzleNote } from '../note/transformer';
import { fromDrizzleProperty } from '../property/transformer';
import { fromDrizzleTag } from '../tag/transformer';
import { fromDrizzleVideo } from '../video/transformer';
import { fromDrizzleWildcard } from '../wildcard/transformer';
import { fromDrizzleWorldItem } from '../world-item/transformer';

const promptTransformerLogger = serverLogger.withContext('PromptTransformer');

/**
 * 🤖 Transforma un prompt de Drizzle a PromptComplete
 */
export function fromDrizzlePrompt(promptFromDrizzle: any | null): PromptComplete | null {
	if (!promptFromDrizzle) {
		promptTransformerLogger.warn('⚠️ Prompt de Drizzle nulo o indefinido');
		return null;
	}

	try {
		promptTransformerLogger.debug(`🔄 Transformando prompt: ${promptFromDrizzle.id}`);

		const prompt: PromptComplete = {
			id: promptFromDrizzle.id,
			name: promptFromDrizzle.name,
			description: promptFromDrizzle.description,
			content: promptFromDrizzle.content,
			isPublic: promptFromDrizzle.isPublic,
			isFavorite: promptFromDrizzle.isFavorite,
			createdAt: promptFromDrizzle.createdAt,
			updatedAt: promptFromDrizzle.updatedAt,

			// Relaciones transformadas
			images: transformImagesForCard(promptFromDrizzle.images || []),
			videos: promptFromDrizzle.videos?.map(fromDrizzleVideo).filter((v): v is VideoComplete => v !== null) || [],
			tags: promptFromDrizzle.tags?.map(fromDrizzleTag).filter((t): t is TagComplete => t !== null) || [],
			notes: promptFromDrizzle.notes?.map(fromDrizzleNote).filter((n): n is any => n !== null) || [],
			wildcards:
				promptFromDrizzle.wildcards?.map(fromDrizzleWildcard).filter((w): w is WildcardComplete => w !== null) || [],
			properties:
				promptFromDrizzle.properties?.map(fromDrizzleProperty).filter((p): p is PropertyComplete => p !== null) || [],
			worldItems:
				promptFromDrizzle.worldItems?.map(fromDrizzleWorldItem).filter((w): w is WorldItemComplete => w !== null) || [],

			// Conteos
			_count: promptFromDrizzle._count || {
				images: 0,
				videos: 0,
				tags: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				worldItems: 0,
			},
		};

		promptTransformerLogger.debug(`✅ Prompt transformado: ${prompt.id}`);
		return prompt;
	} catch (error) {
		promptTransformerLogger.error(`❌ Error transformando prompt ${promptFromDrizzle.id}:`, error);
		return null;
	}
}

/**
 * 🔄 Transforma una lista de prompts de Drizzle a una lista de PromptComplete.
 *
 * @param drizzlePrompts - Un array de objetos Prompt de Drizzle.
 * @returns Un array de objetos PromptComplete.
 */
export function fromDrizzlePrompts(drizzlePrompts: any[]): PromptComplete[] {
	return drizzlePrompts.map(fromDrizzlePrompt).filter((p): p is PromptComplete => p !== null);
}

// Alias para compatibilidad con código existente
export const transformPrompt = fromDrizzlePrompt;
export const transformPrompts = fromDrizzlePrompts;
