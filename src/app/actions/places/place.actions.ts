'use server';

/**
 * @file Server Actions para la entidad Place
 * @module app/actions/places/place.actions
 * @description Acciones CRUD y de gestión de relaciones para los Lugares.
 */

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import {
	fromPrismaPlace,
	fromPrismaPlaces,
	mapCreatePlaceDataToPrisma,
	mapUpdatePlaceDataToPrisma,
} from '@/transformers/place';
import type { PlaceBase, PlaceComplete, PlaceCreateInput, PlaceUpdateInput } from '@/types/entities/place';

const logger = serverLogger.withContext('PlaceActions');

const PLACE_INCLUDE = {
	images: { take: 10, orderBy: { createdAt: 'desc' } },
	videos: { take: 5, orderBy: { createdAt: 'desc' } },
	albums: true,
	collections: true,
	tags: true,
	characters: true,
	worldItems: true,
	concepts: true,
	prompts: true,
	notes: true,
	wildcards: true,
	properties: true,
	groups: true,
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			collections: true,
			tags: true,
			characters: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
			groups: true,
		},
	},
};

/**
 * Revalida las rutas de caché relacionadas con los lugares.
 */
async function revalidatePlacePaths() {
	revalidatePath('/places');
	revalidatePath('/settings/places');
}

/**
 * Obtiene todos los lugares.
 */
export async function getPlaces(): Promise<PlaceComplete[]> {
	logger.info('🏙️ Obteniendo todos los lugares');
	const places = await prisma.place.findMany({
		include: PLACE_INCLUDE,
		orderBy: { name: 'asc' },
	});
	return fromPrismaPlaces(places);
}

/**
 * Obtiene un único lugar por su ID.
 */
export async function getPlace(id: string): Promise<PlaceComplete | null> {
	logger.info(`🔍 Obteniendo lugar por ID: ${id}`);
	const place = await prisma.place.findUnique({
		where: { id },
		include: PLACE_INCLUDE,
	});
	if (!place) {
		logger.warn(`Lugar no encontrado: ${id}`);
		return null;
	}
	return fromPrismaPlace(place);
}

/**
 * Crea un nuevo lugar.
 */
export async function createPlace(data: PlaceCreateInput): Promise<PlaceBase> {
	logger.info('➕ Creando nuevo lugar:', { name: data.name });
	const prismaData = mapCreatePlaceDataToPrisma(data);
	const newPlace = await prisma.place.create({ data: prismaData });
	await revalidatePlacePaths();
	return newPlace;
}

/**
 * Actualiza un lugar existente.
 */
export async function updatePlace(id: string, data: PlaceUpdateInput): Promise<PlaceBase> {
	logger.info(`🔄 Actualizando lugar: ${id}`);
	const prismaData = mapUpdatePlaceDataToPrisma(data);
	const updatedPlace = await prisma.place.update({
		where: { id },
		data: prismaData,
	});
	await revalidatePlacePaths();
	revalidatePath(`/places/${id}`);
	return updatedPlace;
}

/**
 * Elimina un lugar.
 */
export async function deletePlace(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando lugar: ${id}`);
	await prisma.place.delete({ where: { id } });
	await revalidatePlacePaths();
}

/**
 * Añade una imagen a un lugar.
 */
export async function addImageToPlace(placeId: string, imageId: string): Promise<void> {
	logger.info(`🖼️➕ Añadiendo imagen ${imageId} al lugar ${placeId}`);
	await prisma.place.update({
		where: { id: placeId },
		data: {
			images: {
				connect: { id: imageId },
			},
		},
	});
	revalidatePath(`/places/${placeId}`);
}

/**
 * Elimina una imagen de un lugar.
 */
export async function removeImageFromPlace(placeId: string, imageId: string): Promise<void> {
	logger.info(`🖼️➖ Eliminando imagen ${imageId} del lugar ${placeId}`);
	await prisma.place.update({
		where: { id: placeId },
		data: {
			images: {
				disconnect: { id: imageId },
			},
		},
	});
	revalidatePath(`/places/${placeId}`);
}
