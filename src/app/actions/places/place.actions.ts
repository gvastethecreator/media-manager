'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { mapCreatePlaceDataToPrisma, mapUpdatePlaceDataToPrisma } from '@/transformers/place';
import type { CreatePlaceData, PlaceBase, UpdatePlaceData } from '@/types/entities/place';
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
const createPlaceError = (message: string, code: PlaceErrorCode = PlaceErrorCode.OPERATION_FAILED, cause?: unknown) => {
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
export async function getPlaces(): Promise<PlaceWithStats[]> {
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

				return {
					...place,
					totalSize: totalSize._sum.size || 0,
					imageCount: place._count.images,
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
export async function getPlace(id: string): Promise<PlaceWithStats> {
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

		const result = {
			...place,
			totalSize: totalSize._sum.size || 0,
			imageCount: place._count.images,
		};

		placeLogger.info('✅ Lugar obtenido:', id);
		return result;
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
export async function createPlace(data: CreatePlaceData): Promise<PlaceBase> {
	try {
		placeLogger.info('➕ Creando lugar', { name: data.name });

		// Utilizar el transformer para mapear datos de creación
		const createData = mapCreatePlaceDataToPrisma(data);

		const place = await prisma.place.create({
			data: createData,
		});

		await revalidateAllPaths();
		await notifyPlaceChange('create', place);

		placeLogger.info('✅ Lugar creado', { id: place.id, name: place.name });
		return place;
	} catch (error) {
		placeLogger.error('❌ Error al crear lugar', { error, data });
		throw createPlaceError('No se pudo crear el lugar', PlaceErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un lugar existente
 */
export async function updatePlace(id: string, data: UpdatePlaceData): Promise<PlaceBase> {
	try {
		placeLogger.info('🔄 Actualizando lugar', { id });

		// Comprobar que el lugar existe
		const existingPlace = await prisma.place.findUnique({
			where: { id },
		});

		if (!existingPlace) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Utilizar el transformer para mapear datos de actualización
		const updateData = mapUpdatePlaceDataToPrisma(data);

		const updatedPlace = await prisma.place.update({
			where: { id },
			data: updateData,
		});

		await revalidateAllPaths();
		await notifyPlaceChange('update', updatedPlace);

		placeLogger.info('✅ Lugar actualizado', { id });
		return updatedPlace;
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
 * Elimina un lugar por su ID
 */
export async function deletePlace(id: string): Promise<{ id: string }> {
	try {
		placeLogger.info('🗑️ Eliminando lugar', { id });

		// Comprobar que el lugar existe
		const place = await prisma.place.findUnique({
			where: { id },
		});

		if (!place) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

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
		placeLogger.info('🖼️ Obteniendo imágenes del lugar', { id });

		// Comprobar que el lugar existe
		const place = await prisma.place.findUnique({
			where: { id },
		});

		if (!place) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		const placeWithImages = await prisma.place.findUnique({
			where: { id },
			include: {
				images: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						name: true,
						description: true,
						width: true,
						height: true,
						size: true,
						aspectRatio: true,
						blurhash: true,
						palette: true,
						format: true,
						focalPoint: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		});

		if (!placeWithImages) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		const images = placeWithImages.images.map((image) => {
			const thumbnailUrl = image.thumbnail
				? `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`
				: null;

			return {
				...image,
				thumbnail: undefined,
				thumbnailUrl,
			};
		});

		placeLogger.info('✅ Imágenes del lugar obtenidas', { id, count: images.length });
		return images;
	} catch (error) {
		placeLogger.error('❌ Error al obtener imágenes del lugar', { id, error });
		throw createPlaceError('No se pudieron obtener las imágenes del lugar', PlaceErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Asocia una imagen a un lugar
 */
export async function addImageToPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('🔗 Añadiendo imagen a lugar', { placeId, imageId });

		// Comprobar que el lugar existe
		const place = await prisma.place.findUnique({
			where: { id: placeId },
		});

		if (!place) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Comprobar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createPlaceError('Imagen no encontrada', PlaceErrorCode.NOT_FOUND);
		}

		// Añadir relación
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		await revalidateAllPaths();
		placeLogger.info('✅ Imagen añadida a lugar', { placeId, imageId });
		return { success: true };
	} catch (error) {
		placeLogger.error('❌ Error al añadir imagen a lugar', { placeId, imageId, error });
		throw createPlaceError('No se pudo añadir la imagen al lugar', PlaceErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina la asociación entre una imagen y un lugar
 */
export async function removeImageFromPlace(placeId: string, imageId: string) {
	try {
		placeLogger.info('🔗 Eliminando imagen de lugar', { placeId, imageId });

		// Comprobar que el lugar existe
		const place = await prisma.place.findUnique({
			where: { id: placeId },
		});

		if (!place) {
			throw createPlaceError('Lugar no encontrado', PlaceErrorCode.NOT_FOUND);
		}

		// Comprobar que la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createPlaceError('Imagen no encontrada', PlaceErrorCode.NOT_FOUND);
		}

		// Eliminar relación
		await prisma.place.update({
			where: { id: placeId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		await revalidateAllPaths();
		placeLogger.info('✅ Imagen eliminada de lugar', { placeId, imageId });
		return { success: true };
	} catch (error) {
		placeLogger.error('❌ Error al eliminar imagen de lugar', { placeId, imageId, error });
		throw createPlaceError('No se pudo eliminar la imagen del lugar', PlaceErrorCode.OPERATION_FAILED, error);
	}
}
