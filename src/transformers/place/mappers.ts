/**
 * @file Funciones de mapeo para la entidad Place.
 * @module transformers/place/mappers
 * @description Mapea los tipos de datos de la aplicación a los tipos de datos de Prisma para la entidad Place.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    PlaceCreateInput,
    PlaceFilters,
    PlaceRelationInput,
    PlaceSearchOptions,
    PlaceUpdateInput,
} from '@/types/entities/place';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('PlaceMappers');

/**
 * 🔄 Mapea un `PlaceCreateInput` a un `Prisma.PlaceCreateInput`.
 * Transforma las relaciones para que Prisma las entienda (usando `connect`).
 */
export function mapCreatePlaceDataToPrisma(input: PlaceCreateInput): Prisma.PlaceCreateInput {
	try {
		const {
			images,
			videos,
			albums,
			collections,
			tags,
			characters,
			worldItems,
			concepts,
			prompts,
			notes,
			wildcards,
			properties,
			groups,
			dangers,
			resources,
			stats,
			filters,
			...rest
		} = input;

		const prismaData: Prisma.PlaceCreateInput = {
			...rest,
			// Campos JSON serializados como strings
			dangers: dangers ? JSON.stringify(dangers) : undefined,
			resources: resources ? JSON.stringify(resources) : undefined,
			stats: stats ? JSON.stringify(stats) : undefined,
			filters: filters ? JSON.stringify(filters) : rest.filters,
		};

		// Mapeo de relaciones
		if (images) prismaData.images = { connect: images.map((img) => ({ id: img.id })) };
		if (videos) prismaData.videos = { connect: videos.map((vid) => ({ id: vid.id })) };
		if (albums) prismaData.albums = { connect: albums.map((a) => ({ id: a.id })) };
		if (collections) prismaData.collections = { connect: collections.map((c) => ({ id: c.id })) };
		if (tags) prismaData.tags = { connect: tags.map((t) => ({ id: t.id })) };
		if (characters) prismaData.characters = { connect: characters.map((c) => ({ id: c.id })) };
		if (worldItems) prismaData.worldItems = { connect: worldItems.map((wi) => ({ id: wi.id })) };
		if (concepts) prismaData.concepts = { connect: concepts.map((c) => ({ id: c.id })) };
		if (prompts) prismaData.prompts = { connect: prompts.map((p) => ({ id: p.id })) };
		if (notes) prismaData.notes = { connect: notes.map((n) => ({ id: n.id })) };
		if (wildcards) prismaData.wildcards = { connect: wildcards.map((w) => ({ id: w.id })) };
		if (properties) prismaData.properties = { connect: properties.map((p) => ({ id: p.id })) };
		if (groups) prismaData.groups = { connect: groups.map((g) => ({ id: g.id })) };

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de Place', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para crear el lugar.');
	}
}

/**
 * 🔄 Mapea un `PlaceUpdateInput` a un `Prisma.PlaceUpdateInput`.
 * Maneja la lógica de conexión/desconexión de relaciones de forma segura.
 */
export function mapUpdatePlaceDataToPrisma(input: PlaceUpdateInput): Prisma.PlaceUpdateInput {
	try {
		const { connect, disconnect, ...rest } = input;
		const prismaData: Prisma.PlaceUpdateInput = { ...rest };

		const allRelationKeys = new Set([...Object.keys(connect || {}), ...Object.keys(disconnect || {})]) as Set<
			keyof PlaceRelationInput
		>;

		for (const relationKey of allRelationKeys) {
			const toConnect = connect?.[relationKey];
			const toDisconnect = disconnect?.[relationKey];

			const relationUpdate: {
				connect?: { id: string }[];
				disconnect?: { id: string }[];
			} = {};

			if (toConnect && toConnect.length > 0) {
				relationUpdate.connect = toConnect.map((item) => ({ id: item.id }));
			}
			if (toDisconnect && toDisconnect.length > 0) {
				relationUpdate.disconnect = toDisconnect.map((item) => ({ id: item.id }));
			}

			if (Object.keys(relationUpdate).length > 0) {
				// @ts-ignore - This is a safe cast because relationKey is derived from PlaceRelationInput
				prismaData[relationKey] = relationUpdate;
			}
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de Place', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para actualizar el lugar.');
	}
}

/**
 * 🔄 Mapea `PlaceSearchOptions` a `Prisma.PlaceFindManyArgs`.
 */
export function mapPlaceSearchOptionsToPrisma(options: PlaceSearchOptions): Prisma.PlaceFindManyArgs {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapPlaceFiltersToPrisma(filters) : undefined,
	};
}

/**
 * 🔄 Mapea `PlaceFilters` a `Prisma.PlaceWhereInput`.
 */
function mapPlaceFiltersToPrisma(filters: PlaceFilters): Prisma.PlaceWhereInput {
	const where: Prisma.PlaceWhereInput = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}

	if (filters.category) {
		where.category = { equals: filters.category };
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.tags && filters.tags.length > 0) {
		where.tags = { some: { id: { in: filters.tags } } };
	}

	if (filters.characters && filters.characters.length > 0) {
		where.characters = { some: { id: { in: filters.characters } } };
	}

	return where;
}
