/**
 * @file Transformador principal para la entidad Place.
 * @module transformers/place/transformer
 * @description Contiene la lógica para convertir un objeto Place de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { PlaceComplete } from '@/types/entities/place';
import { TransformerError } from '@/utils/transformers/errors';
import {
	deserializePlaceDangers,
	deserializePlaceFilters,
	deserializePlaceResources,
	deserializePlaceStats,
} from './serializers';

const logger = serverLogger.withContext('PlaceTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
interface PlaceFromPrisma {
	id: string;
	name: string;
	description: string | null;
	category: string;
	type: string;
	region: string | null;
	location: string | null;
	history: string | null;
	climate: string | null;
	culture: string | null;
	government: string | null;
	economy: string | null;
	dangers: string;
	resources: string;
	stats: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	// Relaciones
	images: any[];
	videos: any[];
	albums: any[];
	collections: any[];
	tags: any[];
	characters: any[];
	worldItems: any[];
	concepts: any[];
	prompts: any[];
	notes: any[];
	wildcards: any[];
	properties: any[];
	groups: any[];
	_count: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * 🔄 Transforma un objeto Place de Prisma a nuestro tipo canónico PlaceComplete.
 *
 * @param prismaPlace - El objeto Place obtenido de Prisma.
 * @returns Un objeto PlaceComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaPlace(prismaPlace: PlaceFromPrisma | null): PlaceComplete {
	if (!prismaPlace) {
		throw new TransformerError('El objeto de lugar de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaPlace;

		return {
			...baseData,
			// Deserializar campos JSON
			dangers: deserializePlaceDangers(baseData.dangers),
			resources: deserializePlaceResources(baseData.resources),
			stats: deserializePlaceStats(baseData.stats),
			filters: deserializePlaceFilters(baseData.filters),
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
			placeId: prismaPlace.id,
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
export function fromPrismaPlaces(prismaPlaces: PlaceFromPrisma[]): PlaceComplete[] {
	return prismaPlaces.map(fromPrismaPlace);
}
