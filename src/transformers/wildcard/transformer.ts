/**
 * @file Transformador principal para la entidad Wildcard.
 * @module transformers/wildcard/transformer
 * @description Contiene la lógica para convertir un objeto Wildcard de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { WildcardComplete } from '@/types/entities/wildcard';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import { deserializeWildcardChildren } from './serializers';

const logger = serverLogger.withContext('WildcardTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type WildcardFromPrisma = Prisma.WildcardGetPayload<{
	include: {
		parent: true;
		childWildcards: true;
		images: true;
		videos: true;
		albums: true;
		collections: true;
		tags: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		properties: true;
		groups: true;
		_count: {
			select: {
				childWildcards: true;
				images: true;
				videos: true;
				albums: true;
				collections: true;
				tags: true;
				characters: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				notes: true;
				properties: true;
				groups: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Wildcard de Prisma a nuestro tipo canónico WildcardComplete.
 *
 * @param prismaWildcard - El objeto Wildcard obtenido de Prisma.
 * @returns Un objeto WildcardComplete compatible con nuestra aplicación, o null.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaWildcard(prismaWildcard: WildcardFromPrisma | null): WildcardComplete | null {
	if (!prismaWildcard) {
		return null;
	}

	try {
		const { _count, childWildcards, ...baseData } = prismaWildcard;

		return {
			...baseData,
			// Deserializar el campo `children` que es un string JSON
			children: deserializeWildcardChildren(baseData.children),
			// Asegurarse de que las relaciones opcionales no sean undefined
			parent: baseData.parent ?? null,
			childWildcards: childWildcards ?? [],
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			// Asignar el conteo de forma segura
			_count: {
				childWildcards: _count?.childWildcards ?? 0,
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando wildcard desde Prisma', {
			error,
			wildcardId: prismaWildcard.id,
		});
		throw new TransformerError(`Error al transformar el wildcard: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de wildcards de Prisma a una lista de WildcardComplete.
 *
 * @param prismaWildcards - Un array de objetos Wildcard de Prisma.
 * @returns Un array de objetos WildcardComplete.
 */
export function fromPrismaWildcards(prismaWildcards: WildcardFromPrisma[]): WildcardComplete[] {
	return prismaWildcards.map(fromPrismaWildcard).filter(Boolean) as WildcardComplete[];
}
