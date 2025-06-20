'use server';

/**
 * @file Server Actions para la entidad Place
 * @module app/actions/places/place.actions
 * @description Acciones CRUD y de gestión de relaciones para los Lugares.
 */

import { getPrismaClient } from '@/lib/db';
import { handlePrismaError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import {
    fromPrismaPlace,
    fromPrismaPlaces,
    mapCreatePlaceDataToPrisma,
    mapUpdatePlaceDataToPrisma,
} from '@/transformers/place';
import type { PlaceBase, PlaceComplete, PlaceCreateInput, PlaceUpdateInput } from '@/types/entities/place';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('PlaceActions');

const PLACE_INCLUDE = {
	images: {
		select: { id: true },
	},
	videos: {
		select: { id: true },
	},
	albums: {
		select: { id: true },
	},
	collections: {
		select: { id: true },
	},
	tags: {
		select: { id: true },
	},
	characters: {
		select: { id: true },
	},
	worldItems: {
		select: { id: true },
	},
	concepts: {
		select: { id: true },
	},
	prompts: {
		select: { id: true },
	},
	notes: {
		select: { id: true },
	},
	wildcards: {
		select: { id: true },
	},
	properties: {
		select: { id: true },
	},
	groups: {
		select: { id: true },
	},
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
} as const;

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
	try {
		logger.info('🏙️ Obteniendo todos los lugares');
		const prisma = await getPrismaClient();
		const places = await prisma.place.findMany({
			include: PLACE_INCLUDE,
			orderBy: { name: 'asc' },
		});
		return fromPrismaPlaces(places);
	} catch (error) {
		logger.error('❌ Error obteniendo lugares:', error);
		throw handlePrismaError(error);
	}
}

/**
 * Obtiene un único lugar por su ID.
 */
export async function getPlace(id: string): Promise<PlaceComplete | null> {
	try {
		logger.info(`🔍 Obteniendo lugar por ID: ${id}`);
		const prisma = await getPrismaClient();
		const place = await prisma.place.findUnique({
			where: { id },
			include: PLACE_INCLUDE,
		});
		if (!place) {
			logger.warn(`Lugar no encontrado: ${id}`);
			return null;
		}
		return fromPrismaPlace(place);
	} catch (error) {
		logger.error(`❌ Error obteniendo lugar ${id}:`, error);
		throw handlePrismaError(error);
	}
}

/**
 * Crea un nuevo lugar.
 */
export async function createPlace(data: PlaceCreateInput): Promise<PlaceBase> {
	try {
		logger.info('➕ Creando nuevo lugar:', { name: data.name });
		const prisma = await getPrismaClient();
		const prismaData = mapCreatePlaceDataToPrisma(data);
		const newPlace = await prisma.place.create({ data: prismaData });
		await revalidatePlacePaths();
		return newPlace;
	} catch (error) {
		logger.error('❌ Error creando lugar:', error);
		throw handlePrismaError(error);
	}
}

/**
 * Actualiza un lugar existente.
 */
export async function updatePlace(id: string, data: PlaceUpdateInput): Promise<PlaceBase> {
	try {
		logger.info(`🔄 Actualizando lugar: ${id}`);
		const prisma = await getPrismaClient();
		const prismaData = mapUpdatePlaceDataToPrisma(data);
		const updatedPlace = await prisma.place.update({
			where: { id },
			data: prismaData,
		});
		await revalidatePlacePaths();
		revalidatePath(`/places/${id}`);
		return updatedPlace;
	} catch (error) {
		logger.error(`❌ Error actualizando lugar ${id}:`, error);
		throw handlePrismaError(error);
	}
}

/**
 * Elimina un lugar.
 */
export async function deletePlace(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando lugar: ${id}`);
		const prisma = await getPrismaClient();
		await prisma.place.delete({ where: { id } });
		await revalidatePlacePaths();
	} catch (error) {
		logger.error(`❌ Error eliminando lugar ${id}:`, error);
		throw handlePrismaError(error);
	}
}

/**
 * Obtiene las imágenes de un lugar específico.
 */
export async function getPlaceImages(placeId: string): Promise<any[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes del lugar: ${placeId}`);
		const prisma = await getPrismaClient();
		const place = await prisma.place.findUnique({
			where: { id: placeId },
			include: {
				images: {
					select: {
						id: true,
						path: true,
						thumbnail: true,
						width: true,
						height: true,
						createdAt: true,
					},
					orderBy: { createdAt: 'desc' },
				},
			},
		});
		return place?.images || [];
	} catch (error) {
		logger.error(`❌ Error obteniendo imágenes del lugar ${placeId}:`, error);
		throw handlePrismaError(error);
	}
}

/**
 * Añade una imagen a un lugar.
 */
export async function addImageToPlace(placeId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🖼️➕ Añadiendo imagen ${imageId} al lugar ${placeId}`);
		const prisma = await getPrismaClient();
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});
		revalidatePath(`/places/${placeId}`);
	} catch (error) {
		logger.error(`❌ Error añadiendo imagen ${imageId} al lugar ${placeId}:`, error);
		throw handlePrismaError(error);
	}
}

/**
 * Elimina una imagen de un lugar.
 */
export async function removeImageFromPlace(placeId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🖼️➖ Eliminando imagen ${imageId} del lugar ${placeId}`);
		const prisma = await getPrismaClient();
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});
		revalidatePath(`/places/${placeId}`);
	} catch (error) {
		logger.error(`❌ Error eliminando imagen ${imageId} del lugar ${placeId}:`, error);
		throw handlePrismaError(error);
	}
}
