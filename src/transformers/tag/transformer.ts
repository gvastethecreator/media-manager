/**
 * @file Transformador principal para la entidad Tag
 * @module transformers/tag/transformer
 * @description Contiene la lógica para convertir un objeto Tag de Prisma a nuestro tipo canónico TagComplete.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { TagComplete } from '@/types/entities/tag';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
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
 * 🔄 Transforma un objeto Tag de Prisma a nuestro tipo canónico TagComplete.
 *
 * @param prismaTag - El objeto Tag obtenido de Prisma, que debe incluir relaciones y conteos.
 * @returns Un objeto TagComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaTag(prismaTag: TagFromPrisma | null): TagComplete {
	if (!prismaTag) {
		throw new TransformerError('El objeto de etiqueta de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaTag;

		return {
			...baseData,
			description: baseData.description ?? null,
			shortcut: baseData.shortcut ?? null,
			featuredImage: baseData.featuredImage ?? null,
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
		serverLogger.error('Error transformando etiqueta desde Prisma', {
			error,
			tagId: prismaTag.id,
		});
		throw new TransformerError(
			`Error al transformar la etiqueta: ${(error as Error).message}`
		);
	}
}

/**
 * 🔄 Transforma una lista de etiquetas de Prisma a una lista de TagComplete.
 *
 * @param prismaTags - Un array de objetos Tag de Prisma.
 * @returns Un array de objetos TagComplete.
 */
export function fromPrismaTags(prismaTags: TagFromPrisma[]): TagComplete[] {
	return prismaTags.map(fromPrismaTag);
}