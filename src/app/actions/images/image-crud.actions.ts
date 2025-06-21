'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { revalidatePath } from 'next/cache';
// Importamos el transformer optimizado
import { fromPrismaImageWithCounts } from '@/transformers/image/transformer';
// Importamos tipos optimizados
import type { ImageCreateInput, ImageUpdateInput, ImageWithStats } from '@/types/entities/image/types';
import { createEntityNotFoundError, toServiceError } from '@/utils/errors/service-errors';
import type { GetImagesOptions, GetImagesResult } from './image-types.actions';

const SERVER_ACTION_NAME = 'ImageCRUD';
const imageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

/**
 * Obtiene una imagen por su ID con estadísticas optimizadas
 */
export async function getImage(id: string): Promise<ImageWithStats | null> {
	try {
		imageLogger.info('🔍 Obteniendo imagen:', id);

		const image = await prisma.image.findUnique({
			where: { id },
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!image) {
			imageLogger.warn('⚠️ Imagen no encontrada:', id);
			return null;
		}

		const result = fromPrismaImageWithCounts(image);
		imageLogger.info('✅ Imagen obtenida correctamente');
		return result;
	} catch (error) {
		imageLogger.error('❌ Error obteniendo imagen:', error);
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo obtener la imagen',
		});
	}
}

/**
 * Crea una nueva imagen con estadísticas iniciales
 */
export async function createImage(data: ImageCreateInput): Promise<ImageWithStats> {
	try {
		imageLogger.info('🆕 Creando imagen:', data.name);

		// Construir el objeto de datos para Prisma
		const prismaImageData: any = {
			name: data.name || 'Sin nombre',
			path: data.path,
			hash: data.hash,
			size: data.size,
			width: data.width,
			height: data.height,
			description: data.description || null,
			metadata: data.metadata || null,
			isFavorite: false,
		};

		// Manejar folderId
		if (data.folderId) {
			prismaImageData.folder = { connect: { id: data.folderId } };
		}

		const image = await prisma.image.create({
			data: prismaImageData,
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		// Crear estadísticas iniciales
		await prisma.imageStats.create({
			data: {
				imageId: image.id,
				views: 0,
			},
		});

		// Emisión de eventos
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);
		revalidatePath('/');

		const result = fromPrismaImageWithCounts(image);
		imageLogger.info('✅ Imagen creada correctamente');
		return result;
	} catch (error) {
		imageLogger.error('❌ Error creando imagen:', error);
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo crear la imagen',
		});
	}
}

/**
 * Actualiza una imagen existente
 */
export async function updateImage(id: string, data: ImageUpdateInput): Promise<ImageWithStats> {
	try {
		imageLogger.info('📝 Actualizando imagen:', id);

		// Verificar que la imagen exista
		const existingImage = await prisma.image.findUnique({
			where: { id },
		});

		if (!existingImage) {
			throw createEntityNotFoundError('Imagen', id, SERVER_ACTION_NAME);
		}

		// Preparar datos para actualización
		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;

		const updated = await prisma.image.update({
			where: { id },
			data: updateData,
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		// Revalidar rutas
		revalidatePath('/');
		revalidatePath(`/images/${id}`);

		const result = fromPrismaImageWithCounts(updated);
		imageLogger.info('✅ Imagen actualizada correctamente');
		return result;
	} catch (error) {
		imageLogger.error('❌ Error actualizando imagen:', error);
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
): Promise<Pick<ImageWithStats, 'id' | 'name' | 'isFavorite'>> {
	try {
		const updated = await prisma.image.update({
			where: { id },
			data: { isFavorite },
			select: { id: true, name: true, isFavorite: true },
		});

		revalidatePath('/');
		revalidatePath(`/images/${id}`);

		return {
			id: updated.id,
			name: updated.name || 'Sin nombre',
			isFavorite: updated.isFavorite || false,
		};
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo actualizar el estado de favorito',
		});
	}
}

/**
 * Obtiene todas las imágenes favoritas
 */
export async function getFavoriteImages(): Promise<ImageWithStats[]> {
	try {
		const images = await prisma.image.findMany({
			where: { isFavorite: true },
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
			orderBy: { updatedAt: 'desc' },
		});

		return images.map(fromPrismaImageWithCounts);
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudieron obtener las imágenes favoritas',
		});
	}
}

/**
 * Obtiene múltiples imágenes con paginación y filtros
 */
export async function getImages(options: GetImagesOptions = {}): Promise<GetImagesResult> {
	try {
		const {
			search,
			folderId,
			tags,
			isFavorite,
			pageSize = 50,
			page = 1,
			sortBy = 'updatedAt',
			sortOrder = 'desc',
		} = options;

		// Construir filtros
		const where: any = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		if (folderId) {
			where.folderId = folderId;
		}

		if (isFavorite !== undefined) {
			where.isFavorite = isFavorite;
		}

		if (tags && tags.length > 0) {
			where.tags = {
				some: {
					id: { in: tags },
				},
			};
		}

		// Obtener total y imágenes
		const [total, images] = await Promise.all([
			prisma.image.count({ where }),
			prisma.image.findMany({
				where,
				include: {
					tags: true,
					albums: true,
					collections: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					folder: { select: { id: true, name: true, path: true } },
					_count: {
						select: {
							tags: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							notes: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				},
				orderBy: { [sortBy]: sortOrder },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
		]);

		return {
			images: images.map(fromPrismaImageWithCounts),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize),
				hasNext: page * pageSize < total,
				hasPrev: page > 1,
			},
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
		imageLogger.info('🗑️ Eliminando imagen:', id);

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
		imageLogger.info('✅ Imagen eliminada correctamente');
	} catch (error) {
		imageLogger.error('❌ Error eliminando imagen:', error);
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'No se pudo eliminar la imagen',
		});
	}
}
