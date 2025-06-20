/**
 * @file Transformador principal para la entidad Place.
 * @module transformers/place/transformer
 * @description Contiene la lógica para convertir un objeto Place de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { PlaceComplete } from '@/types/entities/place';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('PlaceTransformer');

/**
 * 🔄 Transforma un objeto Place de Prisma a nuestro tipo canónico PlaceComplete.
 *
 * @param prismaPlace - El objeto Place obtenido de Prisma.
 * @returns Un objeto PlaceComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaPlace(prismaPlace: any): PlaceComplete {
	if (!prismaPlace) {
		throw new TransformerError('El objeto de lugar de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaPlace;

		return {
			...baseData,
			// Deserializar campos JSON si es necesario
			dangers: typeof baseData.dangers === 'string' ? baseData.dangers : JSON.stringify(baseData.dangers || []),
			resources: typeof baseData.resources === 'string' ? baseData.resources : JSON.stringify(baseData.resources || []),
			stats: typeof baseData.stats === 'string' ? baseData.stats : JSON.stringify(baseData.stats || {}),
			filters: typeof baseData.filters === 'string' ? baseData.filters : JSON.stringify(baseData.filters || {}),
			// Asegurar que las relaciones opcionales no sean undefined
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
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
		logger.error('Error transformando lugar desde Prisma', {
			error,
			placeId: prismaPlace?.id,
		});
		throw new TransformerError(`Error al transformar el lugar: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de lugares de Prisma a una lista de PlaceComplete.
 *
 * @param prismaPlaces - Un array de objetos Place de Prisma.
 * @returns Un array de objetos PlaceComplete.
 */
export function fromPrismaPlaces(prismaPlaces: any[]): PlaceComplete[] {
	return prismaPlaces.map(fromPrismaPlace);
}

// Funciones auxiliares para deserialización
function _deserializePlaceDangers(dangers: string): string {
	try {
		return typeof dangers === 'string' ? dangers : JSON.stringify(dangers || []);
	} catch {
		return '[]';
	}
}

function _deserializePlaceResources(resources: string): string {
	try {
		return typeof resources === 'string' ? resources : JSON.stringify(resources || []);
	} catch {
		return '[]';
	}
}

function _deserializePlaceStats(stats: string): string {
	try {
		return typeof stats === 'string' ? stats : JSON.stringify(stats || {});
	} catch {
		return '{}';
	}
}

function _deserializePlaceFilters(filters: string): string {
	try {
		return typeof filters === 'string' ? filters : JSON.stringify(filters || {});
	} catch {
		return '{}';
	}
}
