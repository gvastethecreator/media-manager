/**
 * @file Transformador principal para la entidad Tag
 * @module transformers/tag/transformer
 * @description Contiene la lógica para convertir un objeto Tag de Prisma a nuestro tipo canónico.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { TagWithRelations } from '@/types/entities/tag';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('TagTransformer');

// Define el tipo de payload de Prisma que esperamos, con las relaciones y conteos.
type TagFromPrisma = Prisma.TagGetPayload<{
	include: {
		images: true;
		videos: true;
		albums: true;
		collections: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		properties: true;
		groups: true;
		_count: {
			select: {
				images: true;
				videos: true;
				albums: true;
				collections: true;
				characters: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				notes: true;
				wildcards: true;
				properties: true;
				groups: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Tag de Prisma a nuestro tipo canónico TagWithRelations.
 *
 * @param prismaTag - El objeto Tag obtenido de Prisma.
 * @returns Un objeto TagWithRelations compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaTag(prismaTag: TagFromPrisma | null): TagWithRelations {
	if (!prismaTag) {
		throw new TransformerError('El objeto de tag de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaTag;

		return {
			...baseData,
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando tag desde Prisma', {
			error,
			tagId: prismaTag.id,
		});
		throw new TransformerError(`Error al transformar el tag: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de tags de Prisma a una lista de TagWithRelations.
 *
 * @param prismaTags - Un array de objetos Tag de Prisma.
 * @returns Un array de objetos TagWithRelations.
 */
export function fromPrismaTags(prismaTags: TagFromPrisma[]): TagWithRelations[] {
	return prismaTags.map(fromPrismaTag);
}
