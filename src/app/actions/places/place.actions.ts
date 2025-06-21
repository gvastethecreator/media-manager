'use server';

/**
 * @file Server Actions para la entidad Place
 * @module app/actions/places/place.actions
 * @description Acciones CRUD y de gestión de relaciones para los Lugares, utilizando el patrón EntityWithStats.
 */

import { prisma } from '@/lib/db';
import {
	toPlaceWithStats,
	mapCreatePlaceDataToPrisma,
	mapPlaceSearchOptionsToPrisma,
	mapUpdatePlaceDataToPrisma,
} from '@/transformers/place';
import type {
	PlaceWithStats,
	PlaceCreateInput,
	PlaceSearchOptions,
	PlaceUpdateInput,
} from '@/types/entities/place';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

const REVALIDATE_PATHS = ['/settings/places', '/library/places'];

// Payload para incluir los conteos necesarios para las estadísticas
const placeIncludeWithCounts = {
	_count: {
		select: {
			images: true,
			notes: true,
			tags: true,
			characters: true,
			collections: true,
			concepts: true,
		},
	},
} satisfies Prisma.PlaceInclude;

type PrismaPlaceWithCounts = Prisma.PlaceGetPayload<{
	include: typeof placeIncludeWithCounts;
}>;

async function revalidatePlacePaths(id?: string) {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path, 'page');
	}
	if (id) {
		revalidatePath(`/library/places/${id}`, 'page');
	}
}

export async function getPlaces(options: PlaceSearchOptions): Promise<PlaceWithStats[]> {
	try {
		const findOptions = mapPlaceSearchOptionsToPrisma(options);
		const places = await prisma.place.findMany({
			...findOptions,
			include: placeIncludeWithCounts,
		});
		return places.map(toPlaceWithStats);
	} catch (error) {
		console.error('Error al obtener los lugares:', error);
		throw new Error('No se pudieron obtener los lugares.');
	}
}

export async function getPlaceById(id: string): Promise<PlaceWithStats | null> {
	try {
		const place = await prisma.place.findUnique({
			where: { id },
			include: placeIncludeWithCounts,
		});
		return place ? toPlaceWithStats(place as PrismaPlaceWithCounts) : null;
	} catch (error) {
		console.error(`Error al obtener el lugar con ID ${id}:`, error);
		throw new Error('No se pudo obtener el lugar.');
	}
}

export async function createPlace(input: PlaceCreateInput): Promise<PlaceWithStats> {
	try {
		const data = mapCreatePlaceDataToPrisma(input);
		const newPlace = await prisma.place.create({ data });

		await revalidatePlacePaths();

		// Volvemos a buscar para obtener los _counts actualizados
		const createdPlaceWithStats = await getPlaceById(newPlace.id);
		if (!createdPlaceWithStats) {
			throw new Error('No se pudo recuperar el lugar recién creado con sus estadísticas.');
		}
		return createdPlaceWithStats;
	} catch (error) {
		console.error('Error al crear el lugar:', error);
		throw new Error('No se pudo crear el lugar.');
	}
}

export async function updatePlace(id: string, input: PlaceUpdateInput): Promise<PlaceWithStats> {
	try {
		const data = mapUpdatePlaceDataToPrisma(input);
		await prisma.place.update({
			where: { id },
			data,
		});

		await revalidatePlacePaths(id);

		// Volvemos a buscar para obtener los _counts actualizados
		const updatedPlaceWithStats = await getPlaceById(id);
		if (!updatedPlaceWithStats) {
			throw new Error('No se pudo recuperar el lugar actualizado con sus estadísticas.');
		}
		return updatedPlaceWithStats;
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
