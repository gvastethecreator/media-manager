/**
 * @file Transformer principal para la entidad Place
 * @module entities/place/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
	CreatePlaceData,
	PlaceComplete,
	PlaceExtendedComplete,
	PlaceSearchOptions,
	PlaceWithRelations,
} from '@/types/entities/place/types';
import {
	mapCreatePlaceDataToPrisma,
	mapPlaceSearchOptionsToPrisma,
	mapPlaceToRelatedPlace,
	mapUpdatePlaceDataToPrisma,
} from './mappers';
import { extendPlace, extendPlaceComplete, validatePlace } from './serializers';

/**
 * 🔍 Busca lugares con opciones de filtrado y paginación
 */
export async function findManyPlaces(options: PlaceSearchOptions = {}): Promise<{
	items: PlaceExtendedComplete[];
	total: number;
	hasMore: boolean;
}> {
	try {
		const prismaOptions = mapPlaceSearchOptionsToPrisma(options);
		const [items, total] = await Promise.all([
			prisma.place.findMany(prismaOptions),
			prisma.place.count({ where: prismaOptions.where }),
		]);

		const extendedItems = items.map((item) => extendPlaceComplete(item as PlaceComplete));
		const hasMore = options.skip ? options.skip + items.length < total : items.length < total;

		return {
			items: extendedItems,
			total,
			hasMore,
		};
	} catch (error) {
		logger.error('Error buscando lugares:', error);
		throw error;
	}
}

/**
 * 🔍 Busca un lugar por ID
 */
export async function findPlaceById(
	id: string,
	include?: PlaceSearchOptions['include']
): Promise<PlaceExtendedComplete | null> {
	try {
		const place = await prisma.place.findUnique({
			where: { id },
			include,
		});

		if (!place) return null;
		return extendPlaceComplete(place as PlaceComplete);
	} catch (error) {
		logger.error('Error buscando lugar por ID:', error);
		throw error;
	}
}

/**
 * ➕ Crea un nuevo lugar
 */
export async function createPlace(data: CreatePlaceData): Promise<PlaceExtendedComplete> {
	try {
		const prismaData = mapCreatePlaceDataToPrisma(data);
		const place = await prisma.place.create({
			data: prismaData,
		});

		return extendPlaceComplete(place as PlaceComplete);
	} catch (error) {
		logger.error('Error creando lugar:', error);
		throw error;
	}
}

/**
 * 📝 Actualiza un lugar existente
 */
export async function updatePlace(id: string, data: Partial<PlaceComplete>): Promise<PlaceExtendedComplete> {
	try {
		const prismaData = mapUpdatePlaceDataToPrisma(data);
		const place = await prisma.place.update({
			where: { id },
			data: prismaData,
		});

		return extendPlaceComplete(place as PlaceComplete);
	} catch (error) {
		logger.error('Error actualizando lugar:', error);
		throw error;
	}
}

/**
 * 🗑️ Elimina un lugar
 */
export async function deletePlace(id: string): Promise<PlaceExtendedComplete> {
	try {
		const place = await prisma.place.delete({
			where: { id },
		});

		return extendPlaceComplete(place as PlaceComplete);
	} catch (error) {
		logger.error('Error eliminando lugar:', error);
		throw error;
	}
}

/**
 * 🔄 Extiende un lugar con sus campos deserializados
 */
export function extendPlaceTransform(place: PlaceComplete): PlaceWithRelations {
	return extendPlace(place);
}

/**
 * 🔄 Extiende un lugar con todos sus campos y relaciones
 */
export function extendPlaceCompleteTransform(place: PlaceComplete): PlaceExtendedComplete {
	return extendPlaceComplete(place);
}

/**
 * 🔗 Obtiene la versión relacionada de un lugar
 */
export function toRelatedPlace(place: PlaceWithRelations) {
	return mapPlaceToRelatedPlace(place);
}

/**
 * ✅ Valida un lugar
 */
export function validatePlaceData(place: unknown): PlaceComplete {
	return validatePlace(place);
}
