'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, Place } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const placeLogger = logger.withContext('PlaceActions');

const REVALIDATE_PATHS = ['/settings', '/places', '/places/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	placeLogger.info('🔄 Rutas revalidadas');
};

class PlaceError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'PlaceError';
	}
}

export interface PlaceWithStats extends Omit<Place, 'featuredImage'> {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	featuredImage: string | null;
	recentImages: string[];
}

export interface PlaceCreate {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	region: string;
	type: string;
	climate: string;
	population: number;
	government: string;
	dangers: string;
	resources: string;
	lore: string;
	history: string;
	stats: string;
	sortBy: string;
	filters: string;
}

export interface PlaceUpdate extends Partial<PlaceCreate> {
	id: string;
}

export interface PlaceWithImages extends Place {
	images: FileItem[];
}

export interface ExtendedPlace extends Place {
	images: Image[];
}

export async function getPlaces() {
	try {
		placeLogger.info('📚 Obteniendo lista de lugares');
		const places = await prisma.place.findMany({
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 1,
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		placeLogger.info(`✅ ${places.length} lugares obtenidos`);
		return places;
	} catch (error) {
		placeLogger.error('❌ Error al obtener lugares:', error);
		throw new PlaceError('No se pudieron obtener los lugares', error);
	}
}

export async function getPlaceById(id: string) {
	try {
		placeLogger.info('🔍 Buscando lugar:', id);
		const place = await prisma.place.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 5,
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!place) {
			throw new PlaceError('Lugar no encontrado');
		}

		placeLogger.info('✅ Lugar encontrado:', place.name);
		return place;
	} catch (error) {
		placeLogger.error('❌ Error al obtener lugar:', error);
		throw new PlaceError('No se pudo obtener el lugar', error);
	}
}

export async function createPlace(data: PlaceCreate) {
	try {
		placeLogger.info('📝 Creando lugar:', data.name);
		const place = await prisma.place.create({
			data: {
				...data,
				dangers: data.dangers || '[]',
				resources: data.resources || '[]',
				stats: data.stats || '{}',
				filters: data.filters || '[]',
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'places:modified',
			data: { action: 'create', place },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		placeLogger.info('✅ Lugar creado:', place.name);
		await revalidateAllPaths();
		return place;
	} catch (error) {
		placeLogger.error('❌ Error al crear lugar:', error);
		throw new PlaceError('No se pudo crear el lugar', error);
	}
}

export async function updatePlace(id: string, data: PlaceUpdate) {
	try {
		placeLogger.info('📝 Actualizando lugar:', id);
		const place = await prisma.place.update({
			where: { id },
			data,
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'places:modified',
			id,
			data: { action: 'update', place },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		placeLogger.info('✅ Lugar actualizado:', place.name);
		await revalidateAllPaths();
		return place;
	} catch (error) {
		placeLogger.error('❌ Error al actualizar lugar:', error);
		throw new PlaceError('No se pudo actualizar el lugar', error);
	}
}

export async function deletePlace(id: string) {
	try {
		placeLogger.info('🗑️ Eliminando lugar:', id);
		await prisma.place.delete({
			where: { id },
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'places:modified',
			id,
			data: { action: 'delete' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		placeLogger.info('✅ Lugar eliminado');
		await revalidateAllPaths();
	} catch (error) {
		placeLogger.error('❌ Error al eliminar lugar:', error);
		throw new PlaceError('No se pudo eliminar el lugar', error);
	}
}

export async function getPlaceImages(id: string) {
	try {
		placeLogger.info('🖼️ Obteniendo imágenes del lugar:', id);
		const place = (await prisma.place.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: true,
						stats: true,
					},
				},
			},
		})) as ExtendedPlace | null;

		if (!place) {
			throw new PlaceError('Lugar no encontrado');
		}

		const images = place.images.map((img) => convertServerImageToFileItem(img as ServerImage));

		placeLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		placeLogger.error('❌ Error al obtener imágenes del lugar:', error);
		throw new PlaceError('No se pudieron obtener las imágenes del lugar', error);
	}
}

export async function addImageToPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('➕ Agregando imagen a lugar:', { placeId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				places: {
					connect: { id: placeId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'places:modified',
			id: placeId,
			imageId,
			data: { action: 'addImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		placeLogger.info('✅ Imagen agregada al lugar');
		await revalidateAllPaths();
	} catch (error) {
		placeLogger.error('❌ Error al agregar imagen al lugar:', error);
		throw new PlaceError('No se pudo agregar la imagen al lugar', error);
	}
}

export async function removeImageFromPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('➖ Removiendo imagen de lugar:', { placeId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				places: {
					disconnect: { id: placeId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'places:modified',
			id: placeId,
			imageId,
			data: { action: 'removeImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		placeLogger.info('✅ Imagen removida del lugar');
		await revalidateAllPaths();
	} catch (error) {
		placeLogger.error('❌ Error al remover imagen del lugar:', error);
		throw new PlaceError('No se pudo remover la imagen del lugar', error);
	}
}
