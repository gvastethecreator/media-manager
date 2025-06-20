'use server';

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
// Importamos el transformer y utilities de errores
import { imageTransformer } from '@/types/entities/image/transformer';
// Importamos tipos necesarios
import type { CreateImageData, ImageBase, ImageExtended, UpdateImageData } from '@/types/entities/image/types';
import { createEntityNotFoundError, toServiceError } from '@/utils/errors/service-errors';
import type { GetImagesOptions, GetImagesResult, ImageResult } from './image-types.actions';

const SERVER_ACTION_NAME = 'ImageCRUD';
const _imageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

/**
 * Obtiene una imagen por su ID
 */
export async function getImage(id: string): Promise<ImageExtended | null> {
	try {
		const image = await prisma.image.findUnique({
			where: { id },
			include: {
				tags: { select: { id: true, name: true, color: true } },
				collections: { select: { id: true, name: true, color: true, emoji: true } },
				albums: { select: { id: true, name: true, emoji: true } },
				characters: { select: { id: true, name: true, emoji: true } },
				places: { select: { id: true, name: true, emoji: true } },
				worldItems: { select: { id: true, name: true, emoji: true } },
				concepts: { select: { id: true, name: true, emoji: true } },
				prompts: { select: { id: true, name: true, emoji: true } },
				notes: { select: { id: true, title: true } }, // emoji eliminado
				wildcards: { select: { id: true, name: true, emoji: true, color: true } },
				properties: { select: { id: true, name: true, emoji: true, color: true } },
				groups: { select: { id: true, name: true, emoji: true, color: true } },
				stats: true,
				folder: { select: { id: true, name: true, path: true } },
			},
		});

		if (!image) {
			return null;
		}

		// Mapear campos estrictos para el transformer
		const baseImage = imageTransformer.fromDB({
			id: image.id,
			name: image.name ?? 'Sin nombre',
			description: image.description ?? null,
			path: image.path ?? '',
			hash: image.hash ?? '',
			size: image.size ?? 0,
			width: image.width ?? 0,
			height: image.height ?? 0,
			metadata: image.metadata ?? null,
			isFavorite: image.isFavorite ?? false,
			folderId: image.folderId ?? image.folder?.id ?? '',
			addedAt: image.addedAt ?? image.createdAt ?? new Date(),
			sortBy: (image as any).sortBy ?? 'createdAt',
			filters: (image as any).filters ?? '[]',
		});
		const result = imageTransformer.toClient(baseImage, { includes: { folder: image.folder } }) as ImageExtended;

		return result;
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo obtener la imagen',
		});
	}
}

/**
 * Crea una nueva imagen
 */
export async function createImage(data: CreateImageData): Promise<ImageBase> {
	try {
		// Validar que name siempre sea string
		const safeName = data.name ?? 'Sin nombre';
		// Preparar datos para Prisma usando el transformer
		const prismaData = imageTransformer.toDB({ ...data, name: safeName });

		// Eliminar folderId si se usará folder.connect
		if (data.folderId) {
			(prismaData as any).folderId = undefined;
		}
		// Forzar folderId a undefined explícitamente si se usa folder.connect
		const _prismaDataFinal = {
			...prismaData,
			folderId: data.folderId ? undefined : prismaData.folderId,
		};

		// Construir el objeto de datos para Prisma sin folder por defecto
		const prismaImageData: any = {
			path: data.path,
			hash: data.hash,
			size: data.size,
			width: data.width,
			height: data.height,
			description: data.description ?? null,
			metadata: data.metadata ?? null,
			isFavorite: false,
			name: safeName,
		};
		if (data.folderId) {
			prismaImageData.folder = { connect: { id: data.folderId } };
		}
		const image = await prisma.image.create({
			data: prismaImageData,
			include: {
				tags: true,
			},
		});

		// Crear estadísticas iniciales (sin downloads)
		await prisma.imageStats.create({
			data: {
				imageId: image.id,
				views: 0,
			},
		});

		// Emisión de eventos
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);
		revalidatePath('/');

		return imageTransformer.fromDB({
			id: image.id,
			name: image.name ?? 'Sin nombre',
			description: image.description ?? null,
			path: image.path ?? '',
			hash: image.hash ?? '',
			size: image.size ?? 0,
			width: image.width ?? 0,
			height: image.height ?? 0,
			metadata: image.metadata ?? null,
			isFavorite: image.isFavorite ?? false,
			folderId: image.folderId ?? '',
			addedAt: image.addedAt ?? image.createdAt ?? new Date(),
			createdAt: image.createdAt ?? new Date(),
			updatedAt: image.updatedAt ?? new Date(),
			sortBy: (image as any).sortBy ?? 'createdAt',
			filters: (image as any).filters ?? '[]',
		});
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo crear la imagen',
		});
	}
}

/**
 * Actualiza una imagen existente
 */
