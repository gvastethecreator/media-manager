'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
  extendPlace,
  mapCreatePlaceDataToPrisma,
  mapUpdatePlaceDataToPrisma
} from '@/transformers/place';
import type {
  CreatePlaceData,
  PlaceBase,
  PlaceExtendedComplete,
  UpdatePlaceData
} from '@/types/entities/place';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const placeLogger = serverLogger.withContext('PlaceActions');
const REVALIDATE_PATHS = ['/settings', '/places', '/places/[id]'] as const;

// Códigos de error
enum PlaceErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createPlaceError = async (message: string, code: PlaceErrorCode = PlaceErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'PlaceError';
	Object.assign(error, { code, cause });
	return error;
};

/**
 * Revalida todas las rutas relacionadas con lugares
 */
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	placeLogger.info('🔄 Rutas revalidadas');
};

/**
 * Notifica cambios en un lugar a través del sistema de eventos
 */
const notifyPlaceChange = async (action: 'create' | 'update' | 'delete', place: PlaceBase | { id: string }) => {
	// Emitir eventos usando el sistema de servidor
	await emit({
		type: 'places:modified',
		data: { action, place },
	});
	statsEventEmitter.emit(STATS_EVENTS.PLACE_CHANGE);
};

// Interfaces extendidas
export interface PlaceWithStats extends PlaceBase {
	_count: {
		images: number;
		groups: number;
		properties: number;
		wildcards: number;
	};
	totalSize: number;
	imageCount?: number;
}

export interface PlaceWithImages extends PlaceBase {
	images?: {
		id: string;
		thumbnail: Buffer | null;
		thumbnailWidth: number | null;
		thumbnailHeight: number | null;
		thumbnailSize: number | null;
		url?: string;
	}[];
	recentImages?: (string | null)[];
}

/**
 * Obtiene todos los lugares con estadísticas
 */
