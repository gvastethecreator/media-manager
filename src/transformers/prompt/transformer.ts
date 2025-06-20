/**
 * @file Transformadores para la entidad Prompt
 * @module transformers/prompt/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptComplete } from '@/types/entities/prompt';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('PromptTransformer');

/**
 * 🔄 Transforma un objeto Prompt de Prisma a nuestro tipo canónico PromptComplete.
 *
 * @param prismaPrompt - El objeto Prompt obtenido de Prisma.
 * @returns Un objeto PromptComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaPrompt(prismaPrompt: any): PromptComplete {
	if (!prismaPrompt) {
		throw new TransformerError('El objeto de prompt de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaPrompt;

		return {
			...baseData,
			// Asegurar que las relaciones opcionales no sean undefined
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			// Asignar el conteo de forma segura
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando prompt desde Prisma', {
			error,
			promptId: prismaPrompt?.id,
		});
		throw new TransformerError(`Error al transformar el prompt: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de prompts de Prisma a una lista de PromptComplete.
 *
 * @param prismaPrompts - Un array de objetos Prompt de Prisma.
 * @returns Un array de objetos PromptComplete.
 */
export function fromPrismaPrompts(prismaPrompts: any[]): PromptComplete[] {
	return prismaPrompts.map(fromPrismaPrompt);
}

// Alias para compatibilidad con código existente
export const transformPrompt = fromPrismaPrompt;
export const transformPrompts = fromPrismaPrompts;
export const toExtendedPrompt = fromPrismaPrompt;
export const toPromptWithStats = fromPrismaPrompt;
