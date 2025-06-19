/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 * @description Contiene la lógica para convertir un objeto Collection de Prisma a nuestro tipo canónico.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionComplete } from '@/types/entities/collection';
import { TransformerError } from '@/utils/transformers/errors';
import { deserializeEditions, deserializeFilters, deserializeSortBy } from './serializers';

const logger = serverLogger.withContext('CollectionTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type CollectionFromPrisma = Prisma.CollectionGetPayload<{
	include: {
		images: true;
		videos: true;
		tags: true;
		groups: true;
		properties: true;
		wildcards: true;
		parent: true;
		children: true;
		albums: true;
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
			tags: baseData.tags ?? [],
			groups: baseData.groups ?? [],
			properties: baseData.properties ?? [],
			wildcards: baseData.wildcards ?? [],
			parent: baseData.parent ?? null,
			children: baseData.children ?? [],
			albums: baseData.albums ?? [],

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
