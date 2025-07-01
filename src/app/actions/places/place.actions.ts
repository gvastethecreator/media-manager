'use server';

/**
 * @file Server Actions para la entidad Place
 * @module app/actions/places/place.actions
 * @description Acciones CRUD y de gestión de relaciones para los Lugares como controladores delegados.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
	createPlace as createPlaceService,
	deletePlace as deletePlaceService,
	getPlaceById as getPlaceByIdService,
	getPlaces as getPlacesService,
	updatePlace as updatePlaceService,
} from '@/services/place';
import type { PlaceCreateInput, PlaceSearchOptions, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place';
import { revalidatePath } from 'next/cache';

const placeLogger = serverLogger.withContext('PlaceActions');

const REVALIDATE_PATHS = ['/settings/places', '/library/places'];

async function revalidatePlacePaths(id?: string) {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path, 'page');
	}
	if (id) {
		revalidatePath(`/library/places/${id}`, 'page');
	}
	placeLogger.info('🔄 Rutas revalidadas');
}

export async function getPlaces(options: PlaceSearchOptions): Promise<PlaceWithStats[]> {
	const places = await getPlacesService(options);
	return places;
}

export async function getPlaceById(id: string): Promise<PlaceWithStats | null> {
	const place = await getPlaceByIdService(id);
	return place;
}

export async function createPlace(input: PlaceCreateInput): Promise<PlaceWithStats> {
	const place = await createPlaceService(input);
	await revalidatePlacePaths();
	return place;
}

export async function updatePlace(id: string, input: PlaceUpdateInput): Promise<PlaceWithStats> {
	const place = await updatePlaceService(id, input);
	await revalidatePlacePaths(id);
	return place;
}

export async function deletePlace(id: string): Promise<boolean> {
	const result = await deletePlaceService(id);
	await revalidatePlacePaths();
	return result;
}

/**
 * Obtiene las imágenes asociadas a un lugar específico
 * @param placeId - El ID del lugar
 * @param options - Opciones para la consulta de imágenes
 * @returns Promise con el array de imágenes del lugar
 */
export async function getPlaceImages(placeId: string, options?: unknown): Promise<unknown[]> {
	placeLogger.info(`🖼️ Obteniendo imágenes para lugar: ${placeId}`);
	// Función stub - devuelve array vacío por ahora
	return [];
}
