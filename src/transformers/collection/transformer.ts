/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 * @description Contiene la lógica para convertir un objeto Collection de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionComplete } from '@/types/entities/collection';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import { deserializeEditions, deserializeFilters, deserializeSortBy } from './serializers';

const logger = serverLogger.withContext('CollectionTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type CollectionFromPrisma = Prisma.CollectionGetPayload<{
	include: {
		images: true;
		videos: true;
		albums: true;
		tags: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		properties: true;
		groups: true;
		_count: true;
	};
}>;

/**
 * 🔄 Transforma un objeto Collection de Prisma a nuestro tipo canónico CollectionComplete.
 *
 * @param prismaCollection - El objeto Collection obtenido de Prisma.
 * @returns Un objeto CollectionComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaCollection(prismaCollection: CollectionFromPrisma | null): CollectionComplete {
	if (!prismaCollection) {
		throw new TransformerError('El objeto de colección de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaCollection;

		return {
			...baseData,

			// Deserializar campos JSON
			filters: deserializeFilters(baseData.filters),
			sortBy: deserializeSortBy(baseData.sortBy),
			editions: deserializeEditions(baseData.editions),

			// Asegurar que las relaciones no sean nulas
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],

			// Asignar conteo de forma segura
			_count: _count ?? {},
		};
	} catch (error) {
		logger.error('Error transformando colección desde Prisma', {
			error,
			collectionId: prismaCollection.id,
		});
		throw new TransformerError(`Error al transformar la colección: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de colecciones de Prisma a una lista de CollectionComplete.
 *
 * @param prismaCollections - Un array de objetos Collection de Prisma.
 * @returns Un array de objetos CollectionComplete.
 */
export function fromPrismaCollections(prismaCollections: CollectionFromPrisma[]): CollectionComplete[] {
	return prismaCollections.map(fromPrismaCollection);
}
