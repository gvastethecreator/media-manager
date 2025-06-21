'use server';

/**
 * @file Server Actions para la entidad Place
 * @module app/actions/places/place.actions
 * @description Acciones CRUD y de gestión de relaciones para los Lugares.
 */

import { prisma } from '@/lib/db';
import {
    fromPrismaPlace,
    toCreateData as mapCreatePlaceDataToPrisma,
    toSearchOptions as mapPlaceSearchOptionsToPrisma,
    toUpdateData as mapUpdatePlaceDataToPrisma,
    placePayload,
} from '@/transformers/place';
import type {
    PlaceComplete,
    PlaceCreateInput,
    PlaceSearchOptions,
    PlaceUpdateInput,
} from '@/types/entities/place';
import { revalidatePath } from 'next/cache';

const REVALIDATE_PATHS = ['/settings/places', '/library/places'];

async function revalidatePlacePaths(id?: string) {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path, 'page');
	}
	if (id) {
		revalidatePath(`/library/places/${id}`, 'page');
	}
}

export async function getPlaces(options: PlaceSearchOptions): Promise<PlaceComplete[]> {
	try {
		const findOptions = mapPlaceSearchOptionsToPrisma(options);
		const places = await prisma.place.findMany({
			...findOptions,
			...placePayload,
		});
		const transformedPlaces = places.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null);
		return transformedPlaces;
	} catch (error) {
		console.error('Error al obtener los lugares:', error);
		throw new Error('No se pudieron obtener los lugares.');
	}
}

export async function getPlaceById(id: string): Promise<PlaceComplete | null> {
	try {
		const place = await prisma.place.findUnique({
			where: { id },
			...placePayload,
		});
		return fromPrismaPlace(place);
	} catch (error) {
		console.error(`Error al obtener el lugar con ID ${id}:`, error);
		throw new Error('No se pudo obtener el lugar.');
	}
}

export async function createPlace(input: PlaceCreateInput): Promise<PlaceComplete> {
	try {
		const data = mapCreatePlaceDataToPrisma(input);
		const newPlace = await prisma.place.create({
			data,
			...placePayload,
		});
		await revalidatePlacePaths();
		const transformedPlace = fromPrismaPlace(newPlace);
		if (!transformedPlace) {
			throw new Error('Error al transformar el lugar creado.');
		}
		return transformedPlace;
	} catch (error) {
		console.error('Error al crear el lugar:', error);
		throw new Error('No se pudo crear el lugar.');
	}
}

export async function updatePlace(id: string, input: PlaceUpdateInput): Promise<PlaceComplete> {
	try {
		const data = mapUpdatePlaceDataToPrisma(input);
		const updatedPlace = await prisma.place.update({
			where: { id },
			data,
			...placePayload,
		});
		await revalidatePlacePaths(id);
		const transformedPlace = fromPrismaPlace(updatedPlace);
		if (!transformedPlace) {
			throw new Error('Error al transformar el lugar actualizado.');
		}
		return transformedPlace;
	} catch (error) {
		console.error(`Error al actualizar el lugar con ID ${id}:`, error);
		throw new Error('No se pudo actualizar el lugar.');
	}
}

export async function deletePlace(id: string): Promise<boolean> {
	try {
		await prisma.place.delete({ where: { id } });
		await revalidatePlacePaths();
		return true;
	} catch (error) {
		console.error(`Error al eliminar el lugar con ID ${id}:`, error);
		return false;
	}
}
