'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { revalidatePath } from 'next/cache';

import type { CreateImageInput, GetImagesOptions, GetImagesResult, ImageResult } from './image-types.actions';

const imageLogger = serverLogger.withContext('ImageCRUD');

// Definir la interfaz Image para no depender de Prisma
export interface Image {
	id: string;
	name: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	hash: string | null;
	metadata: string | null;
	folderId: string | null;
	createdAt: Date;
	updatedAt: Date;
	isPublic: boolean;
	isFavorite: boolean;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	tags?: { id: string; name: string; color: string }[];
	collections?: { id: string; name: string; color: string; emoji: string }[];
	albums?: { id: string; name: string; emoji: string }[];
	characters?: { id: string; name: string; emoji: string }[];
	places?: { id: string; name: string; emoji: string }[];
	worldItems?: { id: string; name: string; emoji: string }[];
	stats?: any;
	folder?: { id: string; name: string; path: string };
}

/**
 * Obtiene una imagen por su ID
 */
export async function getImage(id: string): Promise<Image | null> {
	try {
		const image = await prisma.image.findUnique({
			where: { id },
			include: {
				tags: {
					select: { id: true, name: true, color: true },
				},
				collections: {
					select: { id: true, name: true, color: true, emoji: true },
				},
				albums: {
					select: { id: true, name: true, emoji: true },
				},
				characters: {
					select: { id: true, name: true, emoji: true },
				},
				places: {
					select: { id: true, name: true, emoji: true },
				},
				worldItems: {
					select: { id: true, name: true, emoji: true },
				},
				stats: true,
				folder: {
					select: { id: true, name: true, path: true },
				},
			},
		});

		if (!image) {
			return null;
		}

		return image as unknown as Image;
	} catch (error) {
		imageLogger.error('Error al obtener la imagen:', error);
		throw new Error('No se pudo obtener la imagen');
	}
}

/**
 * Crea una nueva imagen
 */
export async function createImage(data: CreateImageInput) {
	try {
		const image = await prisma.image.create({
			data: {
				name: data.name,
				path: data.path,
				size: data.size,
				width: data.width,
				height: data.height,
				hash: data.hash,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
				isPublic: data.isPublic ?? false,
				folder: {
					connect: { id: data.folderId },
				},
			},
			include: {
				tags: true,
			},
		});

		// Crear estadísticas iniciales
		await prisma.imageStats.create({
			data: {
				imageId: image.id,
				views: 0,
				downloads: 0,
			},
		});

		// Emisión de eventos
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);
		revalidatePath('/');

		return image;
	} catch (error) {
		imageLogger.error('Error al crear la imagen:', error);
		throw new Error('No se pudo crear la imagen');
	}
}

/**
 * Actualiza una imagen existente
 */
export async function updateImage(id: string, data: Partial<Image>): Promise<Image> {
	try {
		const updated = await prisma.image.update({
			where: { id },
			data,
		});

		// Revalidar rutas
		revalidatePath('/');
		revalidatePath(`/images/${id}`);

		return updated as unknown as Image;
	} catch (error) {
		imageLogger.error('Error al actualizar la imagen:', error);
		throw new Error('No se pudo actualizar la imagen');
	}
}

/**
 * Actualiza el estado de favorito de una imagen
 */
export async function updateFavoriteStatus(
	id: string,
	isFavorite: boolean
): Promise<Pick<Image, 'id' | 'name' | 'isFavorite'>> {
	try {
		const updated = await prisma.image.update({
			where: { id },
			data: { isFavorite },
			select: { id: true, name: true, isFavorite: true },
		});

		// Revalidar rutas
		revalidatePath('/');
		revalidatePath(`/images/${id}`);
		revalidatePath('/favorites');

		return updated;
	} catch (error) {
		imageLogger.error('Error al actualizar estado de favorito:', error);
		throw new Error('No se pudo actualizar el estado de favorito de la imagen');
	}
}

/**
 * Obtiene todas las imágenes marcadas como favoritas
 */
export async function getFavoriteImages(): Promise<Image[]> {
	try {
		const favorites = await prisma.image.findMany({
			where: { isFavorite: true },
			orderBy: { updatedAt: 'desc' },
			include: {
				tags: {
					select: { id: true, name: true, color: true },
				},
				collections: {
					select: { id: true, name: true, color: true, emoji: true },
				},
				stats: true,
			},
		});

		return favorites as unknown as Image[];
	} catch (error) {
		imageLogger.error('Error al obtener imágenes favoritas:', error);
		throw new Error('No se pudieron obtener las imágenes favoritas');
	}
}

/**
 * Obtiene imágenes con filtros, paginación y ordenamiento
 */
export async function getImages(options: GetImagesOptions = {}): Promise<GetImagesResult> {
	try {
		const {
			page = 1,
			pageSize = 50,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			folderId,
			tagIds = [],
			collectionIds = [],
			isFavorite,
			isPublic,
			search,
		} = options;

		const skip = (page - 1) * pageSize;

		// Construir query basado en los filtros
		const where: Record<string, unknown> = {};

		if (folderId) {
			where.folderId = folderId;
		}

		if (tagIds.length > 0) {
			where.tags = {
				some: {
					id: {
						in: tagIds,
					},
				},
			};
		}

		if (collectionIds.length > 0) {
			where.collections = {
				some: {
					id: {
						in: collectionIds,
					},
				},
			};
		}

		if (typeof isFavorite === 'boolean') {
			where.isFavorite = isFavorite;
		}

		if (typeof isPublic === 'boolean') {
			where.isPublic = isPublic;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ path: { contains: search, mode: 'insensitive' } },
			];
		}

		// Obtener total para la paginación
		const total = await prisma.image.count({ where });

		// Obtener imágenes
		const images = await prisma.image.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: pageSize,
			include: {
				tags: {
					select: { id: true, name: true, color: true },
				},
				collections: {
					select: { id: true, name: true, color: true, emoji: true },
				},
				albums: {
					select: { id: true, name: true, emoji: true },
				},
				characters: {
					select: { id: true, name: true, emoji: true },
				},
				places: {
					select: { id: true, name: true, emoji: true },
				},
				worldItems: {
					select: { id: true, name: true, emoji: true },
				},
				stats: true,
			},
		});

		return {
			images: images as unknown as ImageResult[],
			total,
			page,
			pageSize,
		};
	} catch (error) {
		imageLogger.error('Error al obtener imágenes:', error);
		throw new Error('No se pudieron obtener las imágenes');
	}
}