export async function getPlaces(): Promise<PlaceExtendedComplete[]> {
	try {
		placeLogger.info('🏙️ Obteniendo lugares');
		const places = await prisma.place.findMany({
			include: {
				_count: {
					select: {
						images: true,
						groups: true,
						properties: true,
						wildcards: true
					},
				},
				images: {
					take: 9,
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
					},
				},
			},
			orderBy: { name: 'asc' },
		});

		const countsMap = new Map(
			places.map(place => [
				place.id,
				{
					images: place._count.images,
					groups: place._count.groups,
					properties: place._count.properties,
					wildcards: place._count.wildcards
				}
			])
		);

		const placesWithStats = await Promise.all(
			places.map(async (place) => {
				const totalSize = await prisma.image.aggregate({
					where: {
						places: {
							some: {
								id: place.id,
							},
						},
					},
					_sum: {
						size: true,
					},
				});

				const placeExtended = extendPlace(place, {
					...countsMap.get(place.id),
					totalSize: totalSize._sum.size || 0
				});

				// Agregar imágenes recientes
				return {
					...placeExtended,
					recentImages: place.images
						.filter((img) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
						.map((img) => {
							if (img.thumbnail) {
								return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
							}
							return null;
						}),
					images: undefined,
				};
			})
		);

		placeLogger.info('✅ Lugares obtenidos', { count: places.length });
		return placesWithStats;
	} catch (error) {
		placeLogger.error('❌ Error al obtener lugares', error);
		throw createPlaceError('No se pudieron obtener los lugares', PlaceErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un lugar específico por su ID
 */
export async function getPlace(id: string): Promise<PlaceExtendedComplete> {
	try {
		placeLogger.info('🔍 Obteniendo lugar:', id);
		const place = await prisma.place.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						groups: true,
						properties: true,
						wildcards: true
					},
				},
			},
		});

		if (!place) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		const totalSize = await prisma.image.aggregate({
			where: {
				places: {
					some: {
						id: place.id,
					},
				},
			},
			_sum: {
				size: true,
			},
		});

		const placeExtended = extendPlace(place, {
			images: place._count.images,
			groups: place._count.groups,
			properties: place._count.properties,
			wildcards: place._count.wildcards,
			totalSize: totalSize._sum.size || 0
		});

		placeLogger.info('✅ Lugar obtenido:', id);
		return placeExtended;
	} catch (error) {
		placeLogger.error('❌ Error al obtener lugar', { id, error });
		throw createPlaceError(
			'No se pudo obtener el lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Crea un nuevo lugar
 */
export async function createPlace(data: CreatePlaceData): Promise<PlaceExtendedComplete> {
	try {
		placeLogger.info('➕ Creando lugar', { name: data.name });

		// Utilizar el transformer para mapear datos de creación
		const createData = mapCreatePlaceDataToPrisma(data);

		const place = await prisma.place.create({
			data: createData,
		});

		// Transformar a tipo completo
		const placeExtended = extendPlace(place);

		await revalidateAllPaths();
		await notifyPlaceChange('create', place);

		placeLogger.info('✅ Lugar creado', { id: place.id, name: place.name });
		return placeExtended;
	} catch (error) {
		placeLogger.error('❌ Error al crear lugar', { error, data });
		throw createPlaceError('No se pudo crear el lugar', PlaceErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un lugar existente
 */
export async function updatePlace(id: string, data: UpdatePlaceData): Promise<PlaceExtendedComplete> {
	try {
		placeLogger.info('🔄 Actualizando lugar', { id });

		// Comprobar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Si se proporcionan campos JSON, asegurarse de que estén serializados
		const updateData = mapUpdatePlaceDataToPrisma(data);

		const updatedPlace = await prisma.place.update({
			where: { id },
			data: updateData,
		});

		// Transformar a tipo completo
		const placeExtended = extendPlace(updatedPlace);

		await revalidateAllPaths();
		await notifyPlaceChange('update', updatedPlace);

		placeLogger.info('✅ Lugar actualizado', { id });
		return placeExtended;
	} catch (error) {
		placeLogger.error('❌ Error al actualizar lugar', { id, error });
		throw createPlaceError(
			'No se pudo actualizar el lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Elimina un lugar existente
 */
export async function deletePlace(id: string): Promise<{ id: string }> {
	try {
		placeLogger.info('🗑️ Eliminando lugar', { id });

		// Comprobar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Eliminar lugar
		await prisma.place.delete({
			where: { id },
		});

		await revalidateAllPaths();
		await notifyPlaceChange('delete', { id });

		placeLogger.info('✅ Lugar eliminado', { id });
		return { id };
	} catch (error) {
		placeLogger.error('❌ Error al eliminar lugar', { id, error });
		throw createPlaceError(
			'No se pudo eliminar el lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene las imágenes asociadas a un lugar
 */
export async function getPlaceImages(id: string) {
	try {
		placeLogger.info('🖼️ Obteniendo imágenes de lugar', { id });

		// Verificar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Obtener imágenes
		const images = await prisma.image.findMany({
			where: {
				places: {
					some: {
						id,
					},
				},
			},
			select: {
				id: true,
				name: true,
				originalFilename: true,
				width: true,
				height: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		// Transformar miniaturas
		const imagesWithThumbnails = images.map((image) => {
			let thumbnailUrl = null;
			if (image.thumbnail) {
				thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
			}

			return {
				...image,
				thumbnail: undefined,
				thumbnailUrl,
			};
		});

		placeLogger.info('✅ Imágenes de lugar obtenidas', { id, count: images.length });
		return imagesWithThumbnails;
	} catch (error) {
		placeLogger.error('❌ Error al obtener imágenes de lugar', { id, error });
		throw createPlaceError(
			'No se pudieron obtener las imágenes del lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Asocia una imagen a un lugar
 */
export async function addImageToPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('🔗 Asociando imagen a lugar', { placeId, imageId });

		// Verificar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id: placeId },
			select: { id: true },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Verificar que la imagen existe
		const existingImage = await prisma.image.findUnique({
			where: { id: imageId },
			select: { id: true },
		});

		if (!existingImage) {
			throw createPlaceError('Imagen no encontrada', PlaceErrorCode.NOT_FOUND);
		}

		// Asociar imagen a lugar
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					connect: {
						id: imageId,
					},
				},
			},
		});

		await revalidateAllPaths();
		placeLogger.info('✅ Imagen asociada a lugar', { placeId, imageId });
		return { success: true };
	} catch (error) {
		placeLogger.error('❌ Error al asociar imagen a lugar', { placeId, imageId, error });
		throw createPlaceError(
			'No se pudo asociar la imagen al lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Desasocia una imagen de un lugar
 */
export async function removeImageFromPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('🔗 Desasociando imagen de lugar', { placeId, imageId });

		// Verificar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id: placeId },
			select: { id: true },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Verificar que la imagen existe
		const existingImage = await prisma.image.findUnique({
			where: { id: imageId },
			select: { id: true },
		});

		if (!existingImage) {
			throw createPlaceError('Imagen no encontrada', PlaceErrorCode.NOT_FOUND);
		}

		// Desasociar imagen de lugar
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					disconnect: {
						id: imageId,
					},
				},
			},
		});

		await revalidateAllPaths();
		placeLogger.info('✅ Imagen desasociada de lugar', { placeId, imageId });
		return { success: true };
	} catch (error) {
		placeLogger.error('❌ Error al desasociar imagen de lugar', { placeId, imageId, error });
		throw createPlaceError(
			'No se pudo desasociar la imagen del lugar',
			error instanceof Error && 'code' in error ? (error.code as PlaceErrorCode) : PlaceErrorCode.OPERATION_FAILED,
			error
		);
	}
}
