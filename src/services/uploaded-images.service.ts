/**
 * @file Servicio para gestión de imágenes subidas
 * @module services/uploaded-images
 * @description Servicio completo para operaciones CRUD de imágenes subidas, usando tipos canónicos y un enfoque moderno.
 */

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { createEntityNotFoundError, ServiceErrorCode, toServiceError } from '@/lib/utils/errors';
import { mapCreateInputToPrisma, mapUpdateInputToPrisma } from '@/transformers/uploaded-image/mappers';
import {
    transformToUploadedImage,
    transformToUploadedImageWithRelations,
} from '@/transformers/uploaded-image/transformer';
import type {
    GetUploadedImagesFilters,
    UploadedImageBase,
    UploadedImageCreateInput,
    UploadedImageExtended,
    UploadedImageUpdateInput,
} from '@/types/entities/uploaded-image/types';
import type { Prisma } from '@prisma/client';

const SERVICE_NAME = 'UploadedImagesService';
const logger = serverLogger.withContext(SERVICE_NAME);

class UploadedImagesService {
	private readonly prisma = getPrismaClient();

	// #region Métodos CRUD

	/**
	 * Crea una nueva imagen subida en la base de datos.
	 * @param data - Datos para crear la imagen.
	 * @returns La imagen creada, transformada al tipo canónico.
	 */
	public async createImage(data: UploadedImageCreateInput): Promise<UploadedImageBase> {
		try {
			const imageData = mapCreateInputToPrisma(data);
			const newImage = await this.prisma.uploadedImage.create({ data: imageData });

			logger.info('🖼️ Imagen subida creada exitosamente', { id: newImage.id });
			return transformToUploadedImage(newImage);
		} catch (error) {
			throw toServiceError(error as Error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al crear la imagen subida.',
				serviceName: SERVICE_NAME,
				context: { data },
			});
		}
	}

	/**
	 * Actualiza una imagen subida existente.
	 * @param id - El ID de la imagen a actualizar.
	 * @param data - Los datos a actualizar.
	 * @returns La imagen actualizada.
	 */
	public async updateImage(id: string, data: UploadedImageUpdateInput): Promise<UploadedImageBase> {
		try {
			const existingImage = await this.prisma.uploadedImage.findUnique({ where: { id } });
			if (!existingImage) {
				throw createEntityNotFoundError('UploadedImage', id, SERVICE_NAME);
			}

			const updateData = mapUpdateInputToPrisma(data);

			const updatedImage = await this.prisma.uploadedImage.update({
				where: { id },
				data: updateData,
			});

			logger.info('🔄 Imagen subida actualizada', { id });
			return transformToUploadedImage(updatedImage);
		} catch (error) {
			throw toServiceError(error as Error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: `Error al actualizar la imagen subida con ID: ${id}`,
				serviceName: SERVICE_NAME,
				context: { id, data },
			});
		}
	}

	/**
	 * Elimina una imagen subida por su ID.
	 * @param id - El ID de la imagen a eliminar.
	 */
	public async deleteImage(id: string): Promise<void> {
		try {
			await this.prisma.uploadedImage.delete({ where: { id } });
			logger.warn('🗑️ Imagen subida eliminada', { id });
		} catch (error) {
			const mappedError =
				error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
					? createEntityNotFoundError('UploadedImage', id, SERVICE_NAME)
					: toServiceError(error as Error, {
							code: ServiceErrorCode.DATABASE_ERROR,
							message: `Error al eliminar la imagen subida con ID: ${id}`,
							serviceName: SERVICE_NAME,
							context: { id },
						});
			throw mappedError;
		}
	}

	// #endregion

	// #region Métodos de Búsqueda y Consulta

	/**
	 * Obtiene una imagen por su ID.
	 * @param id - El ID de la imagen.
	 * @returns La imagen encontrada o null.
	 */
	public async getImageById(id: string): Promise<UploadedImageExtended | null> {
		try {
			const image = await this.prisma.uploadedImage.findUnique({
				where: { id },
				include: { image: true },
			});
			return image ? transformToUploadedImageWithRelations(image) : null;
		} catch (error) {
			throw toServiceError(error as Error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: `Error al obtener la imagen con ID: ${id}`,
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene una lista paginada de imágenes subidas con filtros.
	 * @param params - Parámetros de paginación y filtros.
	 * @returns Un objeto con los items y la información de paginación.
	 */
	public async getImages(params: GetUploadedImagesFilters = {}): Promise<{
		items: UploadedImageBase[];
		pagination: {
			total: number;
			page: number;
			pageSize: number;
			totalPages: number;
		};
	}> {
		const { page = 1, pageSize = 20, sortBy = 'uploadedAt', sortDirection = 'desc' } = params;

		try {
			const where = this.buildWhereClause(params);
			const orderBy: Prisma.UploadedImageOrderByWithRelationInput = { [sortBy]: sortDirection };

			const [total, rawImages] = await this.prisma.$transaction([
				this.prisma.uploadedImage.count({ where }),
				this.prisma.uploadedImage.findMany({
					where,
					orderBy,
					skip: (page - 1) * pageSize,
					take: pageSize,
				}),
			]);

			const items = rawImages.map(transformToUploadedImage);

			return {
				items,
				pagination: {
					total,
					page,
					pageSize,
					totalPages: Math.ceil(total / pageSize),
				},
			};
		} catch (error) {
			throw toServiceError(error as Error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al obtener la lista de imágenes subidas.',
				serviceName: SERVICE_NAME,
				context: { params },
			});
		}
	}

	/**
	 * Construye la cláusula `where` de Prisma a partir de los filtros.
	 */
	private buildWhereClause(filters: GetUploadedImagesFilters): Prisma.UploadedImageWhereInput {
		const where: Prisma.UploadedImageWhereInput = {};
		const { search, type, category, minSize, maxSize, minWidth, maxWidth, minHeight, maxHeight } = filters;

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ category: { contains: search, mode: 'insensitive' } },
			];
		}

		if (type) where.type = type;
		if (category) where.category = category;

		if (minSize !== undefined || maxSize !== undefined) {
			where.size = {};
			if (minSize !== undefined) where.size.gte = minSize;
			if (maxSize !== undefined) where.size.lte = maxSize;
		}
		if (minWidth !== undefined || maxWidth !== undefined) {
			where.width = {};
			if (minWidth !== undefined) where.width.gte = minWidth;
			if (maxWidth !== undefined) where.width.lte = maxWidth;
		}
		if (minHeight !== undefined || maxHeight !== undefined) {
			where.height = {};
			if (minHeight !== undefined) where.height.gte = minHeight;
			if (maxHeight !== undefined) where.height.lte = maxHeight;
		}

		return where;
	}

	// #endregion
}

export const uploadedImagesService = new UploadedImagesService();
