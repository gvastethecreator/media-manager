/**
 * @file Transformador principal para la entidad Prompt.
 * @module transformers/prompt/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptComplete, PromptFromPrisma } from '@/types/entities/prompt';
import type { PropertyComplete } from '@/types/entities/property';
import type { TagComplete } from '@/types/entities/tag';
import type { VideoComplete } from '@/types/entities/video';
import type { WildcardComplete } from '@/types/entities/wildcard';
import type { WorldItemComplete } from '@/types/entities/world-item';
import { transformImagesForCard } from '../image/transformer';
import { fromPrismaNote } from '../note/transformer';
import { fromPrismaProperty } from '../property/transformer';
import { fromPrismaTag } from '../tag/transformer';
import { fromPrismaVideo } from '../video/transformer';
import { fromPrismaWildcard } from '../wildcard/transformer';
import { fromPrismaWorldItem } from '../world-item/transformer';

const promptTransformerLogger = serverLogger.withContext('PromptTransformer');

// --- TIPO DE PAYLOAD DE PRISMA ---

export const promptPayload = {
	include: {
		images: {
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		},
		videos: true,
		albums: true,
		collections: true,
		tagEntities: true,
		characters: true,
		places: true,
		worldItems: true,
		concepts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

// export type PromptFromPrisma = Prisma.PromptGetPayload<typeof promptPayload>; // Comentado para evitar redeclaración

/**
 * 🤖 Transforma un prompt de Prisma a PromptComplete
 */
export function fromPrismaPrompt(promptFromPrisma: PromptFromPrisma | null): PromptComplete | null {
	if (!promptFromPrisma) {
		promptTransformerLogger.warn('⚠️ Prompt de Prisma nulo o indefinido');
		return null;
	}

	try {
		promptTransformerLogger.debug(`🔄 Transformando prompt: ${promptFromPrisma.id}`);

		const prompt: PromptComplete = {
			id: promptFromPrisma.id,
			name: promptFromPrisma.name,
			description: promptFromPrisma.description,
			content: promptFromPrisma.content,
			isPublic: promptFromPrisma.isPublic,
			isFavorite: promptFromPrisma.isFavorite,
			createdAt: promptFromPrisma.createdAt,
			updatedAt: promptFromPrisma.updatedAt,

			// Relaciones transformadas
			images: transformImagesForCard(promptFromPrisma.images || []),
			videos: promptFromPrisma.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
			tags: promptFromPrisma.tags?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
			notes: promptFromPrisma.notes?.map(fromPrismaNote).filter((n): n is any => n !== null) || [],
			wildcards:
				promptFromPrisma.wildcards?.map(fromPrismaWildcard).filter((w): w is WildcardComplete => w !== null) || [],
			properties:
				promptFromPrisma.properties?.map(fromPrismaProperty).filter((p): p is PropertyComplete => p !== null) || [],
			worldItems:
				promptFromPrisma.worldItems?.map(fromPrismaWorldItem).filter((w): w is WorldItemComplete => w !== null) || [],

			// Conteos
			_count: promptFromPrisma._count || {
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
		promptTransformerLogger.error(`❌ Error transformando prompt ${promptFromPrisma.id}:`, error);
		return null;
	}
}

/**
 * 🔄 Transforma una lista de prompts de Prisma a una lista de PromptComplete.
 *
 * @param prismaPrompts - Un array de objetos Prompt de Prisma.
 * @returns Un array de objetos PromptComplete.
 */
export function fromPrismaPrompts(prismaPrompts: PromptFromPrisma[]): PromptComplete[] {
	return prismaPrompts.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null);
}

// Alias para compatibilidad con código existente
export const transformPrompt = fromPrismaPrompt;
export const transformPrompts = fromPrismaPrompts;