export async function updateImage(id: string, data: UpdateImageData): Promise<ImageBase> {
	try {
		// Primero verificamos que la imagen exista
		const existingImage = await prisma.image.findUnique({
			where: { id },
		});

		if (!existingImage) {
			throw createEntityNotFoundError('Imagen', id, SERVER_ACTION_NAME);
		}

		// Validar que name siempre sea string
		const safeName = data.name ?? existingImage.name ?? 'Sin nombre';
		// Preparar datos para Prisma usando el transformer
		const prismaData = imageTransformer.toDB({ ...data, name: safeName });
		const updated = await prisma.image.update({
			where: { id },
			data: Object.fromEntries(
				Object.entries(prismaData).filter(([key, _value]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
			),
		});

		// Revalidar rutas
		revalidatePath('/');
		revalidatePath(`/images/${id}`);

		return imageTransformer.fromDB({
			id: updated.id,
			name: updated.name ?? 'Sin nombre',
			description: updated.description ?? null,
			path: updated.path ?? '',
			hash: updated.hash ?? '',
			size: updated.size ?? 0,
			width: updated.width ?? 0,
			height: updated.height ?? 0,
			metadata: updated.metadata ?? null,
			isFavorite: updated.isFavorite ?? false,
			folderId: updated.folderId ?? '',
			addedAt: updated.addedAt ?? updated.createdAt ?? new Date(),
			createdAt: updated.createdAt ?? new Date(),
			updatedAt: updated.updatedAt ?? new Date(),
			sortBy: (updated as any).sortBy ?? 'createdAt',
			filters: (updated as any).filters ?? '[]',
		});
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo actualizar la imagen',
		});
	}
}

/**
 * Actualiza el estado de favorito de una imagen
 */
export async function updateFavoriteStatus(
	id: string,
	isFavorite: boolean
): Promise<Pick<ImageBase, 'id' | 'name' | 'isFavorite'>> {
	try {
		// Verificar que la imagen exista
		const existingImage = await prisma.image.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingImage) {
			throw createEntityNotFoundError('Imagen', id, SERVER_ACTION_NAME);
		}

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
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo actualizar el estado de favorito de la imagen',
		});
	}
}

/**
 * Obtiene todas las imágenes marcadas como favoritas
 */
export async function getFavoriteImages(): Promise<ImageExtended[]> {
	try {
		const favorites = await prisma.image.findMany({
			where: { isFavorite: true },
			orderBy: { updatedAt: 'desc' },
			include: {
				tags: { select: { id: true, name: true, color: true } },
				collections: { select: { id: true, name: true, color: true, emoji: true } },
				albums: { select: { id: true, name: true, emoji: true } },
				characters: { select: { id: true, name: true, emoji: true } },
				places: { select: { id: true, name: true, emoji: true } },
				worldItems: { select: { id: true, name: true, emoji: true } },
				concepts: { select: { id: true, name: true, emoji: true } },
				prompts: { select: { id: true, name: true, emoji: true } },
				notes: { select: { id: true, title: true } }, // emoji eliminado
				wildcards: { select: { id: true, name: true, emoji: true, color: true } },
				properties: { select: { id: true, name: true, emoji: true, color: true } },
				groups: { select: { id: true, name: true, emoji: true, color: true } },
				stats: true,
			},
		});

		// Transformar imágenes utilizando el transformer
		return favorites.map((img) => {
			const baseImage = imageTransformer.fromDB({
				id: img.id,
				name: img.name ?? 'Sin nombre',
				description: img.description ?? null,
				path: img.path ?? '',
				hash: img.hash ?? '',
				size: img.size ?? 0,
				width: img.width ?? 0,
				height: img.height ?? 0,
				metadata: img.metadata ?? null,
				isFavorite: img.isFavorite ?? false,
				folderId: img.folderId ?? '',
				addedAt: img.addedAt ?? img.createdAt ?? new Date(),
				sortBy: (img as any).sortBy ?? 'createdAt',
				filters: (img as any).filters ?? '[]',
			});
			return imageTransformer.toClient(baseImage) as ImageExtended;
		});
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudieron obtener las imágenes favoritas',
		});
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
				{ name: { contains: search } },
				{ path: { contains: search } },
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
				tags: { select: { id: true, name: true, color: true } },
				collections: { select: { id: true, name: true, color: true, emoji: true } },
				albums: { select: { id: true, name: true, emoji: true } },
				characters: { select: { id: true, name: true, emoji: true } },
				places: { select: { id: true, name: true, emoji: true } },
				worldItems: { select: { id: true, name: true, emoji: true } },
				stats: true,
			},
		});

		// Transformar imágenes utilizando el transformer
		const processedImages = images.map((img) => {
			const baseImage = imageTransformer.fromDB({
				id: img.id,
				name: img.name ?? 'Sin nombre',
				description: img.description ?? null,
				path: img.path ?? '',
				hash: img.hash ?? '',
				size: img.size ?? 0,
				width: img.width ?? 0,
				height: img.height ?? 0,
				metadata: img.metadata ?? null,
				isFavorite: img.isFavorite ?? false,
				folderId: img.folderId ?? '',
				addedAt: img.addedAt ?? img.createdAt ?? new Date(),
				sortBy: (img as any).sortBy ?? 'createdAt',
				filters: (img as any).filters ?? '[]',
			});
			return imageTransformer.toClient(baseImage) as ImageResult;
		});

		return {
			images: processedImages,
			total,
			page,
			pageSize,
		};
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudieron obtener las imágenes',
		});
	}
}

/**
 * Elimina una imagen
 */
export async function deleteImage(id: string): Promise<void> {
	try {
		// Verificar que la imagen exista
		const existingImage = await prisma.image.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingImage) {
			throw createEntityNotFoundError('Imagen', id, SERVER_ACTION_NAME);
		}

		await prisma.image.delete({
			where: { id },
		});

		// Revalidar rutas
		revalidatePath('/');
		revalidatePath('/images');

		// Emitir eventos
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo eliminar la imagen',
		});
	}
}
